import asyncio
import psycopg2
from psycopg2 import OperationalError, InterfaceError, DatabaseError
import os
import datetime
import logging
import time

class PostgresLogger:
    def __init__(self, dsn=None, max_retries=3, retry_delay=2):
        # Database connection string
        self.dsn = dsn or os.getenv("POSTGRES_URL")
        self.connection = None
        self.cursor = None
        self.max_retries = max_retries  # Maximum number of retries
        self.retry_delay = retry_delay  # Delay between retries
        logging.basicConfig(level=logging.WARNING, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)

    def connect(self):
        # Establish a connection to the database
        try:
            self.connection = psycopg2.connect(self.dsn)
            self.cursor = self.connection.cursor()
            self.logger.info("Connected to the database.")
        except OperationalError as e:
            self.logger.error(f"Error connecting to the database: {e}")
            raise

    def close(self):
        # Close the database connection
        if self.connection:
            try:
                self.cursor.close()
                self.connection.close()
                self.logger.info("Database connection closed.")
            except Exception as e:
                self.logger.warning(f"Error closing connection: {e}")

    def create_chat_completions_table(self):
        query = """
            CREATE TABLE IF NOT EXISTS chat_completions(
            id SERIAL PRIMARY KEY,
            agent TEXT,
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

    def insert_chat_completion(self, agent=None,invocation_id=None, client_id=None, wrapper_id=None, session_id=None, request=None, response=None, model_id=None, is_cached=None, cost=None, start_time=None, end_time=None):
        query = """
            INSERT INTO chat_completions(
                agent,
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
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        self.run_query(query, (agent, invocation_id, client_id, wrapper_id, session_id, request, response, model_id, is_cached, cost, start_time or datetime.datetime.now(datetime.timezone.utc), end_time or datetime.datetime.now(datetime.timezone.utc)))
    

    def run_query(self, query, params=None):
        retries = 0
        while retries < self.max_retries:
            try:
                # Ensure connection is active
                if not self.connection or self.connection.closed:
                    if retries > 0:
                        self.logger.info(f"Reconnecting to the database... Attempt {retries + 1}")
                    self.connect()

                # Execute the query
                self.cursor.execute(query, params)
                if query.strip().upper().startswith("SELECT"):
                    result = self.cursor.fetchall()
                    return result
                else:
                    self.connection.commit()
                break

            except (OperationalError, InterfaceError) as e:
                # Handle lost connection and retry
                self.logger.warning(f"Database connection issue: {e}. Retrying {retries + 1}/{self.max_retries}...")
                print(f"Database connection issue: {e}. Retrying {retries + 1}/{self.max_retries}...")
                retries += 1
                time.sleep(self.retry_delay)  # Wait before retrying

            except DatabaseError as e:
                # Handle other database-related errors
                self.logger.error(f"Database error: {e}")
                self.connection.rollback()  # Roll back any changes made so far
                print(f"WARNING - Database error. Failed to insert chat completion in llm_logger library: {e}")
                retries = self.max_retries  # Stop retrying after a DatabaseError
                break

            except Exception as e:
                # Catch-all for any other exceptions
                self.logger.error(f"Unexpected error: {e}")
                print(f"WARNING - Unexpected error. Failed to insert chat completion in llm_logger library: {e}")
                retries += 1

        if retries == self.max_retries:
            self.logger.error(f"Max retries reached. Failed to execute query: {query}")



    def _reconnect(self):
        """Reconnect to the database in case of a lost connection."""
        self.close()
        self.connect()
