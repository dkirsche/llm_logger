import pytest
from unittest.mock import AsyncMock
from llm_logger.postgres_logger import PostgresLogger  # replace YourClassName with the actual class name

@pytest.mark.asyncio
async def test_insert_chat_completion(mocker):
    # Arrange
    mock_run_query = mocker.patch.object(PostgresLogger, "run_query", new_callable=AsyncMock)
    instance = PostgresLogger()  # add necessary arguments if any
    invocation_id, client_id, wrapper_id, session_id, request, response, is_cached, cost = 1, 2, 3, 'session', 'request', 'response', True, 1.0
    expected_query = """
        INSERT INTO chat_completions(invocation_id, client_id, wrapper_id, session_id, request, response, is_cached, cost)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    """
    expected_params = (invocation_id, client_id, wrapper_id, session_id, request, response, is_cached, cost)

    # Act
    await instance.insert_chat_completion(invocation_id, client_id, wrapper_id, session_id, request, response, is_cached, cost)

    # Assert
    mock_run_query.assert_called_once_with(expected_query, *expected_params)