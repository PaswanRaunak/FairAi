"""
FairLens AI — Auth Dependencies
FastAPI dependencies for JWT verification and guest sessions.
"""

import uuid
from fastapi import Header, HTTPException
from cachetools import TTLCache
from config.firebase_admin import verify_firebase_token


class CurrentUser:
    """Represents the authenticated or guest user."""

    def __init__(self, uid: str, email: str = "", display_name: str = "", is_guest: bool = False):
        self.uid = uid
        self.email = email
        self.display_name = display_name
        self.is_guest = is_guest

    def to_dict(self) -> dict:
        return {
            "uid": self.uid,
            "email": self.email,
            "displayName": self.display_name,
            "isGuest": self.is_guest,
        }


# Guest sessions with 1-hour TTL and max 1000 concurrent sessions
_guest_sessions: TTLCache = TTLCache(maxsize=1000, ttl=3600)


def create_guest_session() -> tuple[str, CurrentUser]:
    """Create a new guest session and return (token, user)."""
    guest_id = f"guest_{uuid.uuid4().hex[:12]}"
    token = f"guest_token_{uuid.uuid4().hex}"
    user = CurrentUser(uid=guest_id, display_name="Guest User", is_guest=True)
    _guest_sessions[token] = user
    return token, user


async def get_current_user(authorization: str = Header(default="")) -> CurrentUser:
    """
    FastAPI dependency that extracts the current user from the Authorization header.
    Supports both Firebase JWT tokens and guest session tokens.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    token = authorization.replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(status_code=401, detail="Token required")

    # Check guest sessions first
    if token.startswith("guest_token_"):
        user = _guest_sessions.get(token)
        if user:
            return user
        raise HTTPException(status_code=401, detail="Invalid or expired guest session")

    # Try Firebase token verification
    decoded = verify_firebase_token(token)
    if decoded:
        return CurrentUser(
            uid=decoded.get("uid", ""),
            email=decoded.get("email", ""),
            display_name=decoded.get("name", decoded.get("email", "User")),
            is_guest=False,
        )

    # No valid authentication — reject
    raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_optional_user(authorization: str = Header(default="")) -> CurrentUser | None:
    """Optional auth — returns None if no valid auth provided."""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None
