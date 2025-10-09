# 🤖 ClinicFlow – AI-Powered Patient Intake System

ClinicFlow is an AI-powered patient intake and triage platform that automates clinic check-ins. Patients interact with a conversational chatbot built in React Native, data flows securely through a Node.js + MongoDB backend, and staff manage submissions in a React web dashboard.

---

### 🚀 Live Deployment

| Component              | Description                            | Deployment                                                                                                                                     | Status    |
| :--------------------- | :------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| **Backend (API Server)** | Node.js + Express + MongoDB REST API   | [Live API on Render](https://clinicflow-v75g.onrender.com)                                                                                     | ✅ Live    |
| **Dashboard (Web)**      | React dashboard for clinic staff       | [Live Dashboard on Vercel](https://clinicflow-dashboard.vercel.app/)                                                                           | ✅ Live    |
| **Mobile App (Android)** | React Native chatbot (Dialogflow CX) | Distributed via Firebase App Distribution *(Private Tester Access – invite available on request)*                                                | 🔒 Private    |

All three components are live and connected — the chatbot communicates with the production backend, and new check-ins instantly appear on the staff dashboard.

---

### ✨ Features

-   **AI Chatbot (React Native):** Uses Google Dialogflow CX to handle patient check-ins through a conversational flow.
-   **Backend (Node/Express/MongoDB):** Handles API requests, stores intake data, and connects to Dialogflow.
-   **Dashboard (React):** A web panel for staff to review patient intakes, mark them as complete, or filter based on status.
-   **Real-Time Data Flow:** Chatbot → Backend → Dashboard (synced automatically).
-   **Modular Structure:** Clear separation between backend, app, and dashboard for easy maintenance and scaling.

---

### 🏗 Architecture Overview

🤖 Patient (Mobile)  
↓  
📱 React Native Chatbot (Dialogflow CX)  
↓ API requests  
🌐 Express Backend (Node.js + MongoDB Atlas)  
↑ REST APIs / WebSocket sync  
💻 React Dashboard (for Clinic Staff)   

---

### 🧰Tech Stack

#### **Backend** (`clinicflow-backend`)

-   Node.js, Express
-   MongoDB, Mongoose
-   Dialogflow CX SDK (`@google-cloud/dialogflow-cx`)
-   Morgan, UUID, dotenv

#### **Mobile App** (`ClinicFlowApp`)

-   React Native
-   Axios (with interceptors for API logging)
-   `Animated` + `KeyboardAvoidingView` for smoother chat
-   Tested on Android (emulator + real device)
-   Released via Firebase App Distribution

#### **Dashboard** (`clinicflow-dashboard`)

-   React (CRA)
-   Axios
-   React Testing Library + Jest
-   Deployed via Vercel

---

### ⚙️ Running Locally

1.  **Clone the repo**
    ```bash
    git clone https://github.com/your-username/clinicflow.git
    cd clinicflow
    ```

2.  **Backend setup**
    ```bash
    cd clinicflow-backend
    npm install
    ```
    Create `.env`:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    GOOGLE_PROJECT_ID=your_dialogflow_project_id
    GOOGLE_CLIENT_EMAIL=your_service_account_email
    GOOGLE_PRIVATE_KEY="your_private_key"
    DIALOGFLOW_AGENT_ID=your_agent_id
    DIALOGFLOW_LOCATION=us-central1
    ```
    Start server:
    ```bash
    node server.js
    # http://localhost:5000
    ```

3.  **React Native App**
    ```bash
    cd ../ClinicFlowApp
    npm install
    ```
    In one terminal, start Metro:
    ```bash
    npx react-native start --reset-cache
    ```
    In another terminal, run the app:
    ```bash
    npx react-native run-android
    ``` 

4.  **Dashboard**
    ```bash
    cd ../clinicflow-dashboard
    npm install
    npm start
    # http://localhost:3000
    ```

---

### 🗂 Folder Structure

clinicflow/  
├── clinicflow-backend/    # Node.js + Express + MongoDB backend  
├── ClinicFlowApp/         # React Native mobile chatbot app  
└── clinicflow-dashboard/  # React dashboard for staff  

---

### 📜 License & Usage Notice
This project is licensed under a **Proprietary License**.  
It is provided for production-ready demonstration purposes only.  

[See full LICENSE](./LICENSE)

---

### 🔒 Environment & Security

ClinicFlow follows standard production security practices:

-   Firebase, Google Cloud, and MongoDB credentials are securely managed via environment variables.
-   Sensitive files like `google-services.json` are excluded from version control.
-   API keys and private keys are never exposed in builds or repositories.
-   The backend connects to Dialogflow CX using a service account with restricted access scope.

---

### 👨‍💻 Author & Credits

**Tanvik Reddy Kotha**  
*Full-Stack Developer | AI & Cloud Enthusiast*  

Email ID: tanvikreddy123@gmail.com  
🔗 [LinkedIn](https://www.linkedin.com/in/tanvikreddy/) · [GitHub](https://github.com/tanvikreddy123)
