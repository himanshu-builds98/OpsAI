from pprint import pprint

from app.db.mongodb import MongoDB
from app.services.knowledge_service import KnowledgeService


MongoDB.connect()

service = KnowledgeService()

queries = [
    "Project Charter",
    "PC",
    "authority",
    "Bill of Lading",
    "BOL"
]

for query in queries:

    print("=" * 80)
    print(f"QUERY : {query}")
    print("=" * 80)

    docs = service.search(query)

    print(f"Results : {len(docs)}")

    for doc in docs:

        pprint({
            "term": doc["term"],
            "score": doc["score"]
        })

    print()

MongoDB.close()