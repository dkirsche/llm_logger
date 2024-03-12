import os
import asyncio
from supabase import create_client, Client

class SupabaseLogger:
    def __init__(self):
        self.supabase: Client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
        self.session_id = "your_session_id"  # Assign or generate your session_id here

    async def start(self) -> str:
        await self.create_chat_completions_table()
        await self.create_agents_table()
        await self.create_oai_wrappers_table()
        await self.create_oai_clients_table()
        await self.create_version_table()
        return self.session_id

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
        await self._run_query(query=query)

    async def create_agents_table(self):
        query = """
            CREATE TABLE IF NOT EXISTS agents (
                id SERIAL PRIMARY KEY,
                agent_id INTEGER,
                wrapper_id INTEGER,
                session_id TEXT,
                name TEXT,
                class TEXT,
                init_args TEXT,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(agent_id, session_id))
        """
        await self._run_query(query=query)

    async def create_oai_wrappers_table(self):
        query = """
            CREATE TABLE IF NOT EXISTS oai_wrappers (
                id SERIAL PRIMARY KEY,
                wrapper_id INTEGER,
                session_id TEXT,
                init_args TEXT,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(wrapper_id, session_id))
        """
        await self._run_query(query=query)

    async def create_oai_clients_table(self):
        query = """
            CREATE TABLE IF NOT EXISTS oai_clients (
                id SERIAL PRIMARY KEY,
                client_id INTEGER,
                wrapper_id INTEGER,
                session_id TEXT,
                class TEXT,
                init_args TEXT,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(client_id, session_id))
        """
        await self._run_query(query=query)

    async def create_version_table(self):
        query = """
            CREATE TABLE IF NOT EXISTS version (
                id SERIAL PRIMARY KEY CHECK (id = 1),
                version_number INTEGER NOT NULL)
        """
        await self._run_query(query=query)

    async def _run_query(self, query: str):
        try:
            # Execute the query asynchronously
            # Supabase client currently does not support executing raw SQL directly,
            # so you would need to use Supabase dashboard or directly through PostgREST or similar methods.
            print(f"Query to run: {query}")
            # Run a SQL query
            result = supabase.query(query)

        except Exception as e:
            print(f"Error: {e}")


