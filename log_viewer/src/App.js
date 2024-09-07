import React, { useState, useEffect } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, gql } from '@apollo/client';

// Hasura GraphQL endpoint
const client = new ApolloClient({
    uri: 'https://relevant-finch-21.hasura.app/v1/graphql',
    headers: {
        'x-hasura-admin-secret': '7fveFDT8WWnuajGHr3L76D1ymmQrwJm561NIWqz50BWvTWCbWWt08cPHk6NNlQrh',
    },
    cache: new InMemoryCache(),
});

// GraphQL query
const GET_DATA = gql`
    query MyQuery($startId: Int) {
      chat_completions(
        where: {
          id: { _lte: $startId }
        },
        limit: 30,
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
    const [startIdInput, setStartIdInput] = useState(''); // Default input to blank
    const [startId, setStartId] = useState(2147483647); // Default to max int value
    const [typingTimeout, setTypingTimeout] = useState(null); // Timeout for debounce

    // Debounce function to update the query only after user stops typing for 500ms
    const handleStartIdChange = (e) => {
        const value = e.target.value;
        setStartIdInput(value);

        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        // Set a timeout to update the startId after user stops typing for 500ms
        setTypingTimeout(
            setTimeout(() => {
                // If input is empty, default to the largest possible int value
                setStartId(value === '' ? Number.MAX_SAFE_INTEGER : parseInt(value));
            }, 500)
        );
    };

    // Conditional variables to avoid passing null values
    const queryVariables = { startId };

    const { loading, error, data } = useQuery(GET_DATA, {
        variables: queryVariables, // Always pass startId (default to largest int when blank)
    });

    if (loading) return <p>Loading...</p>;
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
                    value={startIdInput}
                    onChange={handleStartIdChange}
                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                    placeholder="Enter ID or leave blank"
                />
            </div>

            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {data.chat_completions.map((item) => {
                    let formattedRequest;
                    try {
                        // Attempt to parse the request into JSON
                        formattedRequest = JSON.parse(item.request);
                    } catch (e) {
                        // Fallback to raw string with text wrapping
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
        </div>
    );
}

function App() {
    return (
        <ApolloProvider client={client}>
            <div className="App">
                <DataComponent />
            </div>
        </ApolloProvider>
    );
}

export default App;