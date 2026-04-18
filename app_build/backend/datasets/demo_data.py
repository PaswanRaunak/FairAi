"""
FairLens AI — Demo Data Generator
Generates synthetic biased datasets for the guest demo experience.
"""

import pandas as pd
import numpy as np
import os

DEMO_DIR = os.path.join(os.path.dirname(__file__), "..", "demo", "datasets")


def _ensure_demo_dir():
    os.makedirs(DEMO_DIR, exist_ok=True)


def generate_hiring_dataset(n: int = 1000, seed: int = 42) -> pd.DataFrame:
    """Generate a synthetic hiring dataset with gender and race bias."""
    rng = np.random.RandomState(seed)

    gender = rng.choice(["Male", "Female", "Non-binary"], n, p=[0.45, 0.45, 0.10])
    race = rng.choice(["White", "Black", "Asian", "Hispanic"], n, p=[0.40, 0.25, 0.20, 0.15])
    age = rng.randint(22, 66, n)
    education = rng.choice(["High School", "Bachelor", "Master", "PhD"], n, p=[0.20, 0.40, 0.30, 0.10])
    experience = rng.randint(0, 31, n)
    skill_score = rng.uniform(30, 100, n).round(1)
    interview_score = rng.uniform(20, 100, n).round(1)

    # Introduce bias: higher hire rate for Male + White
    base_prob = 0.3
    hire_prob = np.full(n, base_prob)

    hire_prob[gender == "Male"] += 0.15
    hire_prob[gender == "Female"] -= 0.05
    hire_prob[race == "White"] += 0.12
    hire_prob[race == "Black"] -= 0.10
    hire_prob[race == "Hispanic"] -= 0.05

    # Merit factors
    hire_prob += (skill_score - 50) / 200
    hire_prob += (interview_score - 50) / 200
    hire_prob += experience / 100

    hire_prob = np.clip(hire_prob, 0.05, 0.95)
    hired = (rng.random(n) < hire_prob).astype(int)

    df = pd.DataFrame({
        "candidate_id": range(1, n + 1),
        "gender": gender,
        "race": race,
        "age": age,
        "education": education,
        "experience_years": experience,
        "skill_score": skill_score,
        "interview_score": interview_score,
        "hired": hired,
    })
    return df


def generate_loan_dataset(n: int = 1000, seed: int = 43) -> pd.DataFrame:
    """Generate a synthetic loan approval dataset with income and race bias."""
    rng = np.random.RandomState(seed)

    gender = rng.choice(["Male", "Female"], n, p=[0.55, 0.45])
    race = rng.choice(["White", "Black", "Asian", "Hispanic"], n, p=[0.40, 0.25, 0.20, 0.15])
    age = rng.randint(21, 71, n)
    income = rng.uniform(20000, 200000, n).round(0)
    credit_score = rng.randint(300, 851, n)
    loan_amount = rng.uniform(5000, 500000, n).round(0)
    employment_years = rng.randint(0, 41, n)

    # Bias: against Black applicants and low-income
    base_prob = 0.4
    approve_prob = np.full(n, base_prob)

    approve_prob[race == "White"] += 0.15
    approve_prob[race == "Black"] -= 0.18
    approve_prob[race == "Hispanic"] -= 0.08

    approve_prob += (income - 100000) / 500000
    approve_prob += (credit_score - 600) / 1000
    approve_prob -= loan_amount / 2000000

    approve_prob = np.clip(approve_prob, 0.05, 0.95)
    approved = (rng.random(n) < approve_prob).astype(int)

    df = pd.DataFrame({
        "applicant_id": range(1, n + 1),
        "gender": gender,
        "race": race,
        "age": age,
        "income": income,
        "credit_score": credit_score,
        "loan_amount": loan_amount,
        "employment_years": employment_years,
        "approved": approved,
    })
    return df


def generate_college_admission_dataset(n: int = 1000, seed: int = 44) -> pd.DataFrame:
    """Generate a synthetic college admission dataset with caste and region bias."""
    rng = np.random.RandomState(seed)

    gender = rng.choice(["Male", "Female"], n, p=[0.52, 0.48])
    caste = rng.choice(["General", "OBC", "SC", "ST"], n, p=[0.35, 0.30, 0.20, 0.15])
    region = rng.choice(["Urban", "Rural"], n, p=[0.55, 0.45])
    family_income = rng.uniform(50000, 2000000, n).round(0)
    entrance_score = rng.uniform(20, 100, n).round(1)
    gpa = rng.uniform(3, 10, n).round(1)
    extracurricular = rng.randint(0, 6, n)

    # Bias: against SC/ST and Rural students
    base_prob = 0.35
    admit_prob = np.full(n, base_prob)

    admit_prob[caste == "General"] += 0.15
    admit_prob[caste == "SC"] -= 0.12
    admit_prob[caste == "ST"] -= 0.15
    admit_prob[region == "Rural"] -= 0.10
    admit_prob[region == "Urban"] += 0.05

    admit_prob += (entrance_score - 50) / 150
    admit_prob += (gpa - 6) / 20
    admit_prob += extracurricular / 30

    admit_prob = np.clip(admit_prob, 0.05, 0.95)
    admitted = (rng.random(n) < admit_prob).astype(int)

    df = pd.DataFrame({
        "student_id": range(1, n + 1),
        "gender": gender,
        "caste": caste,
        "region": region,
        "family_income": family_income,
        "entrance_score": entrance_score,
        "gpa": gpa,
        "extracurricular": extracurricular,
        "admitted": admitted,
    })
    return df


def save_demo_datasets():
    """Generate and save all demo datasets to disk."""
    _ensure_demo_dir()

    hiring = generate_hiring_dataset()
    hiring.to_csv(os.path.join(DEMO_DIR, "hiring.csv"), index=False)

    loan = generate_loan_dataset()
    loan.to_csv(os.path.join(DEMO_DIR, "loan.csv"), index=False)

    college = generate_college_admission_dataset()
    college.to_csv(os.path.join(DEMO_DIR, "college_admission.csv"), index=False)

    return {"hiring": len(hiring), "loan": len(loan), "college_admission": len(college)}


def load_demo_dataset(name: str) -> pd.DataFrame:
    """Load a demo dataset by name."""
    generators = {
        "hiring": generate_hiring_dataset,
        "loan": generate_loan_dataset,
        "college_admission": generate_college_admission_dataset,
    }

    if name not in generators:
        raise ValueError(f"Unknown demo dataset: {name}. Available: {list(generators.keys())}")

    # Try loading from file first
    file_path = os.path.join(DEMO_DIR, f"{name}.csv")
    if os.path.exists(file_path):
        return pd.read_csv(file_path)

    # Otherwise generate on the fly
    return generators[name]()


DEMO_DATASET_INFO = {
    "hiring": {
        "name": "Hiring Decisions",
        "description": "Synthetic hiring dataset with 1000 candidates. Contains gender and racial bias in hiring outcomes.",
        "rows": 1000,
        "sensitiveAttributes": ["gender", "race"],
        "targetColumn": "hired",
        "icon": "briefcase",
    },
    "loan": {
        "name": "Loan Approvals",
        "description": "Synthetic loan approval dataset with 1000 applicants. Contains racial and income-based bias.",
        "rows": 1000,
        "sensitiveAttributes": ["gender", "race"],
        "targetColumn": "approved",
        "icon": "banknotes",
    },
    "college_admission": {
        "name": "College Admissions",
        "description": "Synthetic college admission dataset with 1000 students. Contains caste and regional bias.",
        "rows": 1000,
        "sensitiveAttributes": ["caste", "region", "gender"],
        "targetColumn": "admitted",
        "icon": "academic-cap",
    },
}
