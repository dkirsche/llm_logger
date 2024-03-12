import asyncio
import asyncpg
import os

class PostgresLogger:
    def __init__(self, dsn=None):
        # Database connection string
        self.dsn = dsn or os.getenv("POSTGRES_URL")
        self.connection = None

    async def connect(self):
        # Establish a connection to the database
        self.connection = await asyncpg.connect(self.dsn)

    async def close(self):
        # Close the database connection
        if self.connection:
            await self.connection.close()

    async def create_chat_completions_table(self):
        query = """
            CREATE TABLE IF NOT EXISTS chat_completions(
                id SERIAL PRIMARY KEY,
                invocation_id TEXT,
                client_id INTEGER,
                wrapper_id INTEGER,
                session_id TEXT,
                request TEXT,
                response TEXT,
                is_cached INTEGER,
                cost REAL,
                start_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)
        """
        await self.run_query(query)
    
    async def insert_chat_completion(self, invocation_id, client_id, wrapper_id, session_id, request, response, is_cached, cost):
        query = """
            INSERT INTO chat_completions(invocation_id, client_id, wrapper_id, session_id, request, response, is_cached, cost)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """
        await self.run_query(query, invocation_id, client_id, wrapper_id, session_id, request, response, is_cached, cost)

    async def run_query(self, query, *args):
        # Run a SQL query
        if not self.connection:
            await self.connect()
        return await self.connection.execute(query, *args)

# Example usage
async def main():
    logger = PostgresLogger()
    await logger.connect()
    # Insert test data
    await logger.insert_chat_completion(
        invocation_id="test_invocation_001",
        client_id=123,
        wrapper_id=456,
        session_id="test_session_001",
        request="This is a test request",
        response="This is a test response",
        is_cached=False,
        cost=1.23
    )

if __name__ == "__main__":
    asyncio.run(main())
