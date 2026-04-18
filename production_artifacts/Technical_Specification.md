# FairLens AI — Technical Specification

> **Version**: 1.0  
> **Date**: 2026-04-16  
> **Author**: Product Manager (Autonomous Pipeline)  
> **Hackathon Theme**: "Unbiased AI Decision – Ensuring Fairness and Detecting Bias in Automated Decisions"

---

## 1. Executive Summary

**FairLens AI** is an enterprise-grade AI fairness auditing platform that enables organizations to detect, explain, and mitigate bias in automated decision-making systems. Users upload datasets, run fairness audits powered by industry-standard metrics (Demographic Parity, Equal Opportunity, Disparate Impact, etc.), receive plain-English explanations via **Google Gemini API**, visualize feature importance with **SHAP**, and generate compliance-ready PDF reports.

The platform supports **Guest / Demo Mode** for instant access with pre-loaded sample datasets and biased models, alongside full **Firebase Authentication** for registered users who can persist their audits.

---

## 2. Functional Requirements

### FR-1: Authentication & Access
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | **Guest Login / Demo Mode** — "Continue as Guest" button on landing page. Instantly loads demo dashboard with pre-configured sample datasets (hiring.csv, loan.csv, college_admission.csv) and a sample biased model. No signup required. Guest data is session-only (not persisted). | P0 |
| FR-1.2 | **Email/Password Sign-Up & Sign-In** via Firebase Auth. | P0 |
| FR-1.3 | **Google OAuth Sign-In** via Firebase Auth. | P1 |
| FR-1.4 | **JWT Token Management** — Backend validates Firebase ID tokens on every authenticated request. | P0 |
| FR-1.5 | Registered users can save, view, and delete past audits. | P0 |

### FR-2: Dataset Upload & Parsing
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Upload CSV or Excel (.xlsx) files up to 50 MB. | P0 |
| FR-2.2 | Parse and display dataset preview (first 10 rows, column names, types, basic stats). | P0 |
| FR-2.3 | **Auto-detect sensitive attributes** by matching column names against a configurable dictionary: `gender`, `sex`, `age`, `race`, `ethnicity`, `caste`, `religion`, `location`, `region`, `income`, `disability`, `marital_status`, `nationality`. | P0 |
| FR-2.4 | Allow user to manually select/override sensitive attributes and the target (label) column. | P0 |
| FR-2.5 | Store uploaded datasets temporarily (session-scoped for guests, Firebase Storage for registered users). | P1 |

### FR-3: Bias Detection Engine
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Compute **Demographic Parity Difference** per sensitive attribute. | P0 |
| FR-3.2 | Compute **Equal Opportunity Difference** (true positive rate gap). | P0 |
| FR-3.3 | Compute **Disparate Impact Ratio**. | P0 |
| FR-3.4 | Compute **Statistical Parity Difference**. | P0 |
| FR-3.5 | Compute **Individual Fairness Score** (consistency metric). | P1 |
| FR-3.6 | Train a lightweight classifier (Logistic Regression / Random Forest via scikit-learn) on the uploaded data if no model is provided. | P0 |
| FR-3.7 | Return per-group metrics breakdown with pass/fail thresholds (configurable, default 80/20 rule for disparate impact). | P0 |

### FR-4: AI-Powered Explanation (Gemini)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Send fairness metrics + dataset context to **Gemini API** to generate plain-English bias explanation. | P0 |
| FR-4.2 | Gemini summarizes the fairness audit for non-technical stakeholders. | P0 |
| FR-4.3 | Gemini identifies and describes disadvantaged groups. | P0 |
| FR-4.4 | Gemini generates an executive-friendly summary suitable for compliance reports. | P0 |

### FR-5: AI Bias Mitigation Advisor
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Gemini recommends specific fairness improvement strategies (rebalancing, threshold tuning, feature removal, re-weighting). | P0 |
| FR-5.2 | Display recommendations in an actionable checklist format. | P0 |

### FR-6: Explainable AI Dashboard
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Compute **SHAP values** for the trained model. | P0 |
| FR-6.2 | Display SHAP summary plot (feature importance bar chart). | P0 |
| FR-6.3 | Display SHAP force plot for individual predictions. | P1 |
| FR-6.4 | Decision reasoning panel explaining why a specific prediction was made. | P1 |

### FR-7: Fairness Simulation Lab
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Interactive threshold sliders for adjusting classification thresholds per group. | P0 |
| FR-7.2 | Real-time before/after fairness metric comparison. | P0 |
| FR-7.3 | Visual side-by-side chart showing metric changes. | P0 |

### FR-8: Audit Report Generator
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-8.1 | Generate downloadable PDF report with all audit results. | P0 |
| FR-8.2 | Include Gemini-generated compliance summary in the report. | P0 |
| FR-8.3 | Include charts and metrics tables in PDF. | P1 |

### FR-9: Demo Datasets & Sample Model
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-9.1 | Include `hiring.csv` — synthetic hiring dataset with gender/race bias. | P0 |
| FR-9.2 | Include `loan.csv` — synthetic loan approval dataset with income/race bias. | P0 |
| FR-9.3 | Include `college_admission.csv` — synthetic admissions dataset with caste/gender bias. | P0 |
| FR-9.4 | Pre-trained biased model (pickle) for instant guest demo. | P0 |

---

## 3. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Bias analysis for datasets up to 100K rows should complete within 30 seconds. |
| **Security** | All API endpoints (except public/guest) require valid Firebase JWT. CORS restricted to frontend origin. |
| **Scalability** | Stateless FastAPI backend, horizontally scalable on Cloud Run. |
| **Accessibility** | WCAG 2.1 AA compliance for dashboard UI. |
| **Browser Support** | Chrome, Firefox, Edge, Safari (latest 2 versions). |
| **Responsiveness** | Fully responsive — desktop, tablet, and mobile. |

---

## 4. Architecture & Tech Stack

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
│             Tailwind CSS · Framer Motion · Recharts      │
│                  Firebase Auth SDK (client)               │
├─────────────────────────────────────────────────────────┤
│                         ↕ REST API (JSON)                │
├─────────────────────────────────────────────────────────┤
│                    BACKEND (FastAPI / Python)             │
│   ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│   │  Auth    │  │  Bias    │  │  Gemini Integration  │  │
│   │  Module  │  │  Engine  │  │  (google-genai SDK)  │  │
│   └──────────┘  └──────────┘  └──────────────────────┘  │
│   ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│   │  SHAP    │  │  Report  │  │  Dataset Manager     │  │
│   │  Module  │  │  Gen     │  │                      │  │
│   └──────────┘  └──────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    DATA LAYER                            │
│   Firebase Firestore (user audits)                       │
│   Firebase Storage (uploaded datasets)                   │
│   Local filesystem (session/guest temp files)            │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Technology Choices

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend Framework** | React 18 + Vite | Fast build, HMR, modern DX |
| **CSS** | Tailwind CSS 3 | Utility-first, rapid styling, dark mode support |
| **Animations** | Framer Motion | Smooth micro-animations, page transitions |
| **Charts** | Recharts | React-native charting, great for bar/radar/line charts |
| **Auth (Client)** | Firebase Auth SDK | Google/Email sign-in, guest mode |
| **Backend** | FastAPI (Python 3.11+) | Async, fast, auto-docs, Python ML ecosystem |
| **ML / Fairness** | scikit-learn, Fairlearn | Industry-standard bias metrics |
| **Explainability** | SHAP | Model-agnostic feature explanations |
| **LLM** | Google Gemini API (`google-generativeai` SDK) | Plain-English explanations, mitigation advice |
| **PDF Generation** | ReportLab | Python PDF creation |
| **Database** | Firebase Firestore | NoSQL, real-time, serverless |
| **File Storage** | Firebase Storage | Scalable file uploads |
| **Deployment** | Google Cloud Run (backend) + Firebase Hosting (frontend) | Serverless, auto-scaling |

### 4.3 Frontend Structure

```
app_build/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css              # Tailwind directives + custom styles
│       ├── config/
│       │   └── firebase.js        # Firebase client config
│       ├── contexts/
│       │   └── AuthContext.jsx     # Auth state provider
│       ├── hooks/
│       │   └── useAuth.js         # Auth hook
│       ├── pages/
│       │   ├── LandingPage.jsx    # Hero + CTA + Guest login
│       │   ├── LoginPage.jsx      # Email/Google sign-in
│       │   ├── DashboardPage.jsx  # Main audit dashboard
│       │   ├── UploadPage.jsx     # Dataset upload + preview
│       │   ├── AuditResultsPage.jsx  # Bias metrics + Gemini explanation
│       │   ├── ExplainabilityPage.jsx # SHAP visualizations
│       │   ├── SimulationPage.jsx  # Fairness simulation lab
│       │   └── ReportPage.jsx     # Report generation + download
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── DashboardLayout.jsx
│       │   ├── auth/
│       │   │   ├── GuestLoginButton.jsx
│       │   │   └── AuthGuard.jsx
│       │   ├── upload/
│       │   │   ├── FileDropzone.jsx
│       │   │   └── DataPreview.jsx
│       │   ├── metrics/
│       │   │   ├── MetricCard.jsx
│       │   │   ├── BiasGauge.jsx
│       │   │   └── MetricsGrid.jsx
│       │   ├── charts/
│       │   │   ├── FairnessRadar.jsx
│       │   │   ├── GroupComparisonBar.jsx
│       │   │   └── ShapChart.jsx
│       │   ├── gemini/
│       │   │   ├── GeminiExplanation.jsx
│       │   │   └── MitigationAdvisor.jsx
│       │   ├── simulation/
│       │   │   ├── ThresholdSlider.jsx
│       │   │   └── BeforeAfterComparison.jsx
│       │   └── common/
│       │       ├── LoadingSpinner.jsx
│       │       ├── GlassCard.jsx
│       │       └── AnimatedCounter.jsx
│       └── services/
│           └── api.js             # Axios API client
```

### 4.4 Backend Structure

```
app_build/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── config/
│   │   ├── settings.py            # Env vars, configuration
│   │   └── firebase_admin.py      # Firebase Admin SDK init
│   ├── auth/
│   │   ├── dependencies.py        # JWT verification dependency
│   │   └── routes.py              # Auth-related endpoints
│   ├── datasets/
│   │   ├── routes.py              # Upload, parse, preview
│   │   ├── parser.py              # CSV/Excel parsing logic
│   │   ├── sensitive_detector.py  # Auto-detect sensitive columns
│   │   └── demo_data.py           # Load demo datasets
│   ├── bias/
│   │   ├── routes.py              # Bias analysis endpoints
│   │   ├── engine.py              # Core bias computation (Fairlearn)
│   │   ├── metrics.py             # Individual metric calculators
│   │   └── model_trainer.py       # Train lightweight classifier
│   ├── gemini/
│   │   ├── routes.py              # Gemini explanation endpoints
│   │   ├── client.py              # Gemini API client wrapper
│   │   └── prompts.py             # Prompt templates
│   ├── explainability/
│   │   ├── routes.py              # SHAP endpoints
│   │   └── shap_analyzer.py       # SHAP computation
│   ├── simulation/
│   │   ├── routes.py              # Simulation endpoints
│   │   └── simulator.py           # Threshold simulation logic
│   ├── reports/
│   │   ├── routes.py              # Report generation endpoints
│   │   └── pdf_generator.py       # ReportLab PDF creation
│   ├── demo/
│   │   ├── datasets/
│   │   │   ├── hiring.csv
│   │   │   ├── loan.csv
│   │   │   └── college_admission.csv
│   │   └── models/
│   │       └── biased_model.pkl   # Pre-trained biased model
│   └── utils/
│       └── helpers.py             # Shared utilities
```

---

## 5. API Design

### 5.1 Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/guest` | None | Create guest session, return session token |
| POST | `/api/auth/verify` | Firebase JWT | Verify Firebase token, create user record |

### 5.2 Datasets
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/datasets/upload` | Guest/User | Upload CSV/Excel, return dataset_id |
| GET | `/api/datasets/{id}/preview` | Guest/User | Return first 10 rows + schema |
| GET | `/api/datasets/{id}/sensitive` | Guest/User | Auto-detected sensitive columns |
| GET | `/api/datasets/demo/{name}` | Guest/User | Load demo dataset (hiring/loan/college) |

### 5.3 Bias Analysis
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bias/analyze` | Guest/User | Run full bias analysis, return metrics |
| POST | `/api/bias/train-model` | Guest/User | Train classifier on dataset |

### 5.4 Gemini / AI
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/gemini/explain` | Guest/User | Get plain-English bias explanation |
| POST | `/api/gemini/mitigate` | Guest/User | Get mitigation recommendations |
| POST | `/api/gemini/executive-summary` | Guest/User | Get executive summary |

### 5.5 Explainability
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/explain/shap` | Guest/User | Compute SHAP values |

### 5.6 Simulation
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/simulate/threshold` | Guest/User | Run threshold simulation |

### 5.7 Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reports/generate` | Guest/User | Generate and return PDF report |

### 5.8 User Audits
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/audits` | User | List saved audits |
| POST | `/api/audits` | User | Save an audit |
| DELETE | `/api/audits/{id}` | User | Delete an audit |

---

## 6. State Management & Data Flow

### 6.1 Frontend State

```
React Context API + useReducer

AuthContext:
  ├── user (null | { uid, email, displayName, isGuest })
  ├── token (string | null)
  ├── loading (boolean)
  └── actions: login(), guestLogin(), logout()

AuditContext (via props/state in Dashboard):
  ├── dataset (null | { id, name, preview, columns, sensitiveAttrs })
  ├── targetColumn (string)
  ├── biasResults (null | { metrics, groupBreakdown })
  ├── geminiExplanation (null | string)
  ├── mitigationAdvice (null | string[])
  ├── shapValues (null | { features, importances })
  ├── simulationResults (null | { before, after })
  └── reportUrl (null | string)
```

### 6.2 Data Flow

```
1. User lands on LandingPage → clicks "Continue as Guest" or "Sign In"
2. AuthContext updates with user/guest session
3. Dashboard loads → User selects demo dataset or uploads their own
4. Frontend sends dataset to backend → receives preview + sensitive attrs
5. User confirms sensitive attrs + target column → triggers bias analysis
6. Backend trains model (if needed) → computes Fairlearn metrics → returns JSON
7. Frontend displays metrics in MetricsGrid + BiasGauge
8. User clicks "Explain with AI" → backend sends to Gemini → returns explanation
9. User navigates to Explainability tab → SHAP values computed on demand
10. User navigates to Simulation Lab → adjusts thresholds → real-time metric updates
11. User clicks "Generate Report" → backend creates PDF → download link returned
```

---

## 7. UI/UX Design Specifications

### 7.1 Design System
- **Theme**: Dark enterprise dashboard with glassmorphism accents
- **Primary Color**: `#6366F1` (Indigo-500) — trust, intelligence
- **Accent Color**: `#10B981` (Emerald-500) — fairness, balance
- **Danger Color**: `#EF4444` (Red-500) — bias alerts
- **Warning Color**: `#F59E0B` (Amber-500) — medium risk
- **Background**: `#0F172A` (Slate-900) → `#1E293B` (Slate-800) gradient
- **Surface**: `rgba(255, 255, 255, 0.05)` with `backdrop-blur`
- **Font**: Inter (Google Fonts)
- **Border Radius**: `12px` for cards, `8px` for buttons
- **Shadows**: Soft glow effects with primary color

### 7.2 Page Layouts

#### Landing Page
- Full-screen hero with animated gradient background
- Headline: "Audit AI Decisions for Fairness"
- Two CTAs: "Continue as Guest" (primary) + "Sign In" (secondary)
- Feature showcase section with animated icons
- Social proof / stats section
- Footer

#### Dashboard
- Left sidebar navigation (collapsible)
- Top navbar with user avatar + logout
- Main content area with tab-based navigation:
  - **Overview** — Quick stats, recent audits
  - **Upload** — File dropzone + data preview
  - **Audit Results** — Metrics grid + Gemini explanation
  - **Explainability** — SHAP charts
  - **Simulation Lab** — Threshold sliders + comparison
  - **Reports** — PDF generation

### 7.3 Animations
- Page transitions: Framer Motion `AnimatePresence`
- Card hover: Scale(1.02) + glow effect
- Metric counters: Animated count-up
- Charts: Staggered entry animations
- Loading states: Skeleton loaders with shimmer effect

---

## 8. Gemini API Integration Details

### 8.1 SDK
```python
# Using google-generativeai Python SDK
import google.generativeai as genai
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')
```

### 8.2 Prompt Templates

**Bias Explanation Prompt:**
```
You are a fairness expert. Analyze the following AI bias audit results and explain the findings in plain English for a non-technical audience.

Dataset: {dataset_name}
Target Variable: {target_column}
Sensitive Attributes: {sensitive_attrs}

Metrics:
{metrics_json}

Group Breakdown:
{group_breakdown_json}

Please provide:
1. A clear summary of what bias was detected
2. Which groups are disadvantaged and how
3. The severity of the bias (low/medium/high/critical)
4. Why this matters in real-world terms
```

**Mitigation Prompt:**
```
Based on the following bias audit results, recommend specific actionable strategies to improve fairness:

{audit_context}

Provide recommendations categorized as:
1. Data-level changes (resampling, augmentation)
2. Model-level changes (algorithm selection, regularization)
3. Post-processing changes (threshold tuning, calibration)
4. Organizational recommendations (process changes, governance)
```

**Executive Summary Prompt:**
```
Generate a concise executive summary of the following AI fairness audit suitable for C-level stakeholders and compliance teams:

{full_audit_data}

Include: Key findings, risk level, compliance implications, and recommended next steps.
Format: Professional tone, bullet points where appropriate, max 300 words.
```

---

## 9. Demo Data Specifications

### 9.1 hiring.csv (1000 rows)
| Column | Type | Notes |
|--------|------|-------|
| candidate_id | int | Unique ID |
| gender | str | Male/Female/Non-binary |
| race | str | White/Black/Asian/Hispanic |
| age | int | 22-65 |
| education | str | High School/Bachelor/Master/PhD |
| experience_years | int | 0-30 |
| skill_score | float | 0-100 |
| interview_score | float | 0-100 |
| hired | int | 0/1 — **biased toward Male + White** |

### 9.2 loan.csv (1000 rows)
| Column | Type | Notes |
|--------|------|-------|
| applicant_id | int | Unique ID |
| gender | str | Male/Female |
| race | str | White/Black/Asian/Hispanic |
| age | int | 21-70 |
| income | float | 20000-200000 |
| credit_score | int | 300-850 |
| loan_amount | float | 5000-500000 |
| employment_years | int | 0-40 |
| approved | int | 0/1 — **biased against Black + Low income** |

### 9.3 college_admission.csv (1000 rows)
| Column | Type | Notes |
|--------|------|-------|
| student_id | int | Unique ID |
| gender | str | Male/Female |
| caste | str | General/OBC/SC/ST |
| region | str | Urban/Rural |
| family_income | float | 50000-2000000 |
| entrance_score | float | 0-100 |
| gpa | float | 0-10 |
| extracurricular | int | 0-5 |
| admitted | int | 0/1 — **biased against SC/ST + Rural** |

---

## 10. Deployment Configuration

### 10.1 Backend — Google Cloud Run
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 10.2 Frontend — Firebase Hosting
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

### 10.3 Environment Variables
```
# Backend (.env)
GEMINI_API_KEY=your-gemini-api-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
CORS_ORIGINS=http://localhost:5173,https://your-domain.web.app
```

---

## 11. Verification Plan

### 11.1 Automated
- Backend: `pytest` for API endpoint tests
- Frontend: Vite build success check
- Lint: `ruff` (Python), `eslint` (JS)

### 11.2 Manual
- Guest login flow: Landing → Guest → Dashboard → Demo dataset → Audit → Explain → Report
- Auth flow: Sign up → Login → Upload → Audit → Save → Logout → Login → View saved audit
- PDF download verification
- Responsive design check (mobile/tablet/desktop)
- Gemini API response quality verification

---

## 12. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Gemini API rate limits | Cache responses, implement retry with exponential backoff |
| Large dataset processing time | Show progress indicators, limit to 100K rows |
| Guest abuse | Rate limit guest sessions, no data persistence |
| Firebase cold start | Use Firestore emulator for local dev |
| SHAP computation time | Use sampling for large datasets (max 1000 rows for SHAP) |

---

*End of Technical Specification*
