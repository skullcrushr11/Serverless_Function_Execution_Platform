import pymysql
from database import engine
from models import Base

def init_db():
    # First, create the database if it doesn't exist
    print("Creating database if it doesn't exist...")
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='saitarun11',
        port=3306
    )
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("CREATE DATABASE IF NOT EXISTS serverless_platform")
            print("Database created successfully!")
    finally:
        connection.close()
    
    # Now create the tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db() 