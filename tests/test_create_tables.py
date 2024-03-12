import pytest
from unittest.mock import AsyncMock
from llm_logger.postgres_logger import PostgresLogger   # replace YourClassName with the actual class name

@pytest.mark.asyncio
async def test_create_chat_completions_table(mocker):
    # Arrange
    mock_run_query = mocker.patch.object(PostgresLogger, "run_query", new_callable=AsyncMock)
    instance = PostgresLogger()  # add necessary arguments if any
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
    await instance.create_chat_completions_table()

    # Assert
    mock_run_query.assert_called_once_with(expected_query)
