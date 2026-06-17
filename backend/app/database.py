from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("MONGO_DB_NAME")]

# Collections
applicants_col   = db["applicants"]
documents_col    = db["application_documents"]
objections_col   = db["objections"]
logs_col         = db["performance_logs"]
applications_col = db["land_applications"]

# Indexes
applicants_col.create_index("identity.national_id", unique=True)
documents_col.create_index("application_id")
objections_col.create_index("application_id")
logs_col.create_index("application_id", unique=True)
