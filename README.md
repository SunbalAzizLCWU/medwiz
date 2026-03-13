<div align="center">

# 🏥 MedWiz (AuraNode)

### AI-Powered Medical Report Analysis Platform for Healthcare Clinics

[![Stars](https://img.shields.io/github/stars/SunbalAzizLCWU/medwiz?style=flat-square&logo=github)](https://github.com/SunbalAzizLCWU/medwiz/stargazers)
[![Forks](https://img.shields.io/github/forks/SunbalAzizLCWU/medwiz?style=flat-square&logo=github)](https://github.com/SunbalAzizLCWU/medwiz/network/members)
[![Issues](https://img.shields.io/github/issues/SunbalAzizLCWU/medwiz?style=flat-square)](https://github.com/SunbalAzizLCWU/medwiz/issues)
[![Last Commit](https://img.shields.io/github/last-commit/SunbalAzizLCWU/medwiz?style=flat-square)](https://github.com/SunbalAzizLCWU/medwiz/commits/main)
[![License](https://img.shields.io/github/license/SunbalAzizLCWU/medwiz?style=flat-square)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Screenshots](#-screenshots--demo)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)
- [Acknowledgements](#-acknowledgements)

---

## 🔍 Project Overview

**MedWiz** (internally branded as **AuraNode**) is an AI-powered medical report analysis platform built for healthcare clinics. It automates the analysis of X-ray images and laboratory test reports, dramatically reducing the time clinicians spend on manual interpretation.

### The Problem

Clinics — especially in resource-constrained settings — face bottlenecks:
- Radiologists and doctors are overloaded with routine report interpretation
- Manual data extraction from lab reports is error-prone and slow
- Patients wait longer than necessary for results

### The Solution

MedWiz introduces an AI-assisted workflow:
1. A clinic worker uploads an X-ray or lab report PDF
2. The AI engine analyzes the file instantly — classifying X-rays and extracting lab values
3. A Groq LLM generates a concise clinical summary
4. A doctor reviews and approves the AI findings before they are delivered to the patient

### Who Is It For?

- Diagnostic clinics and hospitals
- Radiologists and general practitioners
- Healthcare IT teams looking for a self-hostable AI triage system

---

## ✨ Features

- 🩻 **X-ray Analysis** — EfficientNet ONNX model classifies chest X-rays as Normal or Abnormal
- 🧪 **Lab Report OCR** — Automatically extracts key haematology values (HGB, WBC, PLT, etc.) with reference ranges using EasyOCR
- 🤖 **LLM Clinical Summaries** — Groq API generates short, professional 2-sentence summaries for each report
- 👨‍⚕️ **Doctor Review Workflow** — Structured queue for doctors to approve or annotate AI findings
- 🏢 **Multi-Tenant Architecture** — Each clinic is isolated using Supabase Row Level Security (RLS)
- 🔐 **Role-Based Access Control** — `clinic_admin`, `clinic_worker`, `doctor`, and `superadmin` roles
- 📄 **PDF Report Generation** — Downloadable patient-facing PDF reports rendered in-browser
- 📱 **WhatsApp Delivery** — One-click WhatsApp notification for patients
- 🔔 **Real-Time Notifications** — Doctors are notified when new reports require review
- ⏱️ **Background Job Queue** — APScheduler handles async processing and stale-report cleanup
- 📊 **Audit Logs** — Complete action history visible to superadmins
- 🚦 **Rate Limiting** — SlowAPI protects all public-facing endpoints

---

## 📸 Screenshots / Demo

> **Note:** Screenshots will be added after the first public deployment.

| Page | Description |
|------|-------------|
| ![Dashboard](docs/screenshots/dashboard.png) | Clinic worker dashboard — upload and track reports |
| ![Doctor Review](docs/screenshots/doctor_review.png) | Doctor review queue with AI findings |
| ![Admin Panel](docs/screenshots/admin.png) | Admin panel for organisation management |

*Replace placeholder paths above with real screenshots once the app is deployed.*

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 18, TypeScript, Tailwind CSS |
| **Backend** | FastAPI 0.111, Python 3.11, Uvicorn |
| **Database** | Supabase (PostgreSQL + Auth + Storage) |
| **AI / ML** | ONNX Runtime (EfficientNet), EasyOCR, Groq LLM API |
| **PDF** | `@react-pdf/renderer`, PyMuPDF |
| **Task Queue** | APScheduler |
| **Deployment** | Vercel (frontend), Render (backend) |
| **CI/CD** | GitHub Actions |

---

## 🚀 Installation

### Prerequisites

- **Python** 3.11.8 ([pyenv](https://github.com/pyenv/pyenv) recommended)
- **Node.js** 18+ and npm
- A free [Supabase](https://supabase.com) project
- A free [Groq](https://console.groq.com) API key

### 1. Clone the Repository

```bash
git clone https://github.com/SunbalAzizLCWU/medwiz.git
cd medwiz
```

### 2. Set Up the Database

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** inside your Supabase project.
3. Copy the contents of `auranode-api/supabase/schema.sql` and run it.  
   This creates all tables, RLS policies, and indexes.

### 3. Set Up the Backend

```bash
cd auranode-api

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# → Edit .env and fill in your SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY, etc.

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now available at **http://localhost:8000**  
Interactive docs (Swagger UI): **http://localhost:8000/docs**

### 4. Set Up the Frontend

```bash
cd auranode-web

# Install npm dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# → Edit .env.local and fill in your Supabase URL, anon key, and API URL

# Start the development server
npm run dev
```

The web app is now available at **http://localhost:3000**

---

## 💡 Usage

### Typical Clinic Workflow

1. **Clinic Worker logs in** at `/login` using their organisation credentials.
2. **Upload a report** via the dashboard (`/dashboard/upload`):
   - Drag-and-drop an X-ray image (`.jpg`, `.png`) or a lab report PDF.
3. **AI processes the file** automatically (status: `uploading → processing → awaiting_doctor`).
4. **Doctor logs in** and sees the pending report in their queue (`/doctor`).
5. **Doctor reviews** AI findings, optionally adds clinical notes, and approves the report (`status: reviewed`).
6. **Report is delivered** to the patient and the status updates to `delivered`.
7. The clinic worker can **download a PDF** or send the result via **WhatsApp**.

### Admin Tasks

Clinic admins log in to `/admin` to:
- Manage staff accounts and doctor assignments
- View audit logs
- Configure organisation settings

### API Usage

```bash
# Health check
curl http://localhost:8000/api/health

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@clinic.com", "password": "secret"}'

# Upload an X-ray for analysis (requires Bearer token)
curl -X POST http://localhost:8000/api/analyze/xray \
  -H "Authorization: Bearer <token>" \
  -F "file=@chest_xray.jpg"
```

Full API documentation is available at `/docs` (Swagger UI) or `/redoc`.

---

## 🗂 Project Structure

```
medwiz/
├── auranode-api/          # FastAPI backend
│   ├── app/
│   │   ├── api/           # Route handlers (analyze, auth, reports, org, health)
│   │   ├── core/          # Config, security, logging
│   │   ├── db/            # Supabase client initialization
│   │   ├── models/        # Pydantic request/response models
│   │   ├── services/      # Business logic (OCR, X-ray inference, Groq, notifications)
│   │   ├── workers/       # Background job queue (APScheduler)
│   │   └── main.py        # FastAPI app entry point
│   ├── supabase/
│   │   └── schema.sql     # Database schema & RLS policies
│   ├── tests/             # pytest test suite
│   ├── .env.example       # Backend environment variable template
│   └── requirements.txt   # Python dependencies
│
├── auranode-web/          # Next.js frontend
│   ├── app/               # Next.js App Router pages
│   │   ├── page.tsx       # Landing page
│   │   ├── login/         # Login page
│   │   ├── dashboard/     # Clinic worker dashboard & upload
│   │   ├── doctor/        # Doctor review queue
│   │   ├── admin/         # Admin panel
│   │   └── report/        # Report viewer & PDF export
│   ├── components/        # Reusable React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # API clients & utilities
│   ├── types/             # TypeScript type definitions
│   ├── .env.example       # Frontend environment variable template
│   └── package.json       # npm dependencies
│
└── .github/
    └── workflows/
        └── ci.yml         # GitHub Actions CI pipeline
```

---

## ⚙️ Configuration

### Backend — `auranode-api/.env`

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_KEY` | Supabase service-role or anon key |
| `GROQ_API_KEY` | API key from [console.groq.com](https://console.groq.com) |
| `ONNX_MODEL_URL` | Public URL to the EfficientNet ONNX model file |
| `JWT_SECRET` | Supabase JWT secret (found in project settings) |
| `ENVIRONMENT` | `development` or `production` |
| `ALLOWED_ORIGINS` | JSON array of allowed CORS origins |
| `MODEL_CACHE_PATH` | Local path to cache the downloaded ONNX model |

### Frontend — `auranode-web/.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_APP_URL` | Frontend base URL (e.g. `http://localhost:3000`) |

---

## 🗺 Roadmap

- [ ] Mobile-responsive PWA for field workers
- [ ] Support for additional modalities (MRI, CT scan reports)
- [ ] DICOM file support
- [ ] Integration with popular HIS/EMR systems
- [ ] Batch upload and bulk processing
- [ ] Multi-language support (Urdu, Arabic)
- [ ] On-premise deployment guide with Docker Compose
- [ ] Expanded ML model coverage (bone fracture, lung nodule detection)
- [ ] Patient portal with self-service result access

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository on GitHub.

2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/medwiz.git
   cd medwiz
   ```

3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes** and ensure the tests pass:
   ```bash
   # Backend
   cd auranode-api
   pytest tests/ -v
   ruff check app/

   # Frontend
   cd auranode-web
   npm run lint
   ```

5. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add support for MRI report parsing"
   ```

6. **Push** your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** against the `main` branch and describe your changes.

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Sunbal Aziz**  
LCWU — Lahore College for Women University  
GitHub: [@SunbalAzizLCWU](https://github.com/SunbalAzizLCWU)

---

## 🙏 Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/) — high-performance Python web framework
- [Next.js](https://nextjs.org/) — React framework for production
- [Supabase](https://supabase.com/) — open-source Firebase alternative
- [Groq](https://groq.com/) — ultra-fast LLM inference API
- [ONNX Runtime](https://onnxruntime.ai/) — cross-platform ML model inference
- [EasyOCR](https://github.com/JaidedAI/EasyOCR) — ready-to-use OCR library
- [Tailwind CSS](https://tailwindcss.com/) — utility-first CSS framework
- [Vercel](https://vercel.com/) & [Render](https://render.com/) — deployment platforms
- The open-source community for the countless libraries that power this project
