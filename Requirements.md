# RASHTRA - Smart Road Damage Reporting System
## Requirements Specification

### 1. Project Abstract
RASHTRA is a civic-technology platform designed to bridge the gap between citizens and municipal authorities regarding road infrastructure maintenance. It leverages Computer Vision (YOLO models) to automatically detect, classify, and assess the severity of road damage (potholes, cracks) from user-uploaded images. The system eliminates fake reports, deduplicates complaints based on geolocation, and streamlines the workflow from reporting to repair via a unified dashboard for Engineering, Traffic, Ward, and Water departments.

### 2. User Personas & Roles
*   **Citizen (User):** Reports damage, tracks status, views community feed, earns gamified points.
*   **Super Admin:** Oversees all departments, views analytics heatmaps, manages users, and broadcasts announcements.
*   **Department Official (Engineering/Water/Ward):** Views assigned complaints, assigns work orders to contractors, verifies completion.
*   **Traffic Police:** Receives automated hazard alerts from the system to manage traffic flow around damaged areas; manages volunteer force roster.
*   **Contractor:** Receives work orders, uploads "Before/After" geo-tagged evidence to close tickets.

### 3. Functional Modules
#### A. AI-Powered Reporting
*   **GPS Location Capture:** Precise geolocation locking for every report.
*   **Camera Interface:** Real-time capture integration.
*   **AI Model 1 (Pothole Expert):** Specialized detection for deep potholes.
*   **AI Model 2 (General Damage):** Detection of surface cracks, waterlogging, and debris.

#### B. Smart Verification Engine
*   **Severity Scoring:** Auto-calculation of severity on a scale of 1-10.
*   **Filtering:** Automated logic to flag duplicates, fake reports, or location mismatches.

#### C. Department Command Center
*   **Live Heatmap:** Visualization of damage clusters using interactive maps.
*   **Workload Management:** Drag-and-drop or click-to-assign tickets to specific departments.
*   **Traffic Integration:** Automated toggles to notify Traffic Control for high-severity issues.

#### D. Contractor Portal
*   **Job Dashboard:** View active and completed work orders.
*   **Evidence Upload:** Mandatory image proof mechanism for marking jobs as "Repaired".

#### E. Citizen Engagement
*   **Multilingual Support:** English, Marathi, Hindi.
*   **Status Tracking:** Real-time timeline (Submitted -> Verified -> Assigned -> Repaired).
*   **Support:** Help Centre and Chatbot functionality.

### 4. Key Workflows
1.  **Ingestion:** Citizen uploads photo -> Image to S3 -> AI Analysis (SageMaker) -> Severity Score returned.
2.  **Triage:** Report Validated -> Stored in RDS -> Admin Dashboard.
3.  **Assignment:** Admin -> Engineering Dept -> Contractor (via SNS/Email).
4.  **Traffic Alert:** High Severity (>7) -> Auto-alert to Traffic Police -> Volunteer Dispatch.
5.  **Resolution:** Contractor fixes -> Uploads Proof -> Ticket Closed -> Citizen Notified.

### 5. Non-Functional Requirements
*   **Latency:** AI inference response under 2 seconds.
*   **Scalability:** Auto-scaling architecture to handle peak load (e.g., monsoon season).
*   **Security:** Role-Based Access Control (RBAC), Data Encryption (In-transit/At-rest).
*   **Accessibility:** WCAG compliant UI, High Contrast modes, Local Language support.