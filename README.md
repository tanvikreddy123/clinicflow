# ClinicFlow – AI-Powered Patient Intake System

A full-stack patient intake system where patients check in through a React Native AI chatbot, data flows into a Node.js/Express backend, and clinic staff can review everything in a React dashboard.

---

### Features

-   **AI Chatbot (React Native):** Built on Google Dialogflow CX, the chatbot makes the check-in process conversational and easy to follow.
-   **Backend (Node/Express/MongoDB):** Securely stores patient intake data, manages the review workflow, and exposes RESTful API endpoints.
-   **Dashboard (React):** A dedicated portal for clinic staff to view, sort, filter, and mark patient intakes as reviewed.
-   **Real-Time Flow:** Patients check in via the chatbot → intake data is instantly synced to the backend → staff can review the new submission on the dashboard.
-   **Clean Architecture:** Built with a modular structure, featuring distinct services, Mongoose models, and a reusable API layer for maintainability.

---

### Tech Stack

#### **Backend** (`clinicflow-backend`)

-   Node.js, Express
-   MongoDB, Mongoose
-   Dialogflow CX SDK (`@google-cloud/dialogflow-cx`)
-   Morgan (logging), UUID, dotenv

#### **Mobile App** (`ClinicFlowApp`)

-   React Native
-   Axios (with interceptors for logging)
-   `Animated` + `KeyboardAvoidingView` for a smooth chat UI
-   Tested on Android (emulator & physical device), iOS setup possible with Xcode but not included here.

#### **Dashboard** (`clinicflow-dashboard`)

-   React (Create React App)
-   Axios
-   Testing Library (Jest + React Testing Library)

---

### Quick Start (Local)

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/clinicflow.git
    cd clinicflow
    ```

2.  **Backend (API Server)**
    -   Navigate to the backend directory and install dependencies:
        ```bash
        cd clinicflow-backend
        npm install
        ```
    -   Create a `.env` file in the `clinicflow-backend/` root:
        ```env
        PORT=5000
        MONGO_URI=your_mongodb_connection_string
        GOOGLE_PROJECT_ID=your_dialogflow_project_id
        GOOGLE_CLIENT_EMAIL=your_service_account_email
        GOOGLE_PRIVATE_KEY="your_private_key"
        DIALOGFLOW_AGENT_ID=your_agent_id
        DIALOGFLOW_LOCATION=us-central1
        ```
    -   Start the server:
        ```bash
        node server.js
        # Server -> http://localhost:5000
        ```

3.  **Mobile App (React Native Chatbot)**
    -   Make sure your Android Emulator (or a real device) is running.
    -   Navigate to the app directory and install dependencies:
        ```bash
        cd ../ClinicFlowApp
        npm install
        ```
    -   In one terminal, start the Metro bundler:
        ```bash
        npx react-native start --reset-cache
        ```
    -   In another terminal, install and launch the app on your emulator/device:
        ```bash
        npx react-native run-android
        ```

4.  **Dashboard (React Web App)**
    -   Navigate to the dashboard directory and install dependencies:
        ```bash
        cd ../clinicflow-dashboard
        npm install
        ```
    -   Start the React development server:
        ```bash
        npm start
        # App -> http://localhost:3000
        ```

---

### Running the Full System

To run everything together, you will typically need **4 separate terminals**:

1.  **Backend API**
    ```bash
    cd clinicflow-backend
    node server.js
    ```

2.  **React Native Metro Bundler**
    ```bash
    cd ClinicFlowApp
    npx react-native start --reset-cache
    ```

3.  **React Native App Runner**
    ```bash
    cd ClinicFlowApp
    npx react-native run-android
    ```

4.  **React Dashboard**
    ```bash
    cd clinicflow-dashboard
    npm start
    ```

---

### Folder Structure

clinicflow/  
├── clinicflow-backend/    # Node.js + Express + MongoDB backend  
├── ClinicFlowApp/         # React Native mobile chatbot app  
└── clinicflow-dashboard/  # React dashboard for staff  

---

### Notes

-   Make sure a MongoDB instance is running locally or use a cloud service like MongoDB Atlas.
-   The backend requires Google Cloud credentials for a service account with Dialogflow API access. These should be provided in the `.env` file.
-   The mobile app is configured for Android. Use Android Studio to set up an emulator or connect a physical device.

---

*Project by Tanvik Reddy Kotha*
