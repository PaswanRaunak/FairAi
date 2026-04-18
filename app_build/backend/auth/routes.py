"""
FairLens AI — Auth Routes
"""

from fastapi import APIRouter
from auth.dependencies import create_guest_session

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/guest")
async def guest_login():
    """Create a guest session for demo access."""
    token, user = create_guest_session()
    return {
        "token": token,
        "user": user.to_dict(),
        "message": "Guest session created. You can explore demo datasets and run audits.",
    }


@router.post("/verify")
async def verify_token():
    """
    Verify a Firebase ID token.
    In production, the frontend sends the Firebase ID token and we verify it.
    For the demo, this endpoint just acknowledges the request.
    """
    return {
        "verified": True,
        "message": "Token verification endpoint. Use Firebase Auth on the client side.",
    }
