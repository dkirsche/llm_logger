from llm_logger.postgres_logger import PostgresLogger 
import unittest
from unittest.mock import patch, MagicMock
import psycopg2
import datetime

# run from root directory
# python -m unittest tests.test_postgres_logger
class TestPostgresLogger(unittest.TestCase):
    def setUp(self):
        # Set up a PostgresLogger instance with a mock DSN
        self.logger = PostgresLogger(dsn="mock_dsn")

    @patch('psycopg2.connect')
    def test_insert_chat_completion_logs_warning_on_failure(self, mock_connect):
        # Mock the connection and cursor
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Simulate an exception when executing the query
        mock_cursor.execute.side_effect = psycopg2.DatabaseError("mock database error")

        # Mock the logging to capture log messages
        with self.assertLogs('root', level='WARNING') as log:
            self.logger.insert_chat_completion(
                invocation_id="test_invocation_id",
                client_id=1,
                wrapper_id=2,
                session_id="test_session_id",
                request="test_request",
                response="test_response",
                model_id="test_model_id",
                is_cached=0,
                cost=0.1,
            )

        # Check that a warning was logged
        self.assertIn("WARNING:llm_logger.postgres_logger:Failed to insert chat completion: mock database error", log.output)

        # Ensure the connection was attempted
        mock_connect.assert_called_once_with("mock_dsn")
        # Ensure the cursor execute was called
        mock_cursor.execute.assert_called()

if __name__ == '__main__':
    unittest.main()