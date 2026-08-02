import logging
from app.core.config import settings

logger = logging.getLogger("app.database.mongodb")

try:
    from motor.motor_asyncio import AsyncIOMotorClient
    HAS_MOTOR = True
except ImportError:
    HAS_MOTOR = False
    from pymongo import MongoClient

class MongoDB:
    client = None
    db = None

db_helper = MongoDB()

def init_mongodb():
    """Initialize a single shared MongoDB client instance."""
    if db_helper.client is None:
        try:
            logger.info(f"Connecting to MongoDB Atlas at URI: {settings.MONGODB_URI[:35]}...")
            if HAS_MOTOR:
                db_helper.client = AsyncIOMotorClient(settings.MONGODB_URI)
            else:
                db_helper.client = MongoClient(settings.MONGODB_URI)
            db_helper.db = db_helper.client[settings.DATABASE_NAME]
            logger.info("Successfully established connection to MongoDB Atlas database.")
        except Exception as e:
            logger.critical(f"Failed to connect to MongoDB Atlas: {e}")
            raise e

def get_database():
    """Retrieve the database reference context."""
    if db_helper.db is None:
        init_mongodb()
    return db_helper.db

def close_mongodb():
    """Closes client connection properly on shutdown."""
    if db_helper.client is not None:
        db_helper.client.close()
        db_helper.client = None
        db_helper.db = None
        logger.info("MongoDB Atlas connection successfully closed.")

async def seed_users():
    """Seed the default compliance officer admin user if the users collection is empty."""
    db = get_database()
    if db is None:
        return
    try:
        existing = await db["users"].find_one({"email": "compliance@invexa.ai"})
        if not existing:
            from app.core.security import get_password_hash
            from datetime import datetime
            
            default_user = {
                "email": "compliance@invexa.ai",
                "password": get_password_hash("password123"),
                "full_name": "Compliance Officer",
                "role": "admin",
                "created_at": datetime.utcnow().isoformat()
            }
            await db["users"].insert_one(default_user)
            logger.info("Successfully seeded default compliance admin user.")
    except Exception as e:
        logger.error(f"Failed to seed default compliance user: {e}")
