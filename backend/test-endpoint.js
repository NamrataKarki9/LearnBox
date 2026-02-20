// Quick test to check quiz history endpoint
const testEndpoint = async () => {
    try {
        // You'll need to replace this token with a valid student token
        const response = await fetch('http://localhost:5000/api/quiz/history?limit=10', {
            headers: {
                'Authorization': 'Bearer YOUR_TOKEN_HERE',
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
};

testEndpoint();
