from llm_logger.postgres_logger import PostgresLogger 
import unittest
from unittest.mock import patch, MagicMock
import psycopg2
from psycopg2 import OperationalError, InterfaceError, DatabaseError
import datetime

# run from root directory
# python -m unittest tests.test_failure
class TestPostgresLogger(unittest.TestCase):
    def setUp(self):
        # Set up a PostgresLogger instance with a mock DSN
        self.logger = PostgresLogger(dsn="mock_dsn", max_retries=3, retry_delay=1)

    @patch('psycopg2.connect')
    def test_insert_chat_completion_logs_warning_on_failure(self, mock_connect):
        # Mock the connection and cursor
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Simulate a DatabaseError exception when executing the query
        mock_cursor.execute.side_effect = psycopg2.DatabaseError("mock database error")

        # Mock the logging to capture log messages
        with self.assertLogs('llm_logger.postgres_logger', level='ERROR') as log:
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

        # Check that an error was logged
        self.assertIn("ERROR:llm_logger.postgres_logger:Database error: mock database error", log.output)

        # Ensure the connection was attempted
        mock_connect.assert_called_once_with("mock_dsn")
        # Ensure the cursor execute was called
        mock_cursor.execute.assert_called()

    @patch('psycopg2.connect')
    def test_run_query_retries_on_operational_error(self, mock_connect):
        # Mock the connection and cursor
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Simulate an OperationalError which should trigger retries
        mock_cursor.execute.side_effect = OperationalError("mock operational error")

        # Mock the logging to capture log messages
        with self.assertLogs('llm_logger.postgres_logger', level='WARNING') as log:
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

        # Check that retries were logged
        self.assertIn("WARNING:llm_logger.postgres_logger:Database connection issue: mock operational error. Retrying 1/3...", log.output)
        self.assertIn("WARNING:llm_logger.postgres_logger:Database connection issue: mock operational error. Retrying 2/3...", log.output)

        # Ensure the connection was retried
        self.assertEqual(mock_connect.call_count, 3)  # Should retry 3 times
        # Ensure the cursor execute was called for each retry
        self.assertEqual(mock_cursor.execute.call_count, 3)

    @patch('psycopg2.connect')
    def test_run_query_retries_on_interface_error(self, mock_connect):
        # Mock the connection and cursor
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Simulate an InterfaceError which should trigger retries
        mock_cursor.execute.side_effect = InterfaceError("mock interface error")

        # Mock the logging to capture log messages
        with self.assertLogs('llm_logger.postgres_logger', level='WARNING') as log:
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

        # Check that retries were logged
        self.assertIn("WARNING:llm_logger.postgres_logger:Database connection issue: mock interface error. Retrying 1/3...", log.output)

        # Ensure the connection was retried
        self.assertEqual(mock_connect.call_count, 3)  # Should retry 3 times
        # Ensure the cursor execute was called for each retry
        self.assertEqual(mock_cursor.execute.call_count, 3)

    @patch('psycopg2.connect')
    def test_run_query_max_retries_exceeded(self, mock_connect):
        # Mock the connection and cursor
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Simulate an OperationalError which should trigger retries and eventually fail
        mock_cursor.execute.side_effect = OperationalError("mock operational error")

        # Mock the logging to capture log messages
        with self.assertLogs('llm_logger.postgres_logger', level='ERROR') as log:
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

        # Check that the error message about max retries being reached was logged
        self.assertTrue(any("Max retries reached" in message for message in log.output))

        # Ensure the connection was retried up to the max retries
        self.assertEqual(mock_connect.call_count, 3)  # Should retry 3 times
        # Ensure the cursor execute was called for each retry
        self.assertEqual(mock_cursor.execute.call_count, 3)


if __name__ == '__main__':
    unittest.main()