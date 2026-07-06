from pymongo import MongoClient, TEXT
from pymongo.collection import Collection
from pymongo.database import Database
from app.config import settings
import logging

logger = logging.getLogger("uvicorn.error")


class MongoDB:

    _client: MongoClient | None = None
    _db: Database | None = None

    @classmethod
    def connect(cls):

        if cls._client is not None:
            return

        logger.info("Connecting to MongoDB Atlas...")

        cls._client = MongoClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000
        )

        cls._client.admin.command("ping")

        cls._db = cls._client[
            settings.MONGODB_DB_NAME
        ]

        logger.info(
            f"Connected to MongoDB database '{settings.MONGODB_DB_NAME}'"
        )

        cls.create_indexes()

    @classmethod
    def get_database(cls) -> Database:

        if cls._db is None:
            cls.connect()

        return cls._db

    @classmethod
    def trade_collection(cls) -> Collection:

        return cls.get_database()["trade_knowledge"]

    @classmethod
    def create_indexes(cls):

        collection = cls.trade_collection()

        logger.info("Creating MongoDB indexes...")

        collection.create_index(
            [("term", 1)],
            unique=True
        )

        collection.create_index("aliases")

        collection.create_index("keywords")

        collection.create_index(
            [
                ("search_text", TEXT)
            ],
            name="trade_search_text"
        )

        logger.info("MongoDB indexes created.")

    @classmethod
    def close(cls):

        if cls._client:

            cls._client.close()

            cls._client = None
            cls._db = None

            logger.info("MongoDB connection closed.")