from pprint import pprint
from app.db.mongodb import MongoDB

MongoDB.connect()

collection = MongoDB.trade_collection()

print(f"Total Documents : {collection.count_documents({})}")

doc = collection.find_one()

print("\nSample Document:\n")
pprint(doc)

MongoDB.close()