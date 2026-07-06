import logging

from app.config import settings
from app.db.mongodb import MongoDB
from app.services.mongo_indexer import MongoIndexer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")


def main():

    logger.info("=" * 60)
    logger.info("OpsAI Trade Knowledge Indexer")
    logger.info("=" * 60)

    MongoDB.connect()

    count = MongoIndexer.import_csv(
        settings.TRADE_KNOWLEDGE_CSV
    )

    logger.info("=" * 60)
    logger.info(f"Successfully indexed {count} trade records.")
    logger.info("=" * 60)

    MongoDB.close()


if __name__ == "__main__":
    main()