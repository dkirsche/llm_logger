import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

// GraphQL query to fetch agent status data with all available fields
const GET_AGENT_STATUS = gql`
    query GetAgentStatus($offset: Int, $limit: Int) {
      agent_status(
        limit: $limit,
        offset: $offset,
        order_by: {created_at: desc}
      ) {
        agent_id
        agent_name
        created_at
        is_paused
        pause_message
        updated_at
      }
    }
`;

// GraphQL mutation to toggle the is_paused status
const TOGGLE_AGENT_PAUSE = gql`
    mutation ToggleAgentPause($agent_id: uuid!, $is_paused: Boolean!) {
      update_agent_status(
        where: { agent_id: { _eq: $agent_id } },
        _set: { is_paused: $is_paused }
      ) {
        affected_rows
        returning {
          agent_id
          agent_name
          created_at
          is_paused
          pause_message
          updated_at
        }
      }
    }
`;

function AgentStatus() {
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 100; // 100 records per page as requested
    const offset = (currentPage - 1) * limit;

    // Fetch data with GraphQL query
    const { loading, error, data, refetch } = useQuery(GET_AGENT_STATUS, {
        variables: { offset, limit },
        notifyOnNetworkStatusChange: true,
    });

    // Mutation hook for toggling pause status
    const [toggleAgentPause, { loading: mutationLoading }] = useMutation(TOGGLE_AGENT_PAUSE);

    // Function to handle toggle button click
    const handleTogglePause = async (agentId, currentPauseStatus) => {
        try {
            console.log('Toggling pause status for agent:', agentId, 'from', currentPauseStatus, 'to', !currentPauseStatus);

            const result = await toggleAgentPause({
                variables: {
                    agent_id: agentId,
                    is_paused: !currentPauseStatus
                }
            });

            console.log('Mutation result:', result);

            // Refetch the data to show updated values
            refetch();
        } catch (error) {
            console.error('Full error object:', error);
            console.error('Error message:', error.message);
            console.error('GraphQL errors:', error.graphQLErrors);
            console.error('Network error:', error.networkError);

            let errorMessage = 'Failed to update pause status. Please try again.';
            if (error.graphQLErrors && error.graphQLErrors.length > 0) {
                errorMessage = `GraphQL Error: ${error.graphQLErrors[0].message}`;
            } else if (error.networkError) {
                errorMessage = `Network Error: ${error.networkError.message}`;
            }

            alert(errorMessage);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    const agentStatusData = data?.agent_status || [];
    const hasNextPage = agentStatusData.length === limit;
    const hasPrevPage = currentPage > 1;

    const handleNextPage = () => {
        if (hasNextPage) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (hasPrevPage) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleFirstPage = () => {
        setCurrentPage(1);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ textAlign: 'center', color: '#333' }}>Agents</h1>
            
            {/* Pagination controls */}
            <div style={{ 
                marginBottom: '20px', 
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px'
            }}>
                <button 
                    onClick={handleFirstPage}
                    disabled={!hasPrevPage}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: hasPrevPage ? '#007bff' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: hasPrevPage ? 'pointer' : 'not-allowed'
                    }}
                >
                    First
                </button>
                <button 
                    onClick={handlePrevPage}
                    disabled={!hasPrevPage}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: hasPrevPage ? '#007bff' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: hasPrevPage ? 'pointer' : 'not-allowed'
                    }}
                >
                    Previous
                </button>
                <span style={{ margin: '0 15px', fontWeight: 'bold' }}>
                    Page {currentPage}
                </span>
                <button 
                    onClick={handleNextPage}
                    disabled={!hasNextPage}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: hasNextPage ? '#007bff' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: hasNextPage ? 'pointer' : 'not-allowed'
                    }}
                >
                    Next
                </button>
            </div>

            {/* Table display */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{
                                padding: '12px',
                                textAlign: 'left',
                                borderBottom: '2px solid #dee2e6',
                                fontWeight: 'bold'
                            }}>
                                Agent ID
                            </th>
                            <th style={{
                                padding: '12px',
                                textAlign: 'left',
                                borderBottom: '2px solid #dee2e6',
                                fontWeight: 'bold'
                            }}>
                                Agent Name
                            </th>
                            <th style={{
                                padding: '12px',
                                textAlign: 'left',
                                borderBottom: '2px solid #dee2e6',
                                fontWeight: 'bold'
                            }}>
                                Status
                            </th>
                            <th style={{
                                padding: '12px',
                                textAlign: 'left',
                                borderBottom: '2px solid #dee2e6',
                                fontWeight: 'bold'
                            }}>
                                Created At
                            </th>
                            <th style={{
                                padding: '12px',
                                textAlign: 'left',
                                borderBottom: '2px solid #dee2e6',
                                fontWeight: 'bold'
                            }}>
                                Updated At
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {agentStatusData.map((item, index) => (
                            <tr key={`${item.agent_id}-${index}`} style={{
                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                                borderBottom: '1px solid #dee2e6'
                            }}>
                                <td style={{ padding: '12px' }}>
                                    {item.agent_id}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {item.agent_name}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button
                                            onClick={() => handleTogglePause(item.agent_id, item.is_paused)}
                                            disabled={mutationLoading}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                border: 'none',
                                                backgroundColor: item.is_paused ? '#dc3545' : '#28a745',
                                                color: 'white',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                cursor: mutationLoading ? 'not-allowed' : 'pointer',
                                                opacity: mutationLoading ? 0.6 : 1,
                                                transition: 'all 0.2s ease',
                                                minWidth: '80px'
                                            }}
                                            onMouseOver={(e) => {
                                                if (!mutationLoading) {
                                                    e.target.style.opacity = '0.8';
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                if (!mutationLoading) {
                                                    e.target.style.opacity = '1';
                                                }
                                            }}
                                        >
                                            {mutationLoading ? 'Updating...' : (item.is_paused ? 'PAUSED' : 'ACTIVE')}
                                        </button>
                                        {item.pause_message && (
                                            <span style={{
                                                fontSize: '12px',
                                                color: '#666',
                                                fontStyle: 'italic'
                                            }}>
                                                {item.pause_message}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {agentStatusData.length === 0 && (
                <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                    No agent status records found.
                </p>
            )}

            {/* Bottom pagination info */}
            <div style={{ 
                marginTop: '20px', 
                textAlign: 'center',
                color: '#666'
            }}>
                Showing {agentStatusData.length} records on page {currentPage}
            </div>
        </div>
    );
}

export default AgentStatus;
