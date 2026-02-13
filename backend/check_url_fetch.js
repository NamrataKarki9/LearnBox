import https from 'https';

const url = 'https://res.cloudinary.com/dd2n9hc59/raw/upload/v1770981820/learnbox/colleges/5/resources/resource-1770981798071-532379816.pdf_uwb3qp.dat';

console.log('Fetching:', url);

https.get(url, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        // Just grab start to check if it looks like PDF
        if (data.length < 50) data += chunk.toString();
    });
    
    res.on('end', () => {
        console.log('Body Start:', data.substring(0, 50));
    });
}).on('error', (e) => {
    console.error('Error:', e);
});