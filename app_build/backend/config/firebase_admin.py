"""
FairLens AI — Firebase Admin SDK Initialization
"""

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from config.settings import settings


_firebase_app = None


def init_firebase():
    """Initialize Firebase Admin SDK."""
    global _firebase_app
    if _firebase_app:
        return _firebase_app

    try:
        if settings.FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            _firebase_app = firebase_admin.initialize_app(cred)
        elif settings.FIREBASE_PROJECT_ID:
            # Use Application Default Credentials
            _firebase_app = firebase_admin.initialize_app(
                options={"projectId": settings.FIREBASE_PROJECT_ID}
            )
        else:
            # No Firebase config — run in demo-only mode
            print("[WARN] No Firebase credentials configured. Running in demo-only mode.")
            return None
    except Exception as e:
        print(f"[WARN] Firebase init failed: {e}. Running in demo-only mode.")
        return None

    return _firebase_app


def verify_firebase_token(id_token: str) -> dict | None:
    """Verify a Firebase ID token and return the decoded claims."""
    if not _firebase_app:
        return None
    try:
        decoded = firebase_auth.verify_id_token(id_token)
        return decoded
    except Exception:
        return None
