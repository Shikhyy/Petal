from fastapi import Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import jwt
from datetime import datetime

from ..config import settings


def setup_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_allowed_origins(),
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def decode_jwt(token: str) -> dict:
    # Try Supabase JWT first if configured
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"]
            )
            return payload
        except jwt.InvalidTokenError:
            pass

    # Fall back to dev JWT_SECRET
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


DEV_USER_ID = "00000000-0000-0000-0000-000000000001"


def create_dev_user() -> dict:
    """Create a dev user for local development without auth."""
    return {"user_id": DEV_USER_ID, "email": "dev@local"}


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = auth_header.split(" ", 1)[1]
    payload = decode_jwt(token)

    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: no user_id")

    return {"user_id": str(user_id), "email": payload.get("email", "")}


async def get_optional_user(request: Request) -> dict | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        token = auth_header.split(" ", 1)[1]
        payload = decode_jwt(token)
        user_id = payload.get("sub") or payload.get("user_id")
        if user_id:
            return {"user_id": str(user_id), "email": payload.get("email", "")}
    except HTTPException:
        pass
    return None


async def get_user_or_dev(request: Request) -> dict:
    """Get user from auth or create dev user for local development."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return create_dev_user()

    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_jwt(token)
        user_id = payload.get("sub") or payload.get("user_id")
        if user_id:
            return {"user_id": str(user_id), "email": payload.get("email", "")}
    except HTTPException:
        pass

    return create_dev_user()
