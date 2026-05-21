# Madhyastha AI — Dispute Resolution Platform

**Madhyastha AI** is a tiered dispute resolution platform designed to intercept civil disputes before they reach Indian courts. It leverages AI-driven mediation, human escalation, and binding arbitration to provide an accessible, affordable, and efficient legal resolution pipeline.

> Legal Anchors: **Mediation Act 2023** | **Arbitration & Conciliation Act 1996** | **CPC 1908**

---

## 🚀 Key Features

- **Prevention Engine**: Early dispute detection using a LightGBM risk scorer on civic data (RERA, CPGrams, etc.).
- **AI Mediation**: A 5-agent LLM pipeline (Groq llama3-70b) that facilitates private caucuses and joint sessions.
- **Human Escalation**: Seamless transition to NALSA-certified human mediators with AI-prepared case briefs.
- **Binding Arbitration**: Legally binding awards issued by registered arbitrators.
- **Court Filing Mode**: Automated petition and evidence bundle generation for eCourts.
- **Multilingual Support**: Real-time translation using Bhashini API for major Indian languages.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: SQLite (Development) / SQLAlchemy ORM
- **AI/LLM**: Groq API (llama3-70b-8192)
- **RAG**: FAISS + sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2)
- **PDF Generation**: ReportLab
- **Real-time**: WebSockets

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Vanilla CSS (Premium Light Theme)
- **State Management**: React Context + Hooks
- **Animations**: Framer Motion
- **Signatures**: react-signature-canvas

---

## 📂 Project Structure

```text
Madhyastha_AI/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── caucus_interviewer.py    # Private interview logic
│   │   │   ├── synthesis_analyst.py     # Multi-statement analysis
│   │   │   ├── joint_mediator.py        # Real-time facilitator
│   │   │   └── arbitration_brief.py     # Legal brief generator
│   │   ├── api/routes/
│   │   │   ├── dispute.py               # Registration & status
│   │   │   ├── caucus.py                # Private chat routes
│   │   │   ├── session.py               # Mediation session API
│   │   │   └── websocket.py             # Real-time WS handler
│   │   ├── core/
│   │   │   ├── config.py                # Pydantic settings
│   │   │   └── websocket_manager.py     # Connection handler
│   │   ├── db/
│   │   │   └── database.py              # SQLite/SQLAlchemy setup
│   │   ├── models/
│   │   │   └── models.py                # SQLAlchemy DB models
│   │   ├── rag/
│   │   │   ├── retriever.py             # FAISS search logic
│   │   │   └── build_index.py           # Index generation script
│   │   ├── services/
│   │   │   ├── groq_service.py          # LLM API wrapper
│   │   │   └── pdf_service.py           # ReportLab generators
│   │   └── main.py                      # FastAPI entry point
│   ├── ml/
│   │   └── risk_scorer/
│   │       ├── train.py                 # Model training
│   │       └── predict.py               # Risk scoring logic
│   ├── data/
│   │   ├── kanoon_faiss.index           # Vector DB
│   │   └── mock_cases.json              # RAG training data
│   └── requirements.txt                 # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBubble.jsx           # Message UI
│   │   │   └── SignaturePad.jsx         # Legal signing UI
│   │   ├── pages/
│   │   │   ├── Register.jsx             # Intake form
│   │   │   ├── Caucus.jsx               # Private session UI
│   │   │   ├── JointSession.jsx         # Real-time chat UI
│   │   │   └── Arbitration.jsx          # Award viewer
│   │   ├── hooks/
│   │   │   └── useWebSocket.js          # WS connection hook
│   │   └── App.jsx                      # Main App & Routing
│   ├── package.json                     # Frontend dependencies
│   └── vite.config.js                   # Build configuration
├── Project_Summary.md                   # Technical specification
├── README.md                            # Project documentation
└── run.py                               # Unified runner script
```

### 🔹 Backend Breakdown (`backend/app/`)
- **[agents/](file:///Users/shree/Desktop/Madhyastha_AI/backend/app/agents/)**: The 5-agent LLM pipeline that facilitates the entire mediation and arbitration brief process.
- **[api/routes/](file:///Users/shree/Desktop/Madhyastha_AI/backend/app/api/routes/)**: Handles all REST and WebSocket communication.
- **[rag/](file:///Users/shree/Desktop/Madhyastha_AI/backend/app/rag/)**: Implements Retrieval-Augmented Generation to anchor AI advice in real Indian legal precedents.
- **[ml/](file:///Users/shree/Desktop/Madhyastha_AI/backend/ml/)**: Contains the trained LightGBM model used for early dispute risk detection.

### 🔹 Frontend Breakdown (`frontend/src/`)
- **[pages/](file:///Users/shree/Desktop/Madhyastha_AI/frontend/src/pages/)**: Implements the multi-stage resolution UI, from registration to binding award issuance.
- **[components/](file:///Users/shree/Desktop/Madhyastha_AI/frontend/src/components/)**: Includes specialized legal UI components like `SignaturePad` for digital agreements.

---

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- [Groq API Key](https://console.groq.com/)

### 2. Setup Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the `backend/` directory:
```bash
GROQ_API_KEY=your_groq_api_key
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 4. Setup Frontend
```bash
cd frontend
npm install
```

### 5. Run the Application
From the root directory:
```bash
python run.py
```
- **Frontend**: http://localhost:5173
- **Backend Docs**: http://localhost:8000/docs

---

## 🏛️ Legal Compliance

- **Section 22, Mediation Act 2023**: Governing AI and human mediation settlements.
- **Section 36, Arbitration & Conciliation Act 1996**: Ensuring arbitration awards are enforceable as court decrees.
- **CPC 1908**: Guiding the automated court filing process.

---

## 📄 License
This project is developed for educational and demo purposes. See individual files for licensing details.
