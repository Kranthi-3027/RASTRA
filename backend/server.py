from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message as MailMessage
from PIL import Image
from minio import Minio
import io, os, uuid, csv, json, threading
from datetime import datetime, timedelta, timezone

def utcnow():
    """Timezone-aware UTC now — replaces deprecated utcnow()."""
    return datetime.now(timezone.utc)
from dotenv import load_dotenv

load_dotenv()

# =============================================================================
# RASHTRA BACKEND SERVER — PostgreSQL Edition
# =============================================================================

app = Flask(__name__)
CORS(app)

# =============================================================================
# MAIL CONFIG
# If SMTP_USER is not set the system runs in DRY_RUN mode — emails are printed
# to the console instead of being sent, so dev works without any SMTP setup.
# =============================================================================
app.config.update(
    MAIL_SERVER   = os.environ.get("SMTP_HOST", "smtp.gmail.com"),
    MAIL_PORT     = int(os.environ.get("SMTP_PORT", 587)),
    MAIL_USE_TLS  = True,
    MAIL_USERNAME = os.environ.get("SMTP_USER", ""),
    MAIL_PASSWORD = os.environ.get("SMTP_PASSWORD", ""),
    MAIL_DEFAULT_SENDER = os.environ.get("EMAIL_FROM", "noreply@rashtra-solapur.gov.in"),
)
mail = Mail(app)
MAIL_DRY_RUN = not bool(os.environ.get("SMTP_USER", "").strip())

# Department contact emails (from .env, with sensible fallbacks)
DEPT_EMAILS = {
    "Engineering": os.environ.get("DEPT_EMAIL_ENGINEERING", "engineering@solapur-mc.gov.in"),
    "Traffic":     os.environ.get("DEPT_EMAIL_TRAFFIC",     "traffic@solapur-mc.gov.in"),
    "Ward":        os.environ.get("DEPT_EMAIL_WARD",        "ward@solapur-mc.gov.in"),
    "Water":       os.environ.get("DEPT_EMAIL_WATER",       "water@solapur-mc.gov.in"),
}

STATUS_LABELS = {
    "Uploaded":         "Submitted — Pending AI Verification",
    "Verified":         "AI Verified — Awaiting Assignment",
    "Workers Assigned": "Workers Assigned — Repair In Progress",
    "Pending Verification": "Pending Department Verification",
    "Repaired":         "Repaired — Complaint Closed",
    "Waiting List":     "On Waiting List — Pending Manual Review",
    "Rejected":         "Rejected by Department",
}

def _send_email_async(subject: str, recipients: list[str], body: str):
    """Send email in a background thread so it never blocks the request."""
    if MAIL_DRY_RUN:
        print(f"\n[EMAIL DRY-RUN] To: {recipients}\nSubject: {subject}\n{body}\n{'='*60}")
        return
    def _send():
        with app.app_context():
            try:
                msg = MailMessage(subject=subject, recipients=recipients, body=body)
                mail.send(msg)
                print(f"[EMAIL SENT] {subject} → {recipients}")
            except Exception as e:
                print(f"[EMAIL FAILED] {e}")
    threading.Thread(target=_send, daemon=True).start()


def notify_dept_new_complaint(complaint, dept: str):
    """Email the department when a new complaint is auto-routed to them."""
    email = DEPT_EMAILS.get(dept)
    if not email:
        return
    subject = f"[RASHTRA] New Complaint Auto-Routed — {complaint.id} ({complaint.severity} Severity)"
    body = f"""Dear {dept} Department Officer,

A new civic complaint has been auto-routed to your department by the RASHTRA AI system.

Token ID  : {complaint.id}
Severity  : {complaint.severity} (Score: {round(complaint.severity_score or 0, 1)}/10)
Address   : {complaint.address}
Description: {complaint.description or 'N/A'}
SLA Deadline: {complaint.sla_deadline.strftime('%d %b %Y, %I:%M %p') if complaint.sla_deadline else 'N/A'}

Please log in to the RASHTRA Department Dashboard to review and assign a contractor.
Failing to acknowledge within the SLA window will trigger automatic escalation to the Commissioner.

— RASHTRA Automated Notification System
  Solapur Municipal Corporation
"""
    _send_email_async(subject, [email], body)


def notify_user_status_change(user_email: str, user_name: str, complaint, new_status: str):
    """Email the citizen when their complaint status changes."""
    if not user_email or '@rashtra.local' in user_email:
        return  # ghost/placeholder users have no real email
    label = STATUS_LABELS.get(new_status, new_status)
    subject = f"[RASHTRA] Complaint {complaint.id} — Status Updated: {new_status}"
    body = f"""Dear {user_name},

Your complaint has been updated on the RASHTRA portal.

Token ID  : {complaint.id}
New Status: {label}
Address   : {complaint.address}
Updated At: {utcnow().strftime('%d %b %Y, %I:%M %p UTC')}

{"Your complaint has been marked as repaired. Thank you for helping improve Solapur's infrastructure!" if new_status == 'Repaired' else "You can track real-time progress and SLA timelines on your Complaint Status page."}

Track your complaint: https://rashtra-solapur.gov.in/user/status

— RASHTRA Notification System
  Solapur Municipal Corporation | helpdesk@solapur-mc.gov.in | 0217-274-0300
"""
    _send_email_async(subject, [user_email], body)


# --- REVERSE GEOCODING ---
import urllib.request as _urllib_req

def reverse_geocode(lat: float, lng: float) -> str:
    """Return a human-readable location name using Nominatim OSM (free, no key needed)."""
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json&zoom=17&addressdetails=1"
        req = _urllib_req.Request(url, headers={"User-Agent": "RASHTRA-Solapur/1.0"})
        with _urllib_req.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode())
        address = data.get("address", {})
        parts = []
        for key in ("road", "suburb", "neighbourhood", "village", "town", "city_district", "city"):
            val = address.get(key)
            if val and val not in parts:
                parts.append(val)
                if len(parts) == 2:
                    break
        city = address.get("city") or address.get("town") or address.get("village") or ""
        label = ", ".join(parts) if parts else data.get("display_name", "")[:60]
        if city and city not in label:
            label = f"{label}, {city}"
        return label or f"{lat:.4f}, {lng:.4f}"
    except Exception:
        return f"{lat:.4f}, {lng:.4f}"


# --- OBJECT STORAGE CONFIG (Cloudflare R2 — S3-compatible, drop-in MinIO replacement) ---
# R2 endpoint format: <account_id>.r2.cloudflarestorage.com  (NO https://, NO trailing slash)
# Get this from: Cloudflare Dashboard → R2 → your bucket → Settings → S3 API
MINIO_ENDPOINT   = os.environ.get("R2_ENDPOINT",           "")
MINIO_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY_ID",      "")
MINIO_SECRET_KEY = os.environ.get("R2_SECRET_ACCESS_KEY",  "")
MINIO_BUCKET     = os.environ.get("R2_BUCKET",             "rashtra-images")
# Public URL: enable "Public Access" on your R2 bucket → copy the r2.dev URL
# Format: https://pub-<hash>.r2.dev  (NO trailing slash)
MINIO_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL",         "")

def _get_minio_client():
    """Return Minio client only if R2_ENDPOINT is configured, else None."""
    if not MINIO_ENDPOINT:
        return None
    try:
        return Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=True,
        )
    except Exception as e:
        print(f"⚠️  Minio client init failed: {e}")
        return None

minio_client = _get_minio_client()

def ensure_bucket():
    if not minio_client:
        print("⚠️  R2 storage not configured — skipping bucket check")
        return
    try:
        exists = minio_client.bucket_exists(MINIO_BUCKET)
        if exists:
            print(f"✅ R2 bucket ready: {MINIO_BUCKET}")
        else:
            print(f"⚠️  R2 bucket '{MINIO_BUCKET}' not found. Create it in the Cloudflare R2 dashboard.")
    except Exception as e:
        print(f"⚠️  R2 storage not available: {e}")

def upload_to_minio(file_bytes: bytes, filename: str, content_type: str, folder: str = "complaints") -> str:
    if not minio_client:
        raise RuntimeError("R2 storage is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY env vars.")
    object_name = f"{folder}/{uuid.uuid4()}-{filename}"
    minio_client.put_object(MINIO_BUCKET, object_name, io.BytesIO(file_bytes),
                            length=len(file_bytes), content_type=content_type)
    return f"{MINIO_PUBLIC_URL}/{object_name}"

_raw_db_url = os.environ.get("DATABASE_URL", "")
if _raw_db_url.startswith("postgres://"):
    _raw_db_url = _raw_db_url.replace("postgres://", "postgresql://", 1)
DATABASE_URL = _raw_db_url if _raw_db_url else "postgresql://postgres:postgres@localhost:5432/rashtra"
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# =============================================================================
# MODELS
# =============================================================================

class User(db.Model):
    __tablename__ = "users"
    id         = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name       = db.Column(db.String, nullable=False)
    email      = db.Column(db.String, unique=True, nullable=False)
    role       = db.Column(db.String, nullable=False, default="USER")
    avatar_url = db.Column(db.String)
    phone      = db.Column(db.String)
    address    = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email,
                "role": self.role, "avatarUrl": self.avatar_url,
                "phoneNumber": self.phone, "address": self.address}


class Complaint(db.Model):
    __tablename__ = "complaints"
    id                     = db.Column(db.String, primary_key=True)
    user_id                = db.Column(db.String, db.ForeignKey("users.id"), nullable=False)
    image_url              = db.Column(db.String)
    latitude               = db.Column(db.Float, default=0)
    longitude              = db.Column(db.Float, default=0)
    status                 = db.Column(db.String, default="Uploaded")
    severity               = db.Column(db.String, default="Low")
    severity_score         = db.Column(db.Float, default=0)
    priority_rank          = db.Column(db.Float, default=0)   # severityScore + road bonus, used for queue ordering
    road_type              = db.Column(db.String, nullable=True)  # OSM-derived road classification
    description            = db.Column(db.Text)
    address                = db.Column(db.String)
    timestamp              = db.Column(db.DateTime, default=utcnow)
    departments            = db.Column(db.ARRAY(db.String), default=[])
    concern_count          = db.Column(db.Integer, default=0)
    community_report_count = db.Column(db.Integer, default=0)
    traffic_alert          = db.Column(db.Boolean, default=False)
    assigned_contractor_id = db.Column(db.String, db.ForeignKey("contractors.id"), nullable=True)
    contractor_assigned_at = db.Column(db.DateTime)
    repair_evidence_url    = db.Column(db.String)
    rejection_reason       = db.Column(db.Text, nullable=True)  # set on reject, cleared on re-submission
    repaired_at            = db.Column(db.DateTime)
    sla_hours              = db.Column(db.Integer, default=48)
    sla_deadline           = db.Column(db.DateTime)
    escalation_level       = db.Column(db.String, default="NONE")
    auto_routed_dept       = db.Column(db.String)
    routing_confidence     = db.Column(db.Float)
    routing_keywords       = db.Column(db.ARRAY(db.String), default=[])
    escalation_history     = db.Column(db.JSON, default=[])
    report_stats           = db.Column(db.JSON, default={"duplicate":0,"fake":0,"fixed":0,"wrongLocation":0})
    assigned_constable     = db.Column(db.JSON)
    # --- SOFT DELETE ---
    deleted_at             = db.Column(db.DateTime, nullable=True)
    deleted_by             = db.Column(db.String, nullable=True)   # user/actor id
    deleted_by_name        = db.Column(db.String, nullable=True)   # display name
    deleted_by_role        = db.Column(db.String, nullable=True)   # USER/ADMIN/DEPT
    delete_reason          = db.Column(db.Text, nullable=True)

    comments               = db.relationship("Comment", backref="complaint", cascade="all, delete-orphan")

    def to_dict(self, include_deleted=False):
        d = {
            "id": self.id, "userId": self.user_id,
            "imageUrl": self.image_url, "latitude": self.latitude, "longitude": self.longitude,
            "status": self.status, "severity": self.severity, "severityScore": self.severity_score,
            "priorityRank": self.priority_rank, "roadType": self.road_type,
            "description": self.description, "address": self.address,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "departments": self.departments or [], "concernCount": self.concern_count,
            "communityReportCount": self.community_report_count or 0,
            "hasRaisedConcern": False, "hasReported": False, "trafficAlert": self.traffic_alert,
            "assignedContractorId": self.assigned_contractor_id,
            "contractorAssignedDate": self.contractor_assigned_at.isoformat() if self.contractor_assigned_at else None,
            "repairEvidenceUrl": self.repair_evidence_url,
            "rejectionReason": self.rejection_reason,
            "repairedDate": self.repaired_at.isoformat() if self.repaired_at else None,
            "slaHours": self.sla_hours,
            "slaDeadline": self.sla_deadline.isoformat() if self.sla_deadline else None,
            "escalationLevel": self.escalation_level, "escalationHistory": self.escalation_history or [],
            "reportStats": self.report_stats or {"duplicate":0,"fake":0,"fixed":0,"wrongLocation":0},
            "assignedConstable": self.assigned_constable,
            "autoRoutedDept": self.auto_routed_dept, "routingConfidence": self.routing_confidence,
            "routingKeywords": self.routing_keywords or [],
            "comments": [c.to_dict() for c in self.comments],
        }
        if include_deleted:
            d["deletedAt"]      = self.deleted_at.isoformat() if self.deleted_at else None
            d["deletedBy"]      = self.deleted_by
            d["deletedByName"]  = self.deleted_by_name
            d["deletedByRole"]  = self.deleted_by_role
            d["deleteReason"]   = self.delete_reason
        return d


class Comment(db.Model):
    __tablename__ = "comments"
    id           = db.Column(db.String, primary_key=True, default=lambda: f"cmt-{uuid.uuid4()}")
    complaint_id = db.Column(db.String, db.ForeignKey("complaints.id"), nullable=False)
    user_id      = db.Column(db.String, nullable=False)
    user_name    = db.Column(db.String, nullable=False)
    text         = db.Column(db.Text, nullable=False)
    avatar_url   = db.Column(db.String)
    timestamp    = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {"id": self.id, "userId": self.user_id, "userName": self.user_name,
                "text": self.text, "avatarUrl": self.avatar_url,
                "timestamp": self.timestamp.isoformat()}


class Contractor(db.Model):
    __tablename__      = "contractors"
    id                 = db.Column(db.String, primary_key=True)
    name               = db.Column(db.String, nullable=False)
    company            = db.Column(db.String, nullable=False)
    specialization     = db.Column(db.String)
    rating             = db.Column(db.Float, default=0)
    active_projects    = db.Column(db.Integer, default=0)
    completed_projects = db.Column(db.Integer, default=0)
    contact            = db.Column(db.String)
    status             = db.Column(db.String, default="Verified")
    history            = db.Column(db.JSON, default=[])

    def to_dict(self):
        return {"id": self.id, "name": self.name, "company": self.company,
                "specialization": self.specialization, "rating": self.rating,
                "activeProjects": self.active_projects, "completedProjects": self.completed_projects,
                "contact": self.contact, "status": self.status, "history": self.history or []}


class TrafficPersonnel(db.Model):
    __tablename__    = "traffic_personnel"
    id               = db.Column(db.String, primary_key=True)
    name             = db.Column(db.String, nullable=False)
    rank             = db.Column(db.String)
    badge_number     = db.Column(db.String)
    phone            = db.Column(db.String)
    status           = db.Column(db.String, default="Available")
    current_location = db.Column(db.String)
    last_active      = db.Column(db.String)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "rank": self.rank,
                "badgeNumber": self.badge_number, "phone": self.phone,
                "status": self.status, "currentLocation": self.current_location,
                "lastActive": self.last_active}


class Announcement(db.Model):
    __tablename__ = "announcements"
    id         = db.Column(db.String, primary_key=True, default=lambda: f"ann-{uuid.uuid4()}")
    message    = db.Column(db.Text, nullable=False)
    type       = db.Column(db.String, default="INFO")
    target     = db.Column(db.String, default="ALL")
    timestamp  = db.Column(db.DateTime, default=utcnow)
    active     = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.String, default="Admin")

    def to_dict(self):
        return {"id": self.id, "message": self.message, "type": self.type,
                "target": self.target, "timestamp": self.timestamp.isoformat(),
                "active": self.active, "createdBy": self.created_by}


class AdminLog(db.Model):
    __tablename__ = "admin_logs"
    id        = db.Column(db.String, primary_key=True, default=lambda: f"log-{uuid.uuid4()}")
    type      = db.Column(db.String, nullable=False)
    timestamp = db.Column(db.DateTime, default=utcnow)
    details   = db.Column(db.Text)

    def to_dict(self):
        return {"id": self.id, "type": self.type,
                "timestamp": self.timestamp.isoformat(), "details": self.details}


class AppealRequest(db.Model):
    """Department appeals a complaint as not belonging to their dept."""
    __tablename__ = "appeal_requests"
    id           = db.Column(db.String, primary_key=True, default=lambda: f"apl-{uuid.uuid4()}")
    complaint_id = db.Column(db.String, db.ForeignKey("complaints.id"), nullable=False)
    from_dept    = db.Column(db.String, nullable=False)
    reason       = db.Column(db.Text, nullable=False)
    status       = db.Column(db.String, default="PENDING")   # PENDING / APPROVED / REJECTED
    assigned_to  = db.Column(db.String, nullable=True)       # dept admin assigned it to
    reviewed_by  = db.Column(db.String, nullable=True)       # admin who reviewed
    created_at   = db.Column(db.DateTime, default=utcnow)
    reviewed_at  = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "complaintId": self.complaint_id,
            "fromDept": self.from_dept, "reason": self.reason,
            "status": self.status, "assignedTo": self.assigned_to,
            "reviewedBy": self.reviewed_by,
            "createdAt": self.created_at.isoformat(),
            "reviewedAt": self.reviewed_at.isoformat() if self.reviewed_at else None,
        }


class Message(db.Model):
    """Inter-department and group chat messages between officials."""
    __tablename__ = "messages"
    id          = db.Column(db.String, primary_key=True, default=lambda: f"msg-{uuid.uuid4()}")
    channel     = db.Column(db.String, nullable=False)   # "GROUP" | "Engineering-Water" etc (sorted dept pair)
    sender_id   = db.Column(db.String, nullable=False)
    sender_name = db.Column(db.String, nullable=False)
    sender_dept = db.Column(db.String)                   # dept name or "Admin"
    text        = db.Column(db.Text, nullable=False)
    timestamp   = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id, "channel": self.channel,
            "senderId": self.sender_id, "senderName": self.sender_name,
            "senderDept": self.sender_dept, "text": self.text,
            "timestamp": self.timestamp.isoformat(),
        }


# =============================================================================
# BUSINESS LOGIC
# =============================================================================

DEPARTMENT_RULES = [
    {"dept": "Water",       "keywords": ["water","leak","pipe","burst","flood","drain","sewage","drainage","overflow","puddle","waterlogging","manhole","sewer"], "weight": 1.4},
    {"dept": "Traffic",     "keywords": ["signal","traffic","light","sign","marking","divider","hazard","accident","junction","crossing","speed breaker","barrier"], "weight": 1.3},
    {"dept": "Ward",        "keywords": ["garbage","waste","trash","debris","litter","dumping","stray","encroach","footpath","tree","fallen"], "weight": 1.2},
    {"dept": "Engineering", "keywords": ["pothole","road","crack","surface","asphalt","tar","repair","construction","bridge","flyover","pavement","concrete","damage","broken"], "weight": 1.0},
]

def auto_route_department(description, ai_label):
    text = f"{description} {ai_label}".lower()
    best_dept, best_score, best_keywords = "Engineering", 0, []
    for rule in DEPARTMENT_RULES:
        matched = [kw for kw in rule["keywords"] if kw in text]
        score = len(matched) * rule["weight"]
        if score > best_score:
            best_score, best_dept, best_keywords = score, rule["dept"], matched
    confidence = 0.55 if not best_keywords else min(0.98, 0.60 + len(best_keywords) * 0.08)
    return best_dept, confidence, best_keywords

def get_sla_hours(severity, department):
    base = {"High": 24, "Medium": 48, "Low": 72}
    hours = base.get(severity, 48)
    if department == "Traffic": return min(hours, 12)
    if department == "Water" and severity == "High": return 18
    return hours

def _log(type_, details=None):
    log = AdminLog(type=type_, details=details)
    db.session.add(log)
    db.session.commit()


# =============================================================================
# AI MODELS
# =============================================================================

print("--- RASHTRA AI BACKEND INITIALIZING ---")
model1 = None
model2 = None
try:
    import importlib
    ultralytics = importlib.import_module("ultralytics")
    YOLO = ultralytics.YOLO
    model1 = YOLO(os.path.join(os.path.dirname(__file__), "models", "pothole_model.pt"))
    print("✅ Model 1 Loaded")
except ModuleNotFoundError:
    print("⚠️  ultralytics not installed — AI detection endpoints disabled")
except Exception as e:
    print(f"⚠️  Model 1 simulation mode: {e}")

try:
    import importlib
    ultralytics = importlib.import_module("ultralytics")
    YOLO = ultralytics.YOLO
    model2 = YOLO(os.path.join(os.path.dirname(__file__), "models", "damage_model.pt"))
    print("✅ Model 2 Loaded")
except ModuleNotFoundError:
    print("⚠️  ultralytics not installed — AI detection endpoints disabled")
except Exception as e:
    print(f"⚠️  Model 2 simulation mode: {e}")


def process_yolo_result(results, current_model):
    detected, max_conf, label = False, 0.0, "Unknown"
    for r in results:
        for box in r.boxes:
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            cls_name = current_model.names[cls_id] if current_model else "object"
            if conf > max_conf:
                max_conf, label, detected = conf, cls_name, True
    return detected, max_conf, label


# =============================================================================
# ROUTES
# =============================================================================
@app.after_request
def add_headers(response):
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    response.headers['ngrok-skip-browser-warning'] = 'true'
    return response

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "db": "postgresql"})

# --- USERS ---
@app.route("/api/users/<user_id>")
def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user: return jsonify({"error": "Not found"}), 404
    return jsonify(user.to_dict())

@app.route("/api/users/<user_id>", methods=["PATCH"])
def update_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "Not found"}), 404
    data = request.json or {}
    ALLOWED_FIELDS = {"name", "phone", "address", "avatarUrl"}
    for field in ALLOWED_FIELDS:
        if field in data:
            col = {"avatarUrl": "avatar_url", "phone": "phone", "address": "address", "name": "name"}[field]
            setattr(user, col, data[field])
    db.session.commit()
    return jsonify(user.to_dict())

@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.json or {}
    if not data.get("email") or not data.get("name"):
        return jsonify({"error": "name and email are required"}), 400
    # Upsert: return existing user if email already exists
    existing = User.query.filter_by(email=data["email"]).first()
    if existing:
        # Update avatar/name if provided (e.g. Google photo changed)
        updated = False
        if data.get("avatarUrl") and not existing.avatar_url:
            existing.avatar_url = data["avatarUrl"]
            updated = True
        if data.get("name") and existing.name != data["name"] and existing.name in ("Citizen", ""):
            existing.name = data["name"]
            updated = True
        if updated:
            db.session.commit()
        return jsonify(existing.to_dict()), 200
    user = User(
        id=data.get("id") or str(uuid.uuid4()),
        name=data["name"],
        email=data["email"],
        role=data.get("role", "USER"),
        avatar_url=data.get("avatarUrl"),
        phone=data.get("phoneNumber"),
        address=data.get("address"),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

# --- COMPLAINTS ---
@app.route("/api/complaints")
def get_complaints():
    user_id       = request.args.get("userId")
    dept          = request.args.get("dept")          # filter by dept name (dept dashboard)
    role          = request.args.get("role", "")      # "ADMIN" sees everything
    unassigned    = request.args.get("unassigned")    # "true" = only unassigned
    contractor_id = request.args.get("contractorId")  # contractor sees only their work

    # Only return non-deleted complaints for normal queries
    q = Complaint.query.filter_by(deleted_at=None)

    if contractor_id:
        # Contractor sees ONLY complaints assigned to them
        q = q.filter_by(assigned_contractor_id=contractor_id)
    elif user_id:
        q = q.filter_by(user_id=user_id)
    elif role == "ADMIN":
        pass  # Admin sees all complaints — no extra filter
    elif dept:
        # Dept sees complaints where their name appears in the departments array
        # Use PostgreSQL ANY() for reliable array membership check
        q = q.filter(db.text("(:dept) = ANY(departments)").bindparams(dept=dept))

    if unassigned == "true":
        # Complaints with no department assigned (empty array or null)
        q = q.filter(
            (Complaint.departments == None) |
            (Complaint.departments == []) |
            (db.func.array_length(Complaint.departments, 1) == None)
        )

    return jsonify([c.to_dict() for c in q.order_by(Complaint.priority_rank.desc(), Complaint.timestamp.desc()).all()])

@app.route("/api/complaints/<cid>")
def get_complaint(cid):
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404
    return jsonify(c.to_dict())

@app.route("/api/complaints/submit", methods=["POST"])
def submit_complaint():
    data        = request.json
    description = data.get("description", "")
    ai_label    = data.get("aiLabel", "")
    severity    = data.get("severity", "Low")

    user_id = data["userId"]
    if not db.session.get(User, user_id):
        ghost = User(id=user_id, name=data.get("userName", "Citizen"),
                     email=f"{user_id}@rashtra.local", role="USER")
        db.session.add(ghost)
        db.session.flush()

    dept, confidence, keywords = auto_route_department(description, ai_label)
    sla_hours    = get_sla_hours(severity, dept)
    sla_deadline = utcnow() + timedelta(hours=sla_hours)
    complaint_id = data.get("id") or f"TKN-{str(uuid.uuid4())[:8].upper()}"

    # Enrich address: prefer frontend-supplied address, fallback to reverse geocode
    lat = data.get("latitude", 0)
    lng = data.get("longitude", 0)
    raw_address = data.get("address", "")
    # If address looks like plain coords or is missing, do reverse geocode
    if not raw_address or raw_address in ("Unknown", "") or (
        raw_address.replace(".", "").replace(",", "").replace(" ", "").replace("-", "").isdigit()
    ):
        enriched_address = reverse_geocode(lat, lng)
    else:
        enriched_address = raw_address

    c = Complaint(
        id=complaint_id, user_id=user_id,
        image_url=data.get("imageUrl"), latitude=lat, longitude=lng,
        status=data.get("status", "Uploaded"), severity=severity, severity_score=data.get("severityScore", 0),
        priority_rank=data.get("priorityRank", 0), road_type=data.get("roadType"),
        description=description, address=enriched_address,
        departments=[dept], sla_hours=sla_hours, sla_deadline=sla_deadline,
        auto_routed_dept=dept, routing_confidence=confidence, routing_keywords=keywords,
        escalation_level="NONE", escalation_history=[],
        report_stats={"duplicate":0,"fake":0,"fixed":0,"wrongLocation":0},
    )
    db.session.add(c)
    db.session.commit()
    # Notify the auto-routed department
    notify_dept_new_complaint(c, dept)
    # Notify the submitting user (if real email)
    user = db.session.get(User, user_id)
    if user:
        notify_user_status_change(user.email, user.name, c, "Uploaded")
    return jsonify(c.to_dict()), 201

@app.route("/api/complaints/<cid>/status", methods=["PATCH"])
def update_status(cid):
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404
    new_status = request.json["status"]
    c.status = new_status
    db.session.commit()
    # Notify the citizen about every status change
    user = db.session.get(User, c.user_id)
    if user:
        notify_user_status_change(user.email, user.name, c, new_status)
    return jsonify(c.to_dict())

@app.route("/api/complaints/<cid>/assign", methods=["PATCH"])
def assign_complaint(cid):
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404

    new_dept = request.json["department"]

    # ── Duplicate-assign guard ────────────────────────────────────────────────
    # If a complaint is already assigned AND the admin is trying to assign it to
    # a DIFFERENT department, require an explicit override flag.
    already_assigned = c.status == "Workers Assigned"
    current_dept = (c.departments or [None])[0]
    if already_assigned and current_dept and current_dept != new_dept:
        if not request.json.get("forceReassign", False):
            return jsonify({
                "error": f"Complaint is already assigned to {current_dept}. "
                         f"Pass forceReassign=true to override.",
                "currentDept": current_dept,
                "requiresConfirmation": True,
            }), 409

    old_status = c.status
    c.status = "Workers Assigned"
    c.departments = [new_dept]
    c.auto_routed_dept = new_dept
    db.session.commit()

    # Notify the newly assigned department
    notify_dept_new_complaint(c, new_dept)

    # Notify the citizen only if this is the first assignment (status changed)
    if old_status != "Workers Assigned":
        user = db.session.get(User, c.user_id)
        if user:
            notify_user_status_change(user.email, user.name, c, "Workers Assigned")

    return jsonify(c.to_dict())

@app.route("/api/complaints/<cid>/concern", methods=["POST"])
def toggle_concern(cid):
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404
    if request.json.get("action") == "add":
        c.concern_count += 1
    else:
        c.concern_count = max(0, c.concern_count - 1)
    db.session.commit()
    return jsonify(c.to_dict())

@app.route("/api/complaints/<cid>/community-report", methods=["POST"])
def toggle_community_report(cid):
    """Users report a complaint they also witnessed — increments community_report_count."""
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404
    c.community_report_count = (c.community_report_count or 0) + 1
    db.session.commit()
    return jsonify({"communityReportCount": c.community_report_count})

@app.route("/api/complaints/<cid>/flag", methods=["POST"])
def flag_complaint(cid):
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404
    reason = request.json.get("reason")
    stats  = c.report_stats or {"duplicate":0,"fake":0,"fixed":0,"wrongLocation":0}
    if reason == "Duplicate": stats["duplicate"] += 1
    elif reason == "Fake":    stats["fake"] += 1
    elif reason == "Fixed":   stats["fixed"] += 1
    elif reason == "Location": stats["wrongLocation"] += 1
    c.report_stats = stats
    db.session.commit()
    return jsonify({"ok": True})

@app.route("/api/complaints/<cid>/traffic-alert", methods=["PATCH"])
def set_traffic_alert(cid):
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404
    c.traffic_alert = request.json.get("alert", False)
    db.session.commit()
    return jsonify(c.to_dict())

@app.route("/api/complaints/<cid>/assign-constable", methods=["POST"])
def assign_constable(cid):
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404
    tp = db.session.get(TrafficPersonnel, request.json.get("constableId"))
    if not tp: return jsonify({"error": "Constable not found"}), 404
    c.assigned_constable = tp.to_dict()
    c.traffic_alert = True
    db.session.commit()
    return jsonify(c.to_dict())

@app.route("/api/complaints/<cid>/assign-contractor", methods=["POST"])
def assign_contractor_to_complaint(cid):
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404
    contractor = db.session.get(Contractor, request.json.get("contractorId"))
    if not contractor: return jsonify({"error": "Contractor not found"}), 404
    c.status = "Workers Assigned"
    c.assigned_contractor_id = contractor.id
    c.contractor_assigned_at = utcnow()
    contractor.active_projects += 1
    history = contractor.history or []
    history.insert(0, {"id": cid, "location": c.address, "description": c.description or "Assigned Work",
                        "date": utcnow().strftime("%Y-%m-%d"), "status": "In Progress"})
    contractor.history = history
    db.session.commit()
    return jsonify(c.to_dict())

@app.route("/api/complaints/<cid>/complete-work", methods=["POST"])
def complete_work_order(cid):
    """Contractor submits repair evidence. Moves to Pending Verification — NOT Repaired yet."""
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404
    c.status = "Pending Verification"
    c.repair_evidence_url = request.json.get("evidenceUrl", "")
    c.rejection_reason = None  # cleared on fresh submission
    # repaired_at and completed_projects are set when the dept verifies — not here
    if c.assigned_contractor_id:
        contractor = db.session.get(Contractor, c.assigned_contractor_id)
        if contractor:
            contractor.active_projects = max(0, contractor.active_projects - 1)
            history = contractor.history or []
            for h in history:
                if h.get("id") == cid:
                    h["status"] = "Pending Verification"
                    break
            contractor.history = history
    db.session.commit()
    _log("WORK_COMPLETE", f"Contractor submitted evidence for {cid} — awaiting dept verification")
    return jsonify(c.to_dict())


@app.route("/api/complaints/<cid>/verify-repair", methods=["POST"])
def verify_repair(cid):
    """Department verifies contractor work and closes the ticket."""
    c = Complaint.query.get_or_404(cid)
    if c.status != "Pending Verification":
        return jsonify({"error": "Complaint is not pending verification"}), 400
    c.status = "Repaired"
    c.repaired_at = utcnow()
    # Increment contractor completed_projects
    if c.assigned_contractor_id:
        contractor = Contractor.query.get(c.assigned_contractor_id)
        if contractor:
            contractor.completed_projects += 1
            history = list(contractor.history or [])
            for h in history:
                if h.get("id") == cid:
                    h["status"] = "Completed"
            contractor.history = history
    db.session.commit()
    _log("WORK_COMPLETE", f"Department verified and closed repair for {cid}")
    # Notify citizen that repair is verified and closed
    user = db.session.get(User, c.user_id)
    if user:
        notify_user_status_change(user.email, user.name, c, "Repaired")
    return jsonify(c.to_dict())


@app.route("/api/complaints/<cid>/reject-repair", methods=["POST"])
def reject_repair(cid):
    """Department rejects contractor's repair evidence.
    Resets complaint back to Workers Assigned, clears evidence,
    optionally re-assigns to a different contractor.
    """
    c = Complaint.query.get_or_404(cid)
    if c.status != "Pending Verification":
        return jsonify({"error": "Complaint is not pending verification"}), 400

    data = request.json or {}
    reason = data.get("reason", "Repair quality not acceptable.")
    new_contractor_id = data.get("newContractorId")

    # Revert the old contractor's history entry back to In Progress
    if c.assigned_contractor_id:
        old_contractor = Contractor.query.get(c.assigned_contractor_id)
        if old_contractor:
            old_contractor.active_projects = max(0, old_contractor.active_projects - 1)
            history = list(old_contractor.history or [])
            for h in history:
                if h.get("id") == cid:
                    h["status"] = "Rejected"
            old_contractor.history = history

    # Re-assign to a different contractor if provided
    if new_contractor_id and new_contractor_id != c.assigned_contractor_id:
        new_contractor = Contractor.query.get(new_contractor_id)
        if new_contractor:
            c.assigned_contractor_id = new_contractor.id
            c.contractor_assigned_at = utcnow()
            new_contractor.active_projects += 1
            history = list(new_contractor.history or [])
            history.insert(0, {
                "id": cid, "location": c.address,
                "description": c.description or "Re-assigned Work",
                "date": utcnow().strftime("%Y-%m-%d"), "status": "In Progress"
            })
            new_contractor.history = history

    # Reset status and clear bad evidence
    c.status = "Workers Assigned"
    c.repair_evidence_url = None
    c.repaired_at = None
    c.rejection_reason = reason

    db.session.commit()
    _log("REPAIR_ORDER", f"Department rejected repair for {cid}. Reason: {reason}")

    return jsonify(c.to_dict())


# =============================================================================
# SOFT DELETE + AUDIT ROUTES
# =============================================================================

@app.route("/api/complaints/<cid>", methods=["DELETE"])
def delete_complaint(cid):
    """
    Soft delete a complaint.
    Body: { actorId, actorName, actorRole, reason }
    Rules enforced client-side; backend trusts the role sent (add auth middleware in production).
    """
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404
    if c.deleted_at: return jsonify({"error": "Already deleted"}), 409

    data       = request.json or {}
    actor_role = data.get("actorRole", "USER")
    actor_id   = data.get("actorId", "unknown")
    actor_name = data.get("actorName", "Unknown")
    reason     = data.get("reason", "")

    # USER rule: can only delete their own complaints, and only pre-assignment
    USER_DELETABLE_STATUSES = {"Uploaded", "Verified"}
    if actor_role == "USER":
        if c.user_id != actor_id:
            return jsonify({"error": "You can only delete your own complaints."}), 403
        if c.status not in USER_DELETABLE_STATUSES:
            return jsonify({"error": "Cannot delete a complaint once workers have been assigned or it has been further processed."}), 403

    c.deleted_at      = utcnow()
    c.deleted_by      = actor_id
    c.deleted_by_name = actor_name
    c.deleted_by_role = actor_role
    c.delete_reason   = reason
    db.session.commit()

    _log("DELETE_CASE", f"[{actor_role}] {actor_name} deleted complaint {cid}. Reason: {reason}")
    return jsonify({"ok": True})


@app.route("/api/complaints/<cid>/restore", methods=["POST"])
def restore_complaint(cid):
    """
    Restore a soft-deleted complaint.
    Only allowed within 5 days of deletion, and only by the dept that deleted it.
    Body: { actorId, actorRole, actorDept }
    """
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404
    if not c.deleted_at: return jsonify({"error": "Complaint is not deleted"}), 400

    data       = request.json or {}
    actor_role = data.get("actorRole", "")
    actor_id   = data.get("actorId", "")

    days_since = (utcnow() - c.deleted_at).total_seconds() / 86400
    if days_since > 5:
        return jsonify({"error": "Restore window (5 days) has expired."}), 403

    # Only the actor who deleted it (or admin) can restore
    if actor_role not in ("ADMIN",) and c.deleted_by != actor_id:
        return jsonify({"error": "Only the department that deleted this complaint can restore it within 5 days."}), 403

    c.deleted_at      = None
    c.deleted_by      = None
    c.deleted_by_name = None
    c.deleted_by_role = None
    c.delete_reason   = None
    db.session.commit()

    _log("RESTORE_CASE", f"[{actor_role}] {actor_id} restored complaint {cid}")
    return jsonify({"ok": True, "complaint": c.to_dict()})


@app.route("/api/audit/deleted-complaints")
def get_deleted_complaints():
    """
    Returns soft-deleted complaints within 30 days, with full details for audit log.
    Accessible by Admin and Dept roles only (enforce in frontend/middleware).
    """
    cutoff = utcnow() - timedelta(days=30)
    results = Complaint.query.filter(
        Complaint.deleted_at != None,
        Complaint.deleted_at >= cutoff
    ).order_by(Complaint.deleted_at.desc()).all()
    return jsonify([c.to_dict(include_deleted=True) for c in results])


# =============================================================================
# APPEAL ROUTES
# =============================================================================

@app.route("/api/appeals", methods=["POST"])
def create_appeal():
    """Department raises appeal: this complaint doesn't belong to us."""
    data = request.json
    complaint_id = data.get("complaintId")
    from_dept    = data.get("fromDept")
    reason       = data.get("reason", "")

    c = db.session.get(Complaint, complaint_id)
    if not c: return jsonify({"error": "Complaint not found"}), 404

    # ── GUARD: Only allow appeal if this complaint was auto-routed or assigned to this dept ──
    dept_in_departments = from_dept in (c.departments or [])
    is_auto_routed_to_dept = c.auto_routed_dept == from_dept
    if not dept_in_departments and not is_auto_routed_to_dept:
        return jsonify({"error": "You can only appeal complaints that were auto-routed or assigned to your department."}), 403

    # Check no pending appeal already exists for this complaint from same dept
    existing = AppealRequest.query.filter_by(
        complaint_id=complaint_id, from_dept=from_dept, status="PENDING"
    ).first()
    if existing:
        return jsonify({"error": "A pending appeal already exists for this complaint."}), 409

    appeal = AppealRequest(complaint_id=complaint_id, from_dept=from_dept, reason=reason)
    db.session.add(appeal)
    db.session.commit()
    _log("APPEAL_RAISED", f"{from_dept} appealed complaint {complaint_id}: {reason[:80]}")
    return jsonify(appeal.to_dict()), 201


@app.route("/api/appeals")
def get_appeals():
    """List all appeals. Optional ?status=PENDING&dept=Engineering filter."""
    status = request.args.get("status")
    dept   = request.args.get("dept")
    q = AppealRequest.query
    if status: q = q.filter_by(status=status)
    if dept:   q = q.filter_by(from_dept=dept)
    return jsonify([a.to_dict() for a in q.order_by(AppealRequest.created_at.desc()).all()])


@app.route("/api/appeals/<appeal_id>/review", methods=["POST"])
def review_appeal(appeal_id):
    """Admin approves or rejects an appeal, optionally reassigning the complaint."""
    appeal = db.session.get(AppealRequest, appeal_id)
    if not appeal: return jsonify({"error": "Appeal not found"}), 404

    data        = request.json
    decision    = data.get("decision")   # "APPROVED" or "REJECTED"
    assign_to   = data.get("assignTo")   # new dept if approved
    reviewed_by = data.get("reviewedBy", "Admin")
    reviewer_role = data.get("reviewerRole", "")  # must be "ADMIN"

    # ── ADMIN-ONLY GUARD ─────────────────────────────────────────────────────
    if reviewer_role.upper() != "ADMIN":
        return jsonify({"error": "Only Admin can approve or reject department appeals."}), 403

    if decision not in ("APPROVED", "REJECTED"):
        return jsonify({"error": "decision must be APPROVED or REJECTED"}), 400

    appeal.status      = decision
    appeal.reviewed_by = reviewed_by
    appeal.reviewed_at = utcnow()

    if decision == "APPROVED" and assign_to:
        appeal.assigned_to = assign_to
        c = db.session.get(Complaint, appeal.complaint_id)
        if c:
            c.departments = [assign_to]
            c.auto_routed_dept = assign_to
        _log("APPEAL_APPROVED", f"Admin reassigned complaint {appeal.complaint_id} from {appeal.from_dept} → {assign_to}")
    else:
        _log("APPEAL_REJECTED", f"Admin rejected appeal for {appeal.complaint_id} from {appeal.from_dept}")

    db.session.commit()
    return jsonify(appeal.to_dict())


# --- COMMENTS ---
@app.route("/api/complaints/<cid>/comments", methods=["POST"])
def add_comment(cid):
    c = db.session.get(Complaint, cid)
    if not c: return jsonify({"error": "Not found"}), 404
    data = request.json
    comment = Comment(complaint_id=cid, user_id=data["userId"], user_name=data["userName"],
                      text=data["text"], avatar_url=data.get("avatarUrl"))
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201

# --- CONTRACTORS ---
@app.route("/api/contractors")
def get_contractors():
    return jsonify([c.to_dict() for c in Contractor.query.all()])

# --- TRAFFIC PERSONNEL ---
@app.route("/api/traffic-personnel")
def get_traffic_personnel():
    return jsonify([tp.to_dict() for tp in TrafficPersonnel.query.all()])

# --- ANNOUNCEMENTS ---
@app.route("/api/announcements")
def get_announcements():
    role = request.args.get("role", "USER")
    is_official = role != "USER"
    results = []
    for a in Announcement.query.filter_by(active=True).order_by(Announcement.timestamp.desc()).all():
        if role == "ADMIN" or a.target == "ALL": results.append(a)
        elif is_official and a.target == "OFFICIALS": results.append(a)
        elif not is_official and a.target == "CITIZENS": results.append(a)
    return jsonify([a.to_dict() for a in results])

@app.route("/api/announcements", methods=["POST"])
def create_announcement():
    data = request.json
    a = Announcement(message=data["message"], type=data.get("type","INFO"),
                     target=data.get("target","ALL"), created_by=data.get("createdBy","Admin"))
    db.session.add(a)
    db.session.commit()
    _log("ANNOUNCEMENT", data["message"][:80])
    return jsonify(a.to_dict()), 201

@app.route("/api/announcements/<ann_id>/deactivate", methods=["PATCH"])
def deactivate_announcement(ann_id):
    a = db.session.get(Announcement, ann_id)
    if not a: return jsonify({"error": "Not found"}), 404
    a.active = False
    db.session.commit()
    return jsonify({"ok": True})

# --- ADMIN ---
@app.route("/api/admin/log", methods=["POST"])
def log_admin_activity():
    data = request.json
    _log(data["type"], data.get("details"))
    return jsonify({"ok": True})

@app.route("/api/admin/stats")
def get_admin_stats():
    logs = AdminLog.query.order_by(AdminLog.timestamp.desc()).all()
    return jsonify({
        "totalRepairOrders": AdminLog.query.filter_by(type="REPAIR_ORDER").count(),
        "totalDeletedCases": AdminLog.query.filter_by(type="DELETE_CASE").count(),
        "logs": [l.to_dict() for l in logs],
    })

# --- IMAGE UPLOAD ---
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

def _validate_image_upload(f):
    """Returns (error_message, status_code) or (None, None) if valid."""
    filename = (f.filename or "").lower()
    ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return "Only JPEG, JPG, and PNG images are allowed.", 400
    file_bytes = f.read()
    if len(file_bytes) > MAX_IMAGE_SIZE_BYTES:
        mb = len(file_bytes) / (1024 * 1024)
        f.seek(0)
        return f"Image exceeds 5 MB limit ({mb:.1f} MB uploaded).", 413
    f.seek(0)
    return None, None

@app.route("/api/upload", methods=["POST"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    f = request.files["file"]
    folder = request.form.get("folder", "complaints")
    err, status = _validate_image_upload(f)
    if err:
        return jsonify({"error": err}), status
    file_bytes = f.read()
    try:
        url = upload_to_minio(file_bytes, f.filename or "image.jpg", f.content_type or "image/jpeg", folder)
        return jsonify({"url": url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- AI DETECTION ---
@app.route("/api/detect/potholes", methods=["POST"])
def detect_potholes():
    if not model1: return jsonify({"error": "Model 1 not loaded"}), 503
    if "file" not in request.files: return jsonify({"error": "No file"}), 400
    try:
        img = Image.open(io.BytesIO(request.files["file"].read()))
        detected, conf, label = process_yolo_result(model1(img), model1)
        return jsonify({"detected": detected, "confidence": conf,
                        "label": label if detected else "No damage detected"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/detect/general-damage", methods=["POST"])
def detect_general_damage():
    if not model2: return jsonify({"error": "Model 2 not loaded"}), 503
    if "file" not in request.files: return jsonify({"error": "No file"}), 400
    try:
        img = Image.open(io.BytesIO(request.files["file"].read()))
        detected, conf, label = process_yolo_result(model2(img), model2)
        return jsonify({"detected": detected, "confidence": conf,
                        "label": label if detected else "No damage detected"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =============================================================================
# REPORTS & EXPORT ROUTES
# =============================================================================

@app.route("/api/reports/monthly")
def monthly_report():
    """
    Generate and download a monthly CSV report of all complaints.
    ?month=YYYY-MM  (defaults to current month)
    Accessible by Admin and Dept roles (enforce in middleware).
    """
    month_param = request.args.get("month", utcnow().strftime("%Y-%m"))
    try:
        year, month = map(int, month_param.split("-"))
    except ValueError:
        return jsonify({"error": "Invalid month format. Use YYYY-MM"}), 400

    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)

    complaints = Complaint.query.filter(
        Complaint.deleted_at == None,
        Complaint.timestamp >= start,
        Complaint.timestamp < end,
    ).order_by(Complaint.timestamp.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Token ID", "Date", "Status", "Resolved",
        "Severity", "Severity Score",
        "Address", "Department(s)", "Description",
        "Concerns", "Escalation Level", "SLA Hours",
    ])
    for c in complaints:
        depts = ", ".join(c.departments) if c.departments else ""
        is_resolved = "Yes" if c.status == "Repaired" else "No"
        # Use isoformat to avoid #### in Excel — plain ISO date string is safest
        date_str = c.timestamp.strftime("%d-%m-%Y %H:%M") if c.timestamp else ""
        writer.writerow([
            c.id,
            date_str,
            c.status, is_resolved,
            c.severity, round(c.severity_score or 0, 2),
            c.address, depts,
            (c.description or "").replace("\n", " "),
            c.concern_count or 0,
            c.escalation_level or "NONE",
            c.sla_hours or "",
        ])

    csv_bytes = output.getvalue().encode("utf-8")
    response = make_response(csv_bytes)
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    response.headers["Content-Disposition"] = f"attachment; filename=rashtra_monthly_report_{month_param}.csv"
    return response


@app.route("/api/reports/audit-export")
def audit_export():
    """
    Export audit log (activity logs + deleted complaints) as CSV.
    Accessible by Admin and Dept roles (enforce in middleware).
    """
    # Activity logs
    logs = AdminLog.query.order_by(AdminLog.timestamp.desc()).limit(5000).all()
    # Deleted complaints in last 30 days
    cutoff = utcnow() - timedelta(days=30)
    deleted = Complaint.query.filter(
        Complaint.deleted_at != None,
        Complaint.deleted_at >= cutoff,
    ).order_by(Complaint.deleted_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["=== ACTIVITY LOGS ==="])
    writer.writerow(["Log ID", "Timestamp", "Action Type", "Details"])
    for log in logs:
        writer.writerow([
            log.id,
            log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "",
            log.type,
            (log.details or "").replace("\n", " "),
        ])

    writer.writerow([])
    writer.writerow(["=== DELETED COMPLAINTS (Last 30 Days) ==="])
    writer.writerow([
        "Token ID", "Deleted At", "Deleted By", "Deleted By Role",
        "Delete Reason", "Original Status", "Address", "Description",
    ])
    for c in deleted:
        writer.writerow([
            c.id,
            c.deleted_at.strftime("%Y-%m-%d %H:%M:%S") if c.deleted_at else "",
            c.deleted_by_name or c.deleted_by or "",
            c.deleted_by_role or "",
            (c.delete_reason or "").replace("\n", " "),
            c.status,
            c.address,
            (c.description or "").replace("\n", " "),
        ])

    csv_bytes = output.getvalue().encode("utf-8")
    timestamp_str = utcnow().strftime("%Y%m%d_%H%M%S")
    response = make_response(csv_bytes)
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    response.headers["Content-Disposition"] = f"attachment; filename=rashtra_audit_{timestamp_str}.csv"
    return response


# =============================================================================
# DB INIT + SEED
# =============================================================================

def seed_data():
    if Contractor.query.count() == 0:
        db.session.add_all([
            Contractor(id="C-101", name="Rajesh Kumar",       company="BuildWell Infra",         specialization="Road Resurfacing",    rating=4.8, active_projects=3,  completed_projects=142, contact="+91 98220 12345", status="Verified"),
            Contractor(id="C-102", name="Amit Deshmukh",      company="CityFix Solutions",        specialization="Civil Works",         rating=4.2, active_projects=1,  completed_projects=89,  contact="+91 94235 67890", status="Verified"),
            Contractor(id="C-103", name="Suresh Patil",       company="Green Earth Sanitation",   specialization="Debris Removal",      rating=4.9, active_projects=5,  completed_projects=310, contact="+91 88888 55555", status="Verified"),
            Contractor(id="C-104", name="Vijay Singh",        company="Bright Spark Electricals", specialization="Street Lights",       rating=3.5, active_projects=0,  completed_projects=45,  contact="+91 77777 22222", status="Probation"),
            Contractor(id="C-105", name="Anjali Mehta",       company="Anjali Constructions",     specialization="Pavement & Walkways", rating=4.6, active_projects=2,  completed_projects=110, contact="+91 99887 77665", status="Verified"),
            Contractor(id="C-106", name="Kabir Khan",         company="Solapur Roadways",         specialization="Heavy Road Works",    rating=4.9, active_projects=4,  completed_projects=520, contact="+91 98765 00001", status="Verified"),
            Contractor(id="C-110", name="Ramesh Pawar",       company="AquaPure Networks",        specialization="Water & Drainage",    rating=4.3, active_projects=3,  completed_projects=150, contact="+91 99223 34455", status="Verified"),
            Contractor(id="C-111", name="Vikram Construction",company="Vikram Roads",             specialization="Pothole Patching",    rating=4.1, active_projects=6,  completed_projects=200, contact="+91 91122 33445", status="Verified"),
            Contractor(id="C-112", name="CleanCity Group",    company="CleanCity Services",       specialization="Waste Management",    rating=4.5, active_projects=2,  completed_projects=85,  contact="+91 88000 99000", status="Verified"),
            Contractor(id="C-113", name="Urban Greenery",     company="Urban Greenery Ltd",       specialization="Tree Cutting",        rating=4.7, active_projects=1,  completed_projects=120, contact="+91 88776 65544", status="Verified"),
            Contractor(id="C-114", name="PipeMasters",        company="PipeMasters Ltd",          specialization="Pipeline Repair",     rating=4.8, active_projects=4,  completed_projects=300, contact="+91 99881 12233", status="Verified"),
            Contractor(id="C-115", name="FlowTech",           company="FlowTech Solutions",       specialization="Sewage Treatment",    rating=4.6, active_projects=2,  completed_projects=95,  contact="+91 99555 44333", status="Verified"),
            Contractor(id="C-116", name="HydroFix",           company="HydroFix Engineers",       specialization="Leakage Repair",      rating=4.2, active_projects=1,  completed_projects=45,  contact="+91 99111 22233", status="Probation"),
        ])

    if TrafficPersonnel.query.count() == 0:
        db.session.add_all([
            TrafficPersonnel(id="TP-001", name="Rajesh Deshmukh", rank="Inspector",                  badge_number="MH-13-101", phone="+91 98900 11111", status="Available", current_location="Control Room HQ",    last_active="2 mins ago"),
            TrafficPersonnel(id="TP-002", name="Suresh Patil",    rank="Constable",                  badge_number="MH-13-442", phone="+91 98900 22222", status="Busy",      current_location="Saat Rasta Junction", last_active="Just now"),
            TrafficPersonnel(id="TP-003", name="Amit Shinde",     rank="Constable",                  badge_number="MH-13-550", phone="+91 98900 33333", status="Available", current_location="Ashok Chowk",         last_active="5 mins ago"),
            TrafficPersonnel(id="TP-004", name="Vijay Kulkarni",  rank="Traffic Warden (Volunteer)", badge_number="VOL-088",   phone="+91 98900 44444", status="Busy",      current_location="Siddheshwar Temple",  last_active="10 mins ago"),
            TrafficPersonnel(id="TP-005", name="Priya Pawar",     rank="Sub-Inspector",              badge_number="MH-13-202", phone="+91 98900 55555", status="Off Duty",  current_location="Home",                last_active="4 hours ago"),
            TrafficPersonnel(id="TP-006", name="Rahul Jadhav",    rank="Traffic Warden (Volunteer)", badge_number="VOL-092",   phone="+91 98900 66666", status="Available", current_location="Market Yard",         last_active="1 min ago"),
            TrafficPersonnel(id="TP-007", name="Anil Kale",       rank="Constable",                  badge_number="MH-13-610", phone="+91 98900 77777", status="Busy",      current_location="Hotgi Road",          last_active="Just now"),
            TrafficPersonnel(id="TP-008", name="Sunita Mane",     rank="Constable",                  badge_number="MH-13-615", phone="+91 98900 88888", status="Available", current_location="VIP Road",            last_active="15 mins ago"),
        ])

    if Announcement.query.count() == 0:
        db.session.add(Announcement(id="ann-init", message="Welcome to Rashtra Digital Portal. Report responsibly.",
                                    type="INFO", target="ALL", created_by="System"))
    db.session.commit()
    print("✅ Seed data loaded")


with app.app_context():
    try:
        db.create_all()
        seed_data()
        print("✅ Database tables ready")
    except Exception as _db_init_err:
        print(f"⚠️  DB init failed (will retry on first request): {_db_init_err}")
    try:
        ensure_bucket()
    except Exception as _bucket_err:
        print(f"⚠️  R2 bucket check failed: {_bucket_err}")




# =============================================================================
# MESSAGES — Inter-department & Group Chat
# =============================================================================

def _make_channel(dept_a: str, dept_b: str) -> str:
    """Canonical channel name for a dept-to-dept DM (sorted alphabetically)."""
    return "-".join(sorted([dept_a, dept_b]))


@app.route("/api/messages", methods=["GET"])
def get_messages():
    """
    GET /api/messages?channel=GROUP          → group chat
    GET /api/messages?channel=Engineering-Water  → dept-to-dept
    GET /api/messages?dept=Engineering        → all channels involving this dept
    """
    channel = request.args.get("channel")
    dept    = request.args.get("dept")

    q = Message.query
    if channel:
        q = q.filter_by(channel=channel)
    elif dept:
        q = q.filter(
            (Message.channel == "GROUP") |
            Message.channel.contains(dept)
        )
    else:
        return jsonify({"error": "Provide channel or dept param"}), 400

    messages = q.order_by(Message.timestamp.asc()).limit(200).all()
    return jsonify([m.to_dict() for m in messages])


@app.route("/api/messages", methods=["POST"])
def send_message():
    """
    POST body: { channel, senderId, senderName, senderDept, text }
    channel = "GROUP" for group chat, or "DeptA-DeptB" for dept DM.
    """
    data = request.json
    channel     = data.get("channel", "GROUP")
    sender_id   = data.get("senderId")
    sender_name = data.get("senderName", "Official")
    sender_dept = data.get("senderDept", "")
    text        = (data.get("text") or "").strip()

    if not text:
        return jsonify({"error": "Message text cannot be empty"}), 400
    if not sender_id:
        return jsonify({"error": "senderId is required"}), 400

    # For dept-to-dept channels, normalise to sorted pair
    if channel not in ("GROUP",) and "-" in channel:
        parts = [p.strip() for p in channel.split("-", 1)]
        channel = _make_channel(parts[0], parts[1])

    msg = Message(
        channel=channel,
        sender_id=sender_id,
        sender_name=sender_name,
        sender_dept=sender_dept,
        text=text,
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201


@app.route("/api/messages/channels", methods=["GET"])
def list_channels():
    """List all unique channels a dept participates in (for sidebar)."""
    dept = request.args.get("dept")
    if not dept:
        return jsonify({"error": "dept param required"}), 400

    rows = db.session.execute(
        db.text("SELECT DISTINCT channel FROM messages WHERE channel = 'GROUP' OR channel LIKE :pat ORDER BY channel"),
        {"pat": f"%{dept}%"}
    ).fetchall()
    channels = [r[0] for r in rows]
    if "GROUP" not in channels:
        channels.insert(0, "GROUP")
    return jsonify(channels)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, use_reloader=False, host="0.0.0.0", port=port)