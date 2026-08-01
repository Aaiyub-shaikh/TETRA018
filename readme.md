# 🚀 TETRA018

Project implementation for TETRATHON 018. This project features a Python-based backend service integrated with MongoDB Atlas and a Next.js web application frontend.

## 📂 Project Structure
- **/backend**: Core Python application services, data processing, and integration scripts.
- **/frontend**: Next.js client-side web user interface.

---

## 🐍 Backend Setup (Python)

1. Navigate to the backend workspace:
   ```bash
   cd backend
   ```
2. Set up and activate an isolated virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install required backend framework and MongoDB dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in this directory and populate your database connectivity strings securely:
   ```env
   MONGODB_URI=your_mongodb_atlas_connection_string
   ```

---

## ⚛️ Frontend Setup (Next.js)

1. From the project root, navigate to the frontend workspace:
   ```bash
   cd frontend
   ```
2. Install the necessary project dependencies:
   ```bash
   npm install
   ```
3. Boot up the local Next.js development server:
   ```bash
   npm run dev
   ```
   The client application will run locally on `http://localhost:3000`.
