# 🛣️ RASHTRA — Smart Road Damage Reporting Platform

> Civic infrastructure intelligence for Solapur Municipal Corporation, Maharashtra, India.

---

## Overview

**RASHTRA** is a full-stack civic tech platform that enables citizens to report road damage, and empowers municipal departments, contractors, and administrators to manage, verify, and resolve complaints — end to end.

Built for a large-scale civic hackathon (~2,000 competing teams), RASHTRA is designed to production-grade standards: real backend persistence, AI-powered verification, role-based access control, and multi-language support.

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React + TypeScript + Vite |
| Auth | Firebase Authentication (Email/Password + Google Sign-In) |
| AI Chat | Gemini AI (English / Hindi / Marathi) |
| Image Verification | Firebase Storage + Gemini Vision |
| Data Layer | Firestore (Firebase) |
| Hosting | Firebase Hosting |

### Backend (Production-Grade Stack)
| Layer | Technology |
|---|---|
| Server | Flask / Python |
| Database | PostgreSQL + SQLAlchemy |
| Object Storage | Cloudflare storage R2  |
| AI Models | YOLO v8 — `pothole_model.pt` + `damage_model.pt` |
| Hosting |Firebase(Frontend),Hugging Face Spaces(Yolo Models) and Railway(DB & Server.py) |

---

## Features

### 👥 Multi-Role Architecture
- **Citizens** — Report road damage with photo + location
- **Department Staff** — View, manage, and update complaints scoped to their department
- **Contractors** — View assigned work orders and update job status
- **Admins** — Full oversight, escalations, inter-department routing
- **Super Admins** — System-wide control and audit

### 🤖 AI-Powered Pipeline
- Dual YOLO model verification (pothole detection + damage classification)
- AI auto-routing with keyword-scoring confidence engine
- Gemini chatbot with RASHTRA-specific system prompt (English / Hindi / Marathi)

### 📋 Complaint Lifecycle
- Citizen submits complaint with geo-tagged photo
- AI verifies image authenticity and damage type
- System auto-routes to correct department
- SLA countdown clocks with live tracking
- Escalation chain system for overdue complaints
- Department appeal system
- Soft-delete with full audit logging

### 💬 Communication
- Inter-official messaging system (`OfficialMessaging.tsx`)
- Community reporting feed
- Admin Help Centre + citizen Help Centre

### 🔐 Auth & Security
- Firebase email/password + Google Sign-In
- Role-based route protection
- Terms of Service modal with per-UID localStorage tracking
- Complaint ownership/visibility scoped per role

---

## Project Structure

```
rashtra_smc/
├── pages/               # All route-level page components
│   ├── Login.tsx
│   ├── UserHome.tsx
│   ├── ReportDamage.tsx
│   ├── ComplaintStatus.tsx
│   ├── DepartmentDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── ContractorDashboard.tsx
│   └── ...
├── components/          # Shared UI components
│   ├── Chatbot.tsx
│   └── UI.tsx
├── services/            # API + Firebase + AI service layer
│   ├── firebase.ts
│   ├── gemini.ts
│   ├── model1.ts        # YOLO pothole model shim
│   ├── model2.ts        # YOLO damage model shim
│   ├── mockApi.ts
│   └── locationService.ts
├── context/
│   └── UserContext.tsx
├── backend/             # Flask backend (production stack)
│   ├── server.py
│   ├── requirements.txt
│   ├── migrate_db.py
│   └── models/
│       ├── pothole_model.pt   (~7MB)
│       └── damage_model.pt    (~21MB)
├── App.tsx
├── constants.ts
├── types.ts
└── firebase.json
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Gemini API key

### Setup

```bash
# Clone the repo
git clone https://github.com/Kranthi-3027/RASTRA.git
cd RASTRA

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Fill in your Firebase + Gemini keys

# Run dev server
npm run dev
```
### Setup Firebase project

#### 1.Go to console.firebase.google.com
Create project → name it → disable Analytics → Create
Enable Authentication

####  2.Build → Authentication → Get Started
Enable Email/Password + Google


#### 3.Get your config keys
Project Settings ⚙️ → General → Add app → Web
Copy the firebaseConfig object → paste into .env.local


#### Enable Hosting

Build → Hosting → Get Started → follow CLI steps



### Environment Variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_GEMINI_API_KEY=
```

### Deploy to Firebase

```bash
npm run build
firebase deploy
```

---

## Contributors

| Name | GitHub |
|---|---|
| Kranthi Kumar | [@Kranthi-3027](https://github.com/Kranthi-3027) |
| Shashank | [@Shashank-312-in](https://github.com/Shashank-312-in) |

---

## Built For

**Solapur Municipal Corporation Civic Hackathon**  
Maharashtra, India  

---

## License

This project is submitted as part of a MIT-SMC hackathon. All rights reserved by the authors.
