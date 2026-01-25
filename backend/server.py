from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image
import io

# =============================================================================
# RASHTRA AI BACKEND SERVER
# =============================================================================
# This server hosts the TWO required models as per the system specification:
#
# FILE 1: 'pothole_model.pt' (Model 1)
#    - Expert in detecting potholes specifically.
#    - Priority 1 in the inference pipeline.
#
# FILE 2: 'damage_model.pt' (Model 2)
#    - Expert in detecting general road damage (cracks, ruts, debris).
#    - Priority 2 (Fallback) in the inference pipeline.
#
# INSTRUCTIONS:
# 1. Install dependencies: pip install flask flask-cors ultralytics
# 2. Place 'pothole_model.pt' and 'damage_model.pt' in this folder.
# 3. Run: python server.py
# =============================================================================

app = Flask(__name__)
CORS(app)

print("--- RASHTRA AI BACKEND INITIALIZING ---")

# --- LOAD MODEL 1: POTHOLE EXPERT ---
try:
    print("Loading Model 1 (pothole_model.pt)...")
    model1 = YOLO('pothole_model.pt')
    print("✅ Model 1 Loaded Successfully")
except Exception as e:
    print(f"❌ Error loading Model 1: {e}")
    print("   (Using Simulation Fallback for Potholes)")
    model1 = None

# --- LOAD MODEL 2: GENERAL DAMAGE EXPERT ---
try:
    print("Loading Model 2 (damage_model.pt)...")
    model2 = YOLO('damage_model.pt')
    print("✅ Model 2 Loaded Successfully")
except Exception as e:
    print(f"❌ Error loading Model 2: {e}")
    print("   (Using Simulation Fallback for General Damage)")
    model2 = None


def process_yolo_result(results, current_model):
    """
    Helper to extract the highest confidence detection from YOLO results.
    """
    detected = False
    max_conf = 0.0
    label = "Unknown"

    # Iterate through results
    for r in results:
        boxes = r.boxes
        for box in boxes:
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            cls_name = current_model.names[cls_id] if current_model else "object"
            
            if conf > max_conf:
                max_conf = conf
                label = cls_name
                detected = True

    return detected, max_conf, label


@app.route('/api/detect/potholes', methods=['POST'])
def detect_potholes():
    print(">>> Request received for Model 1 (Potholes)")
    if not model1:
        return jsonify({"error": "Model 1 not loaded"}), 503
        
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        file = request.files['file']
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes))

        # Run Inference
        results = model1(img)
        
        detected, conf, label = process_yolo_result(results, model1)

        print(f"    Model 1 Result: Detected={detected}, Conf={conf:.2f}")
        return jsonify({
            "detected": detected,
            "confidence": conf,
            "label": f"{label} (Model 1)" if detected else "No Potholes"
        })

    except Exception as e:
        print(f"Inference Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/detect/general-damage', methods=['POST'])
def detect_general_damage():
    print(">>> Request received for Model 2 (General Damage)")
    if not model2:
        return jsonify({"error": "Model 2 not loaded"}), 503

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        file = request.files['file']
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes))

        # Run Inference
        results = model2(img)
        
        detected, conf, label = process_yolo_result(results, model2)

        print(f"    Model 2 Result: Detected={detected}, Conf={conf:.2f}")
        return jsonify({
            "detected": detected,
            "confidence": conf,
            "label": f"{label} (Model 2)" if detected else "No Damage"
        })

    except Exception as e:
        print(f"Inference Error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
