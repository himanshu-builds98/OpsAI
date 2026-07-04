import logging
from typing import List, Dict, Any

from pymongo import UpdateOne

from app.db.mongodb import MongoDB
from app.services.csv_loader import CSVLoaderService

logger = logging.getLogger("uvicorn.error")


class MongoIndexer:
    """
    Imports the trade knowledge CSV into MongoDB.

    Safe to run multiple times.
    Existing records are updated instead of duplicated.
    """

    @staticmethod
    def build_search_text(record: Dict[str, Any]) -> str:
        """
        Builds a searchable text blob for MongoDB full-text search.
        """

        return " ".join([
            record["Term"],
            " ".join(record.get("Aliases", [])),
            " ".join(record.get("Keywords", [])),
            record["Definition"],
            record["Purpose"],
            record["Created By"],
            record["Used By"],
            record["Common Problems"]
        ])


    @classmethod
    def import_csv(cls, csv_path: str):

        logger.info("Loading CSV...")

        records = CSVLoaderService.load_and_clean(csv_path)

        if not records:
            logger.warning("No records found.")
            return 0

        collection = MongoDB.trade_collection()

        operations = []

        for record in records:

            aliases = CSVLoaderService.generate_aliases(
                record["Term"]
            )

            keywords = CSVLoaderService.generate_keywords(
                record
            )

            search_text = cls.build_search_text({
                **record,
                "Aliases": aliases,
                "Keywords": keywords
            })

            document = {
                "term": record["Term"],
                "aliases": aliases,
                "keywords": keywords,
                "definition": record["Definition"],
                "created_by": record["Created By"],
                "used_by": record["Used By"],
                "purpose": record["Purpose"],
                "common_problems": record["Common Problems"],
                "search_text": search_text
            }

            operations.append(
                UpdateOne(
                    {
                        "term": record["Term"]
                    },
                    {
                        "$set": document
                    },
                    upsert=True
                )
            )

        if operations:
            result = collection.bulk_write(operations)
            logger.info("===================================")
            logger.info("MongoDB Import Summary")
            logger.info("===================================")
            logger.info(f"Processed : {len(records)}")
            logger.info(f"Inserted  : {result.upserted_count}")
            logger.info(f"Modified  : {result.modified_count}")
            logger.info(f"Matched   : {result.matched_count}")
            logger.info("===================================")
        return len(records)