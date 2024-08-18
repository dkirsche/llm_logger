import React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, gql } from '@apollo/client';

// Hasura GraphQL endpoint
const client = new ApolloClient({
    uri: 'https://relevant-finch-21.hasura.app/v1/graphql',
    headers: {
        'x-hasura-admin-secret': '7fveFDT8WWnuajGHr3L76D1ymmQrwJm561NIWqz50BWvTWCbWWt08cPHk6NNlQrh',
    },
    cache: new InMemoryCache(),
});

// GraphQL query to fetch data from a specific table
const GET_DATA = gql`
    query MyQuery {
      chat_completions(limit: 10, order_by: {start_time: desc}) {
        request
        response
        start_time
        total_time
        id
        end_time
        cost
        model_id
      }
    }
`;

function DataComponent() {
    const { loading, error, data } = useQuery(GET_DATA);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ textAlign: 'center', color: '#333' }}>Chat Completions Data</h1>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {data.chat_completions.map((item) => {
                    let formattedRequest;
                    try {
                        // Attempt to parse the request into JSON
                        formattedRequest = JSON.parse(item.request);
                    } catch (e) {
                        console.error('Failed to parse request as JSON:', e);
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
                            <p><strong>Request:</strong></p>
                            {typeof formattedRequest === 'string' ? (
                                <p style={{
                                    background: '#f0f0f0',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    whiteSpace: 'pre-wrap',  // Ensures text wraps correctly
                                    wordWrap: 'break-word',  // Breaks long words if necessary
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
                            <p><strong>Response:</strong></p>
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
