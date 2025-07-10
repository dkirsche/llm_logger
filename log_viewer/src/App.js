import React, { useState, useEffect } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, gql } from '@apollo/client';
import AgentStatus from './AgentStatus';

// Hasura GraphQL endpoint
const client = new ApolloClient({
    uri: 'https://glad-bonefish-73.hasura.app/v1/graphql',
    headers: {
        'x-hasura-admin-secret': 'FAo4qiSQcfI71s4K0IgL5xIvlYLPbZaWbiui2QYeXRlSthB6AFyNY6MRK9T9DFeF',
    },
    cache: new InMemoryCache(),
});

// GraphQL query to fetch data
const GET_DATA = gql`
    query MyQuery($startId: Int, $limit: Int) {
      chat_completions(
        where: {
          id: { _lte: $startId }
        },
        limit: $limit,
        order_by: {start_time: desc}
      ) {
        request
        response
        start_time
        total_time
        id
        end_time
        cost
        model_id
        agent
      }
    }
`;

function DataComponent() {
    const [startId, setStartId] = useState(2147483647); // Default to max int value
    const [nextStartId, setNextStartId] = useState(null); // Variable to store next startId for future queries
    const [chatCompletions, setChatCompletions] = useState([]); // Store chat completions
    const [isFetchingMore, setIsFetchingMore] = useState(false); // Track if we're fetching more data
    const [userStartId, setUserStartId] = useState(''); // User input for start ID
    const [debounceTimeout, setDebounceTimeout] = useState(null); // Timeout for debounce
    const limit = 30; // Number of items to load per scroll

    // Fetch data with GraphQL query
    const { loading, error, data, fetchMore } = useQuery(GET_DATA, {
        variables: { startId, limit },
        notifyOnNetworkStatusChange: true, // To track loading states properly
        onCompleted: (fetchedData) => {
            if (fetchedData?.chat_completions.length > 0) {
                if (isFetchingMore) {
                    // Infinite scroll case: append to the existing list
                    setChatCompletions((prev) => [...prev, ...fetchedData.chat_completions]);
                } else {
                    // New user start ID: replace the entire list
                    setChatCompletions(fetchedData.chat_completions);
                }
                // Set nextStartId to the last record's ID, but do NOT trigger a re-fetch
                setNextStartId(fetchedData.chat_completions[fetchedData.chat_completions.length - 1].id - 1);
            }
            setIsFetchingMore(false);
        },
    });

    // Infinite scroll: detect if user scrolls near the bottom and load more data
    useEffect(() => {
        const handleScroll = () => {
            const isNearBottom =
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 100;

            if (isNearBottom && !isFetchingMore && !loading) {
                setIsFetchingMore(true);
                // Now, use the nextStartId to update startId, and trigger the next fetch
                setStartId(nextStartId);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isFetchingMore, loading, nextStartId]);

    // Handle user input and debounce the query update
    const handleUserStartIdChange = (e) => {
        const value = e.target.value;
        setUserStartId(value);

        // Clear previous debounce timeout if user keeps typing
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        // Set new debounce timeout for 2.5 seconds
        setDebounceTimeout(
            setTimeout(() => {
                // If input is valid (not empty), set startId to the user's input
                if (value !== '') {
                    setStartId(parseInt(value)); // Update startId with user's input
                } else {
                    setStartId(2147483647); // Reset to max int if input is cleared
                }
            }, 2500) // 2.5 seconds debounce
        );
    };

    if (loading && chatCompletions.length === 0) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ textAlign: 'center', color: '#333' }}>Chat Completions Data</h1>

            {/* Input to set starting ID */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <label htmlFor="startId" style={{ marginRight: '10px' }}>Start from ID:</label>
                <input
                    id="startId"
                    type="number"
                    value={userStartId}
                    onChange={handleUserStartIdChange}
                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                    placeholder="Enter ID or leave blank"
                />
                {/* Show loading indicator next to the input field */}
                {loading && <span style={{ marginLeft: '10px' }}>Loading...</span>}
            </div>

            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {chatCompletions.map((item, index) => {
                    let formattedRequest;
                    try {
                        formattedRequest = JSON.parse(item.request);
                    } catch (e) {
                        formattedRequest = item.request;
                    }

                    return (
                        <li key={item.id} style={{ 
                            background: '#f9f9f9', 
                            marginBottom: '20px', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                flexWrap: 'wrap'
                            }}>
                                <p><strong>ID:</strong> {item.id}</p>
                                <p><strong>Start Time:</strong> {new Date(item.start_time).toLocaleString()}</p>
                                <p><strong>End Time:</strong> {new Date(item.end_time).toLocaleString()}</p>
                                <p><strong>Total Time:</strong> {item.total_time} ms</p>
                                <p><strong>Model ID:</strong> {item.model_id}</p>
                                <p><strong>Cost:</strong> ${item.cost}</p>
                            </div>
                            <p><strong>Agent:</strong> {item.agent}</p>
                            <p><strong>Request: </strong></p>
                            {typeof formattedRequest === 'string' ? (
                                <p style={{
                                    background: '#f0f0f0',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    whiteSpace: 'pre-wrap',
                                    wordWrap: 'break-word',
                                    color: '#333'
                                }}>
                                    {formattedRequest}
                                </p>
                            ) : (
                                <pre style={{
                                    background: '#333',
                                    color: '#eee',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    overflowX: 'auto'
                                }}>
                                    {JSON.stringify(formattedRequest, null, 2)}
                                </pre>
                            )}
                            <p><strong> Agent:</strong> {item.agent}</p>
                            <p><strong> Response:</strong></p>
                            <p style={{ 
                                background: '#e6e6e6', 
                                padding: '10px', 
                                borderRadius: '5px' 
                            }}>
                                {item.response}
                            </p>
                        </li>
                    );
                })}
            </ul>

            {isFetchingMore && <p>Loading more...</p>}
        </div>
    );
}

function App() {
    // Initialize active tab from URL hash or default to chat-completions
    const getInitialTab = () => {
        const hash = window.location.hash.replace('#', '');
        return hash === 'agents' ? 'agent-status' : 'chat-completions';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);

    // Update URL hash when tab changes
    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        const hashName = tabName === 'agent-status' ? 'agents' : 'chat-completions';
        window.location.hash = hashName;
    };

    // Listen for browser back/forward navigation
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            const newTab = hash === 'agents' ? 'agent-status' : 'chat-completions';
            setActiveTab(newTab);
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const tabStyle = {
        padding: '12px 24px',
        border: 'none',
        backgroundColor: '#f8f9fa',
        cursor: 'pointer',
        borderBottom: '3px solid transparent',
        fontSize: '16px',
        fontWeight: '500',
        transition: 'all 0.3s ease'
    };

    const activeTabStyle = {
        ...tabStyle,
        backgroundColor: '#007bff',
        color: 'white',
        borderBottom: '3px solid #0056b3'
    };

    return (
        <ApolloProvider client={client}>
            <div className="App">
                {/* Tab Navigation */}
                <div style={{
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    padding: '0',
                    marginBottom: '0'
                }}>
                    <div style={{
                        display: 'flex',
                        maxWidth: '1200px',
                        margin: '0 auto'
                    }}>
                        <button
                            style={activeTab === 'chat-completions' ? activeTabStyle : tabStyle}
                            onClick={() => handleTabChange('chat-completions')}
                        >
                            Chat Completions
                        </button>
                        <button
                            style={activeTab === 'agent-status' ? activeTabStyle : tabStyle}
                            onClick={() => handleTabChange('agent-status')}
                        >
                            Agents
                        </button>
                    </div>
                </div>

                {/* Tab Content - Only render active tab to prevent unnecessary data loading */}
                {activeTab === 'chat-completions' && <DataComponent />}
                {activeTab === 'agent-status' && <AgentStatus />}
            </div>
        </ApolloProvider>
    );
}

export default App;