import unittest
from unittest.mock import AsyncMock, patch
from llm_logger.main import SupabaseLogger  # replace YourClassName with the actual class name

class TestCreateChatCompletionsTable(unittest.TestCase):
    @patch.object(SupabaseLogger, "_run_query", new_callable=AsyncMock)
    async def test_create_chat_completions_table(self, mock_run_query):
        # Arrange
        supabase = SupabaseLogger()  # add necessary arguments if any
        expected_query = """
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

        # Act
        await supabase.create_chat_completions_table()

        # Assert
        mock_run_query.assert_called_once_with(query=expected_query)

if __name__ == "__main__":
    unittest.main()