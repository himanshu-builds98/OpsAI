from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.MONGODB_DB_NAME]

users_collection = db["users"]
otp_collection = db["otp_transactions"]
sessions_collection = db["chat_sessions"]
messages_collection = db["chat_messages"]
workspaces_collection = db["workspaces"]
documents_collection = db["documents"]

async def init_db():
    await users_collection.create_index("email", unique=True)
    await otp_collection.create_index("expires_at", expireAfterSeconds=0)
    await sessions_collection.create_index("user_id")
    await messages_collection.create_index("session_id")