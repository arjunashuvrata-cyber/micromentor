"""
MicroMentor API (FastAPI).

Architecture:  React (Vite)  ->  this Python API (/api/*)  ->  Supabase (Postgres)

The React app never talks to Supabase directly. All database access happens
here, using credentials read from environment variables (.env locally,
Vercel Environment Variables in production). Nothing secret ships to the browser.
"""

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

try:  # Load .env when running locally; on Vercel the env vars are injected.
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # pragma: no cover
    pass

app = FastAPI(title="MicroMentor API")

# ---------------------------------------------------------------------------
# Supabase client (created lazily so a missing env var gives a clear error)
# ---------------------------------------------------------------------------
_client = None


def get_db():
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise HTTPException(
                500,
                "Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
            )
        from supabase import create_client

        _client = create_client(url, key)
    return _client


def jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise HTTPException(500, "Server is missing the JWT_SECRET environment variable.")
    return secret


# ---------------------------------------------------------------------------
# Password hashing (PBKDF2-SHA256, Python standard library) and session tokens
# ---------------------------------------------------------------------------
PBKDF2_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PBKDF2_ITERATIONS).hex()
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iterations, salt, digest = stored.split("$")
    except ValueError:
        return False
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(iterations)).hex()
    return hmac.compare_digest(check, digest)


def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, jwt_secret(), algorithm="HS256")


def current_user(authorization: str = Header(default="")) -> dict:
    """Dependency: reads 'Authorization: Bearer <token>' and returns the user."""
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Please log in first.")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Your session has expired. Please log in again.")
    return {"id": payload["sub"], "email": payload["email"]}


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------
class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=6, max_length=128)


class ProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    learning_goal: str = Field(min_length=1, max_length=500)
    experience_level: Literal["Beginner", "Intermediate", "Advanced"]


class BookingIn(BaseModel):
    mentor_id: str
    slot: str


def clean_email(email: str) -> str:
    email = email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(422, "Please enter a valid email address.")
    return email


def is_unique_violation(err: Exception) -> bool:
    return getattr(err, "code", None) == "23505" or "23505" in str(err) or "duplicate key" in str(err)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/signup", status_code=201)
def signup(body: Credentials):
    db = get_db()
    email = clean_email(body.email)
    existing = db.table("app_users").select("id").eq("email", email).execute().data
    if existing:
        raise HTTPException(409, "An account with this email already exists. Please log in.")
    try:
        row = (
            db.table("app_users")
            .insert({"email": email, "password_hash": hash_password(body.password)})
            .execute()
            .data[0]
        )
    except Exception as err:
        if is_unique_violation(err):
            raise HTTPException(409, "An account with this email already exists. Please log in.")
        raise
    return {"token": create_token(row["id"], email), "user": {"id": row["id"], "email": email}}


@app.post("/api/auth/login")
def login(body: Credentials):
    db = get_db()
    email = clean_email(body.email)
    rows = db.table("app_users").select("id, email, password_hash").eq("email", email).execute().data
    if not rows or not verify_password(body.password, rows[0]["password_hash"]):
        raise HTTPException(401, "Incorrect email or password.")
    user = rows[0]
    return {"token": create_token(user["id"], email), "user": {"id": user["id"], "email": email}}


@app.get("/api/profile")
def get_profile(user: dict = Depends(current_user)):
    rows = get_db().table("profiles").select("*").eq("user_id", user["id"]).execute().data
    return {"profile": rows[0] if rows else None}


@app.put("/api/profile")
def save_profile(body: ProfileIn, user: dict = Depends(current_user)):
    row = {
        "user_id": user["id"],
        "name": body.name.strip(),
        "learning_goal": body.learning_goal.strip(),
        "experience_level": body.experience_level,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    saved = get_db().table("profiles").upsert(row, on_conflict="user_id").execute().data
    return {"profile": saved[0] if saved else row}


def _mentors_with_availability(db, mentor_id: str | None = None):
    query = db.table("mentors").select("*")
    if mentor_id:
        query = query.eq("id", mentor_id)
    mentors = query.order("name").execute().data
    booked_query = db.table("bookings").select("mentor_id, slot")
    if mentor_id:
        booked_query = booked_query.eq("mentor_id", mentor_id)
    booked = {(b["mentor_id"], b["slot"]) for b in booked_query.execute().data}
    for m in mentors:
        m["slots"] = [{"time": s, "available": (m["id"], s) not in booked} for s in (m.get("slots") or [])]
    return mentors


@app.get("/api/mentors")
def list_mentors(user: dict = Depends(current_user)):
    return {"mentors": _mentors_with_availability(get_db())}


@app.get("/api/mentors/{mentor_id}")
def get_mentor(mentor_id: str, user: dict = Depends(current_user)):
    mentors = _mentors_with_availability(get_db(), mentor_id)
    if not mentors:
        raise HTTPException(404, "Mentor not found.")
    return {"mentor": mentors[0]}


@app.get("/api/bookings")
def my_bookings(user: dict = Depends(current_user)):
    db = get_db()
    bookings = (
        db.table("bookings").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute().data
    )
    mentors = {m["id"]: m for m in db.table("mentors").select("id, name, title").execute().data}
    for b in bookings:
        m = mentors.get(b["mentor_id"], {})
        b["mentor_name"] = m.get("name", "Unknown mentor")
        b["mentor_title"] = m.get("title", "")
    return {"bookings": bookings}


@app.post("/api/bookings", status_code=201)
def create_booking(body: BookingIn, user: dict = Depends(current_user)):
    db = get_db()
    mentors = db.table("mentors").select("id, name, slots").eq("id", body.mentor_id).execute().data
    if not mentors:
        raise HTTPException(404, "Mentor not found.")
    mentor = mentors[0]
    if body.slot not in (mentor.get("slots") or []):
        raise HTTPException(422, "That time slot is not offered by this mentor.")
    taken_msg = "Sorry, that slot was just booked by someone else. Please pick another time."
    taken = db.table("bookings").select("id").eq("mentor_id", body.mentor_id).eq("slot", body.slot).execute().data
    if taken:
        raise HTTPException(409, taken_msg)
    try:
        row = (
            db.table("bookings")
            .insert({"user_id": user["id"], "mentor_id": body.mentor_id, "slot": body.slot, "status": "confirmed"})
            .execute()
            .data[0]
        )
    except Exception as err:
        # The database's unique(mentor_id, slot) constraint is the final guard
        # against two people booking the same slot at the same moment.
        if is_unique_violation(err):
            raise HTTPException(409, taken_msg)
        raise
    row["mentor_name"] = mentor["name"]
    return {"booking": row}


@app.delete("/api/bookings/{booking_id}")
def cancel_booking(booking_id: str, user: dict = Depends(current_user)):
    deleted = (
        get_db().table("bookings").delete().eq("id", booking_id).eq("user_id", user["id"]).execute().data
    )
    if not deleted:
        raise HTTPException(404, "Booking not found.")
    return {"ok": True}
