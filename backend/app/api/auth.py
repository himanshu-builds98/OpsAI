import random
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Response, Request, Depends
from pydantic import BaseModel, EmailStr
import httpx
from app.db.base import users_collection, otp_collection
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.config import settings

router = APIRouter()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_token: str

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_token: str

@router.post("/register", status_code=201)
async def register(req: RegisterRequest):
    existing = await users_collection.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = {
        "email": req.email,
        "password_hash": get_password_hash(req.password),
        "is_active": True,
        "role": "user",
        "created_at": datetime.utcnow()
    }
    result = await users_collection.insert_one(user)

    otp_code = str(random.randint(100000, 999999))
    print(f"[DEV OTP] {req.email} → {otp_code}")

    await otp_collection.insert_one({
        "user_id": str(result.inserted_id),
        "otp_hash": get_password_hash(otp_code),
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "is_used": False,
        "created_at": datetime.utcnow()
    })

    return {"message": "Registered.", "dev_otp": otp_code}


@router.post("/verify-otp")
async def verify_otp(req: VerifyOtpRequest, response: Response):
    user = await users_collection.find_one({"email": req.email})
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    otp_record = await otp_collection.find_one({
        "user_id": str(user["_id"]),
        "is_used": False,
        "expires_at": {"$gt": datetime.utcnow()}
    }, sort=[("created_at", -1)])

    if not otp_record or not verify_password(req.otp, otp_record["otp_hash"]):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    await otp_collection.update_one({"_id": otp_record["_id"]}, {"$set": {"is_used": True}})

    token = create_access_token(subject=req.email)
    response.set_cookie("access_token", token, httponly=True, max_age=3600, samesite="lax")
    return {"message": "Verified", "user": {"email": user["email"], "role": user.get("role", "user")}}


@router.post("/login")
async def login(req: LoginRequest, response: Response):
    user = await users_collection.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Inactive user")

    await users_collection.update_one({"_id": user["_id"]}, {"$set": {"last_login": datetime.utcnow()}})

    token = create_access_token(subject=req.email)
    response.set_cookie("access_token", token, httponly=True, max_age=3600, samesite="lax")
    return {"message": "Login successful", "user": {"email": user["email"], "role": user.get("role", "user")}}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {"email": current_user["email"], "role": current_user.get("role", "user"), "is_active": current_user.get("is_active", True)}