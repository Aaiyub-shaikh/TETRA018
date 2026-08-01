# 🚀 TETRA018 - AI-Powered Invoice Risk Scanner

An AI-powered Invoice Risk Scanner built for **TETRATHON 018** to help MSMEs and audit teams automate invoice verification, detect accounting anomalies, and generate AI-powered audit insights.

---

# 📌 Features

- 📄 Invoice Upload & Processing
- 🤖 AI-Powered Audit Engine (Google Gemini)
- 📊 Invoice Risk Scoring
- 🔍 Duplicate Invoice Detection
- 🧾 Vendor Master Validation
- 📒 Purchase Ledger Reconciliation
- ✅ GSTIN Validation
- 📈 Audit Dashboard
- ☁️ MongoDB Atlas Integration
- ⚡ FastAPI Backend
- 🎨 Next.js Frontend

---

# 🏗️ Tech Stack

## Backend

- FastAPI
- Python 3.12+
- PyMongo
- MongoDB Atlas
- Google Gemini API
- Pydantic
- Uvicorn

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

---

# 📂 Project Structure

```text
TETRA018
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   ├── api/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── database.py
│   │   ├── config.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md
```

---

# ⚙️ Backend Setup

## 1. Navigate to Backend

```bash
cd backend
```

---

## 2. Create Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS/Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configure Environment Variables

Create a `.env` file inside the **backend** folder.

```env
MONGODB_URI=your_mongodb_atlas_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
```

> **Note:** If your project configuration requires a database name, also add:

```env
DATABASE_NAME=your_database_name
```

---

## 5. Run Backend

```bash
uvicorn app.main:app --reload
```

Backend will run on:

```
http://127.0.0.1:8000
```

API Documentation:

```
http://127.0.0.1:8000/docs
```

---

# ⚛️ Frontend Setup

## 1. Navigate to Frontend

```bash
cd frontend
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Start Development Server

```bash
npm run dev
```

Frontend will run on:

```
http://localhost:3000
```

---

# 📊 API Endpoints

| Method | Endpoint | Description |
|----------|-----------------------------|------------------------------|
| GET | `/health` | Health Check |
| POST | `/upload` | Upload Invoice |
| GET | `/invoices` | List Invoices |
| GET | `/vendors` | Vendor Master |
| GET | `/ledger` | Purchase Ledger |
| GET | `/dashboard` | Dashboard Statistics |
| GET | `/reports` | Audit Reports |
| GET | `/api/v1/audit/{invoice_number}` | Audit an Invoice |

---

# 🔍 Audit Checks

The audit engine performs multiple validations including:

- Duplicate Invoice Detection
- Vendor Validation
- Purchase Ledger Matching
- GSTIN Validation
- Amount Verification
- Date Validation
- Risk Score Calculation
- AI-generated Audit Explanation

---

# 🤖 AI Audit Engine

The backend uses **Google Gemini API** to generate a human-readable explanation for detected anomalies.

Example:

> Invoice INV1001 exhibits a Medium risk profile due to a duplicate invoice detected in the database. Manual verification is recommended before approval.

---

# 🗄️ Database Collections

- invoices
- vendor_master
- purchase_ledger
- audit_results

---

# 👥 Team

Developed during **TETRATHON 018** by Team **TETRA018**.

---

# 📄 License

This project was developed for the **TETRATHON 018 Hackathon**.
