# 🧠 FairLens AI — Unbiased AI Decision System

## 🚀 Overview

FairLens AI is an AI-powered platform designed to **detect, explain, and mitigate bias in machine learning models**.

It helps ensure fairness in automated decision-making systems such as:

* Hiring systems
* Loan approvals
* College admissions
* Risk assessment

FairLens acts as an **AI Governance Copilot** for building transparent and ethical AI.

---

## ⚡ Features

### 🔍 Bias Detection

* Demographic Parity Difference
* Equal Opportunity Difference
* Disparate Impact Ratio
* Statistical Parity Difference

### 🧠 AI-Powered Analysis

* Plain-English explanation of bias
* Identifies affected groups
* Explains root causes
* Provides actionable recommendations

### 🛠 Bias Mitigation

* Data-level improvements
* Model-level optimization
* Post-processing techniques

### 📊 Dashboard

* Interactive charts
* Group-wise comparisons
* Bias severity indicators

### ⚡ Guest Demo Mode

* No login required
* Preloaded datasets
* Instant testing

---

## 🏗 Tech Stack

* **Frontend:** React + Tailwind CSS
* **Backend:** FastAPI (Python)
* **ML / Fairness:** Scikit-learn, Fairlearn
* **Explainability:** SHAP
* **LLM:** Groq (Llama3)

---

## 🤖 AI Integration

FairLens AI uses **LLM-based analysis** to:

* Explain fairness issues
* Highlight risks
* Recommend mitigation strategies

> ⚠️ Note: The system is designed for Gemini API integration.
> For this prototype, **Groq (Llama3)** is used for fast, cost-free inference.

---

## 📦 Installation

### Clone Repository

```bash
git clone https://github.com/PaswanRaunak/FairAi.git
cd FairAi
```

---

### 🔧 Backend Setup

```bash
pip install -r requirements.txt
```

Create `.env` file:

```env
GROQ_API_KEY=your_api_key_here
```

Run server:

```bash
uvicorn main:app --reload
```

---

### 💻 Frontend Setup

```bash
npm install
npm run dev
```

---

## 🎯 How It Works

1. Upload dataset or use demo data
2. Select sensitive attributes
3. Run bias analysis
4. View fairness metrics
5. Get AI-generated explanation
6. Apply mitigation strategies

---

## 🏆 Why This Matters

AI systems can unintentionally introduce bias.

FairLens AI helps:

* Ensure fairness in decisions
* Increase trust in AI
* Build ethical AI systems

---

## 📌 Future Scope

* Real-time monitoring
* Bias alert system
* Compliance reporting
* Multi-model support (Gemini, OpenAI, etc.)

---

## 👨‍💻 Author

**Raunak Paswan**

---

## 🚧 Status

Hackathon Prototype — Actively Improving 🚀
