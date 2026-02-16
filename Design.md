# RASHTRA - System Design & Architecture
## AWS Cloud Architecture Strategy

### 1. Architecture Overview
The RASHTRA platform follows a **Serverless-First** architecture on AWS to ensure scalability, low maintenance, and cost-efficiency. The system is decoupled into a Frontend Client, a REST API Gateway, an Asynchronous AI Inference Layer, and a Data Persistence Layer.

### 2. Tech Stack & AWS Services
*   **Frontend:** React (Vite) + Tailwind CSS + Leaflet Maps.
    *   *Hosting:* **AWS Amplify** (CI/CD, Hosting).
*   **Backend API:** Python (FastAPI/Flask).
    *   *Compute:* **AWS Lambda** (Serverless functions for API logic) or **Amazon EC2** (for persistent services).
    *   *API Management:* **Amazon API Gateway**.
*   **AI/ML Layer:**
    *   *Inference:* **Amazon SageMaker** endpoints hosting YOLOv8 models.
    *   *Training:* SageMaker Studio for model retraining on Indian road datasets.
*   **Database:**
    *   *Structured Data:* **Amazon RDS (PostgreSQL)** for User profiles, Complaints, Work Orders, and Contractor registries.
    *   *Unstructured/Logs:* **Amazon DynamoDB** for high-volume activity logs, audit trails, and real-time notifications.
*   **Storage:**
    *   **Amazon S3:** Object storage for user-uploaded images (damage evidence) and contractor proof-of-work.
*   **Notifications:**
    *   **Amazon SNS (Simple Notification Service):** SMS/Email alerts to Traffic Police and Contractors.
*   **Location Services:**
    *   **Amazon Location Service:** For geocoding, reverse geocoding, and map tiles (alternative to OpenStreetMap in production).

### 3. Data Flow & Component Interaction

#### A. Reporting Flow (Citizen)
1.  **Client:** React App captures Image + GPS Coordinates.
2.  **Upload:** Image uploaded directly to **S3 Bucket** (via pre-signed URL).
3.  **Trigger:** S3 upload event triggers a **Lambda Function**.
4.  **Inference:** Lambda calls **SageMaker Endpoint** (YOLO Model).
5.  **Result:** SageMaker returns Severity Score & Classification.
6.  **Storage:** Lambda saves metadata (Score, Location, S3 URL, UserID) to **RDS**.
7.  **Response:** Client polls or receives WebSocket update regarding status.

#### B. Administrative Flow (Official)
1.  **Dashboard:** Admin loads React Dashboard hosted on Amplify.
2.  **Data Fetch:** API Gateway invokes Lambda to query **RDS** for active complaints.
3.  **Map Rendering:** Frontend renders Heatmap using coordinate data.
4.  **Assignment:** Admin assigns ticket -> Lambda updates RDS -> Triggers **SNS** to notify Contractor.

#### C. Traffic Alert Flow (Automated)
1.  **Trigger:** AI analysis returns Severity Score > 7.
2.  **Action:** Backend logic triggers **SNS** Topic "HighSeverityAlert".
3.  **Subscriber:** Traffic Police Dashboard receives real-time alert via WebSocket/SNS.

### 4. Security & Compliance
*   **Authentication:** AWS Cognito for User Sign-up/Sign-in and Role-Based Access Control (RBAC) handling (Citizen vs. Admin vs. Contractor).
*   **Encryption:** KMS (Key Management Service) for encrypting S3 buckets and RDS instances.
*   **API Security:** WAF (Web Application Firewall) in front of API Gateway to prevent DDoS and malicious attacks.