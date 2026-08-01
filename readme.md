# 🚀 Tetra018 — AI-Powered Financial Consistency & Intelligent Invoice Audit Platform

<p align="center">

<img src="assets/banner.png" width="100%"/>

</p>

<p align="center">
An Enterprise AI Platform for Automated Invoice Processing, Financial Consistency Verification, Intelligent Audit Assistance, and Explainable Risk Detection.
</p>

<p align="center">

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb)
![PaddleOCR](https://img.shields.io/badge/PaddleOCR-OCR-orange)
![JWT](https://img.shields.io/badge/JWT-Authentication-red)
![MIT License](https://img.shields.io/badge/License-MIT-green)

</p>

---

# 📖 Project Overview

Tetra018 is an enterprise-grade AI-powered financial consistency platform built to automate invoice auditing, vendor verification, ledger matching, GST validation, and intelligent financial risk analysis.

Traditional invoice auditing requires accountants to manually verify hundreds of invoices against vendor masters, purchase ledgers, GST rules, and accounting records. This process is slow, expensive, and prone to human error.

Tetra018 transforms this workflow into a fully automated AI-driven pipeline capable of processing invoices within seconds while providing transparent reasoning for every detected inconsistency.

Unlike traditional OCR software, Tetra018 doesn't simply extract text from invoices—it understands financial documents, validates accounting rules, identifies anomalies, explains risks using AI, and allows auditors to interact with every invoice through a conversational AI assistant.

The platform combines OCR, rule-based validation, explainable AI, conversational intelligence, and comprehensive audit reporting into a single modern financial auditing solution.

---

# 🎯 Problem Statement

Financial teams process thousands of invoices every month.

Common challenges include:

- Manual invoice verification
- Duplicate invoice detection
- Incorrect GST calculations
- Fake vendor invoices
- Ledger mismatches
- Missing accounting entries
- Time-consuming audits
- Human calculation errors
- Lack of explainability
- Poor audit documentation

These issues increase operational costs while exposing organizations to financial risks and regulatory penalties.

---

# 💡 Our Solution

Tetra018 introduces an intelligent multi-stage audit engine capable of:

✅ Extracting invoice data automatically

✅ Validating every accounting field

✅ Matching invoices against ledgers

✅ Verifying vendor information

✅ Detecting duplicate invoices

✅ Calculating financial risk scores

✅ Explaining every detected issue using AI

✅ Allowing natural language conversations with invoices

✅ Generating enterprise-ready audit reports

---

# 🌟 Key Highlights

• AI-powered OCR Pipeline

• Automated Invoice Parsing

• GST Validation Engine

• Vendor Verification

• Purchase Ledger Matching

• Duplicate Invoice Detection

• Intelligent Risk Scoring

• Explainable AI Reasoning

• Conversational Invoice Chatbot

• PDF / CSV / Excel Report Generation

• Interactive Analytics Dashboard

• Audit Trail Management

• Vendor Master Management

• Ledger Management

• JWT Authentication

• REST API Architecture

---

# 🧠 System Architecture

```text
                        +----------------------+
                        |      Next.js UI      |
                        +----------+-----------+
                                   |
                                   |
                     REST API Communication
                                   |
                                   ▼
                     +-------------------------+
                     |      FastAPI Backend    |
                     +-----------+-------------+
                                 |
        ----------------------------------------------------------
        |             |              |              |            |
        ▼             ▼              ▼              ▼            ▼

 Authentication   OCR Engine    Validation     AI Engine     Reports
                  Pipeline        Engine

        |             |              |              |            |
        ▼             ▼              ▼              ▼            ▼

     JWT Auth     PaddleOCR      Rule Engine   LLM Service   PDF Export
                  PDF Parser      Risk Engine   Chatbot       CSV Export
                  Image Parser    AI Reasoning  Summaries     Excel Export

                                 |
                                 ▼

                        MongoDB Database
```

---

# 🧠 Intelligent Processing Pipeline

```mermaid
flowchart LR

A[Upload Invoice]

B[OCR Engine]

C[Invoice Parsing]

D[Field Extraction]

E[Validation Engine]

F[Risk Engine]

G[AI Reasoning]

H[Invoice Chatbot]

I[Audit Report]

A --> B

B --> C

C --> D

D --> E

E --> F

F --> G

G --> H

H --> I
```

---

# 🏗 Enterprise Architecture

```
User

↓

Frontend (Next.js)

↓

Authentication

↓

Invoice Upload API

↓

OCR Pipeline

↓

Field Extraction

↓

Validation Engine

↓

Risk Detection

↓

AI Reasoning

↓

Invoice Chatbot

↓

Report Generator

↓

Dashboard Analytics
```

---

# 🔄 Complete Invoice Lifecycle

```
Invoice Upload

↓

PDF / Image Parsing

↓

OCR Recognition

↓

Data Cleaning

↓

Invoice Field Extraction

↓

GST Verification

↓

Vendor Matching

↓

Ledger Matching

↓

Duplicate Detection

↓

Risk Scoring

↓

AI Explanation

↓

Audit Report

↓

Dashboard Analytics
```

---

# ⚡ Why Tetra018 is Different

Unlike conventional OCR software that only extracts invoice text, Tetra018 understands the business meaning behind financial documents.

Every uploaded invoice passes through multiple AI-powered validation engines before receiving an intelligent risk assessment and a fully explainable audit report.

The platform acts as an AI Audit Assistant rather than a simple OCR application.

---

# 🚀 Full Stack Platform Features

Tetra018 is divided into multiple intelligent modules that work together to automate the complete financial auditing workflow.

---

# 📄 Smart Invoice Upload

Supports

- PDF Invoices
- Image Invoices
- Scanned Documents
- Mobile Camera Images
- Excel Upload
- Batch Upload

Automatic preprocessing includes

- Noise Removal
- Image Enhancement
- Rotation Correction
- Perspective Correction
- OCR Optimization

---

# 🔍 Intelligent OCR Engine

Powered by PaddleOCR.

The OCR engine extracts structured financial information from unstructured invoices.

Automatically extracts:

• Invoice Number

• Invoice Date

• Due Date

• Vendor Name

• Vendor Address

• Vendor GSTIN

• Customer GSTIN

• Purchase Order

• Invoice Items

• HSN/SAC Codes

• Taxable Amount

• CGST

• SGST

• IGST

• Total Tax

• Grand Total

• Payment Terms

• Bank Details

---

# 📊 AI Extraction Engine

After OCR, extracted text is converted into structured business entities.

Modules include

- Invoice Parser
- Vendor Extractor
- GST Extractor
- Amount Extractor
- Date Extractor
- Tax Extractor
- Field Standardization
- Confidence Scoring

---

# ✅ Financial Validation Engine

The validation engine performs multiple accounting checks.

Checks include

✔ GST Validation

✔ Tax Verification

✔ Invoice Arithmetic

✔ Vendor Verification

✔ Purchase Ledger Matching

✔ Duplicate Invoice Detection

✔ Date Validation

✔ Missing Fields

✔ Invalid GST Format

✔ Invoice Number Verification

✔ Ledger Consistency

✔ Vendor Master Matching

---

# 🤖 AI Reasoning Engine

Unlike traditional validation systems that only report errors, Tetra018 explains every inconsistency using AI.

Example

Issue

GST Amount Mismatch

AI Explanation

Expected GST at 18% for a taxable amount of ₹12,500 is ₹2,250.

The uploaded invoice contains ₹2,640.

Difference detected:

₹390

Possible Reasons

• Incorrect GST calculation

• Manual modification

• Wrong tax slab

• Data entry error

Recommended Action

Verify invoice with vendor before processing payment.

---

# 📈 AI Risk Scoring

Every invoice receives an intelligent risk assessment.

Risk Categories

🟢 Low Risk

🟡 Medium Risk

🟠 High Risk

🔴 Critical Risk

Risk Score considers

- Duplicate Probability
- Vendor History
- GST Errors
- Ledger Mismatch
- Tax Difference
- Invoice Completeness
- AI Confidence
- Historical Behaviour

---

# 💬 AI Invoice Chatbot

Every invoice has its own conversational assistant.

Users can ask questions such as

```

Why is this invoice risky?

Explain the GST mismatch.

Summarize this invoice.

Who is the vendor?

Is this invoice duplicated?

Show all detected issues.

What should the auditor verify?

Generate audit notes.

Explain the tax calculation.

```

The chatbot understands the complete invoice context and answers follow-up questions using the extracted invoice data and AI reasoning engine.

---

# 📑 Report Generation

Generate professional reports including

- Audit Report
- Invoice Summary
- Validation Report
- Exception Report
- AI Summary
- Vendor Analysis
- Ledger Comparison

Export formats

- PDF
- CSV
- Excel

---

# 📧 Email Invoice Reports

Send individual invoice audit reports directly via email with the generated PDF attachment and AI-generated summary.

---

# 📝 Audit Trail Management

The audit module maintains complete financial history.

Features

- Upload Vendor Master
- Upload Purchase Ledger
- Edit Vendor Records
- Edit Ledger Records
- Import Excel Files
- Import PDF Documents
- Change Tracking
- Audit Logs
- Historical Modifications

---

# 📊 Interactive Dashboard

The analytics dashboard provides real-time business insights.

Widgets include

- Total Invoices
- Processed Today
- High Risk Invoices
- Duplicate Detection
- Vendor Statistics
- Monthly Trends
- GST Distribution
- Invoice Processing Status
- AI Risk Distribution
- Audit Progress

---

# 🔐 Security

Security Features

- JWT Authentication
- Password Hashing
- Protected APIs
- Role-Based Access
- Secure File Upload
- Input Validation
- Environment Variables
- CORS Protection
- Error Handling Middleware

---

# ⚙ Technology Stack

## Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- ShadCN UI
- React Hook Form
- Axios
- Context API

## Backend

- FastAPI
- Python
- Pydantic
- Uvicorn
- JWT
- MongoDB

## AI

- PaddleOCR
- OpenRouter / LLM
- AI Reasoning Engine
- Invoice Chatbot

## Reports

- PDF Generator
- Excel Export
- CSV Export

## DevOps

- Docker
- Docker Compose
- GitHub
- Environment Configuration

# 💻 Local Development Setup

Tetra018 is built as a modern full-stack application consisting of a **Next.js frontend** and a **FastAPI backend**. Follow the steps below to run the application locally.

---

# 📋 Prerequisites

Before running the project, ensure the following software is installed.

| Software | Version |
|-----------|----------|
| Python | 3.11+ |
| Node.js | 20+ |
| npm | Latest |
| Git | Latest |
| MongoDB | 7+ |
| Docker *(Optional)* | Latest |

---

# 📥 Clone Repository

```bash
git clone https://github.com/Aaiyub-shaikh/Tetra018.git

cd Tetra018
```

---

# ⚙ Backend Setup

Navigate to backend

```bash
cd backend
```

Create virtual environment

```bash
python -m venv .venv
```

Activate

### Windows

```bash
.venv\Scripts\activate
```

### Linux / macOS

```bash
source .venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Start FastAPI

```bash
uvicorn app.main:app --reload
```

Backend runs at

```
http://localhost:8000
```

---

# 🌐 Frontend Setup

Navigate to frontend

```bash
cd frontend
```

Install packages

```bash
npm install
```

Run Next.js

```bash
npm run dev
```

Frontend runs at

```
http://localhost:3000
```

---

# 🐳 Docker Setup

Build containers

```bash
docker compose build
```

Run

```bash
docker compose up
```

Stop

```bash
docker compose down
```

---

# 🔐 Environment Variables

Create

```
backend/.env
```

Example

```env
APP_NAME=Tetra018

SECRET_KEY=your_secret_key

JWT_ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=60

MONGODB_URI=mongodb:+srv//atlas-server/tetra018

DATABASE_NAME=tetra018

UPLOAD_FOLDER=uploads

REPORT_FOLDER=reports

OPENROUTER_API_KEY=

GEMINI_API_KEY=

EMAIL_USERNAME=

EMAIL_PASSWORD=

SMTP_SERVER=smtp.gmail.com

SMTP_PORT=587
```

Never commit the real `.env` file.

---

# 🔑 Demo Credentials

Use the following credentials to explore the application without creating a new account.

| Role | Email | Password |
|------|-------|----------|
| Compliance Officer | `compliance@tetra.com` | `password123` |

> **Note:** These credentials are for demonstration purposes only and are intended for evaluating the application's features.

---

# 📁 Project Structure

```text
Tetra018
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   └── router.py
│   │   │
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   ├── dependencies/
│   │   ├── utils/
│   │   │
│   │   ├── services/
│   │   │   ├── ocr/
│   │   │   ├── parser/
│   │   │   ├── extractor/
│   │   │   ├── validation/
│   │   │   ├── risk/
│   │   │   ├── ai/
│   │   │   ├── reports/
│   │   │   ├── email/
│   │   │   └── dashboard/
│   │   │
│   │   ├── main.py
│   │   └── __init__.py
│   │
│   ├── uploads/
│   │   ├── invoices/
│   │   ├── processed/
│   │   └── temp/
│   │
│   ├── reports/
│   │   ├── pdf/
│   │   ├── csv/
│   │   └── excel/
│   │
│   ├── dataset/
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   └── .gitignore
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── services/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── constants/
│   │   ├── assets/
│   │   └── styles/
│   │
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── components.json
│
├── README.md
└── LICENSE
```

# 📡 REST API Endpoints

Authentication

```
POST   /api/auth/login

POST   /api/auth/register

POST   /api/auth/logout
```

Invoices

```
POST   /api/upload

GET    /api/invoices

GET    /api/invoices/{id}

DELETE /api/invoices/{id}
```

Vendor

```
GET

POST

PUT

DELETE
```

Reports

```
Generate PDF

Generate CSV

Generate Excel

Download Reports
```

Dashboard

```
Analytics

Charts

Statistics

Risk Summary
```

Audit

```
Ledger Upload

Vendor Upload

Audit Trail

Risk Analysis
```

---

# 🔄 Technical Workflow

```
User

↓

Upload Invoice

↓

OCR Processing

↓

Field Extraction

↓

Validation Engine

↓

Risk Engine

↓

AI Reasoning

↓

Invoice Chatbot

↓

Report Generation

↓

Dashboard Analytics
```

---

# ⚡ Performance Optimizations

✔ Image Preprocessing

✔ OCR Confidence Filtering

✔ Fuzzy Vendor Matching

✔ Regex Optimization

✔ AI Prompt Engineering

✔ Modular Service Architecture

✔ Repository Pattern

✔ Dependency Injection

✔ Lazy Component Loading

✔ API Separation

---
# 🛡 Security Features

- JWT Authentication
- Password Hashing
- Secure File Upload
- Protected APIs
- Role Based Access Control
- Input Validation
- Secure Environment Variables
- Error Handling Middleware
- Request Validation
- CORS Protection

---

# 🧪 Testing

Run backend tests

```bash
pytest
```

Run specific tests

```bash
pytest tests/test_ocr.py

pytest tests/test_validation.py

pytest tests/test_risk.py

pytest tests/test_api.py
```

---

# 📊 Future Roadmap

## AI

- AI Fraud Detection

- Invoice Similarity Search

- Multi-Agent Audit Assistant

- Financial Forecasting

- Automatic Ledger Suggestions

- Vendor Risk Prediction

---

## OCR

- Handwritten Invoice Recognition

- Multi-language OCR

- Barcode Recognition

- QR Code Parsing

---

## Reports

- Interactive BI Dashboard

- Scheduled Reports

- Email Automation

- Audit Timeline

---

## Enterprise

- SAP Integration

- Tally Integration

- Zoho Books Integration

- QuickBooks Integration

- GST Portal Verification

- ERP Integration

---

# 🤝 Contributing

Contributions are welcome.

Steps

```bash
Fork Repository

Create Feature Branch

Commit Changes

Push Branch

Open Pull Request
```

---

# 👨‍💻 Team

## Tetra018

AI-Powered Financial Consistency & Intelligent Invoice Audit Platform

### Core Modules

- OCR Pipeline
- AI Extraction Engine
- Validation Engine
- AI Reasoning
- Invoice Chatbot
- Dashboard
- Audit Trail
- Reports
- Authentication

---

# 🏆 Hackathon Compliance

✔ End-to-End Working Application

✔ AI Powered

✔ OCR Based

✔ Explainable AI

✔ Modern UI

✔ REST APIs

✔ Docker Support

✔ Modular Architecture

✔ Production Ready Codebase

✔ Enterprise Folder Structure

---

# 📜 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2026 Tetra018

Permission is hereby granted, free of charge,
to any person obtaining a copy of this software...
```

---

# ❤️ Acknowledgements

Special thanks to

- PaddleOCR
- FastAPI
- Next.js
- React
- MongoDB
- OpenRouter
- Tailwind CSS
- Python Community

---

# ⭐ Support

If you found this project useful,

⭐ Star this repository

🍴 Fork the repository

🐛 Report issues

💡 Suggest improvements

---

<p align="center">

Made with ❤️ by Team Tetra018

Built for **TetraThon Hackathon 2026**

</p>