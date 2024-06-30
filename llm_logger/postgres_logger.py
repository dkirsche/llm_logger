import asyncio
import psycopg2
import os
import datetime
import logging

class PostgresLogger:
    def __init__(self, dsn=None):
        # Database connection string
        self.dsn = dsn or os.getenv("POSTGRES_URL")
        self.connection = None
        self.cursor = None
        logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)

    def connect(self):
        # Establish a connection to the database
        self.connection = psycopg2.connect(self.dsn)
        self.cursor = self.connection.cursor()

    def close(self):
        # Close the database connection
        if self.connection:
            self.connection.close()

    def create_chat_completions_table(self):
        query = """
            CREATE TABLE IF NOT EXISTS chat_completions(
            id SERIAL PRIMARY KEY,
            invocation_id TEXT,
            client_id INTEGER,
            wrapper_id INTEGER,
            session_id TEXT,
            request TEXT,
            response TEXT,
            model_id TEXT,
            is_cached INTEGER,
            cost REAL,
            start_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            total_time INTERVAL GENERATED ALWAYS AS (end_time - start_time) STORED
        )
        """
        self.run_query(query)
    
    def insert_chat_completion(self, invocation_id=None, client_id=None, wrapper_id=None, session_id=None, request=None, response=None, model_id=None, is_cached=None, cost=None, start_time=None, end_time=None):
        query = """
            INSERT INTO chat_completions(
                invocation_id, 
                client_id, 
                wrapper_id, 
                session_id, 
                request, 
                response, 
                model_id,
                is_cached, 
                cost,
                start_time, 
                end_time
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        try:
            self.run_query(query, (invocation_id, client_id, wrapper_id, session_id, request, response, model_id, is_cached, cost, start_time or datetime.datetime.now(datetime.timezone.utc), end_time or datetime.datetime.now(datetime.timezone.utc)))
        except Exception as e:
            self.logger.warning(f"Failed to insert chat completion: {e}")
            print(f"WARNING - Failed to insert chat completion in llm_logger library: {e}")

    def run_query(self, query, params=None):
        if not self.connection:
            self.connect()
        self.cursor.execute(query, params)
        if query.strip().upper().startswith("SELECT"):
            return self.cursor.fetchall()
        else:
            self.connection.commit()
 

# Example usage
def main():
    logger = PostgresLogger()
    logger.create_chat_completions_table()
    # Remember to handle start_time and end_time appropriately as per your application logic
    logger.insert_chat_completion(invocation_id="test", client_id=1)
    logger.close()

if __name__ == "__main__":
    main()
