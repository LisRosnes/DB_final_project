"""
Database connection and utilities for MongoDB
"""
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()

class Database:
    """MongoDB database connection handler"""
    
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self.connect()
    
    def connect(self):
        """Establish connection to MongoDB"""
        try:
            mongodb_uri = os.getenv('MONGODB_URI')
            database_name = os.getenv('DATABASE_NAME', 'college_scorecard')
            
            if not mongodb_uri:
                raise ValueError("MONGODB_URI not found in environment variables")
            
            self._client = MongoClient(mongodb_uri)
            self._db = self._client[database_name]
            
            # Test connection
            self._client.admin.command('ping')
            print(f"✓ Successfully connected to MongoDB database: {database_name}")
            
        except ConnectionFailure as e:
            print(f"✗ Failed to connect to MongoDB: {e}")
            raise
        except Exception as e:
            print(f"✗ Error connecting to database: {e}")
            raise
    
    def get_db(self):
        """Get database instance"""
        if self._db is None:
            self.connect()
        return self._db
    
    def get_collection(self, collection_name):
        """Get a specific collection"""
        return self.get_db()[collection_name]
    
    def close(self):
        """Close database connection"""
        if self._client:
            self._client.close()
            print("✓ Database connection closed")


# Global database instance
db_instance = Database()

def get_database():
    """Helper function to get database instance"""
    return db_instance.get_db()

def get_collection(name):
    """Helper function to get collection"""
    return db_instance.get_collection(name)
