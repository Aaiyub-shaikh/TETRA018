from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger("app.database.mongodb")

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_helper = MongoDB()

def init_mongodb():
    """Initialize a single shared MongoDB client instance."""
    if db_helper.client is None:
        try:
            logger.info(f"Connecting to MongoDB Atlas at URI: {settings.MONGODB_URI[:35]}...")
            db_helper.client = AsyncIOMotorClient(settings.MONGODB_URI)
            db_helper.db = db_helper.client[settings.DATABASE_NAME]
            logger.info("Successfully established connection to MongoDB Atlas database.")
        except Exception as e:
            logger.critical(f"Failed to connect to MongoDB Atlas: {e}")
            raise e

def get_database():
    """Retrieve the database reference context."""
    return db_helper.db

def close_mongodb():
    """Closes client connection properly on shutdown."""
    if db_helper.client is not None:
        db_helper.client.close()
        db_helper.client = None
        db_helper.db = None
        logger.info("MongoDB Atlas connection successfully closed.")
