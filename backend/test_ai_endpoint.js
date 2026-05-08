const http = require('http');

const data = JSON.stringify({
    bride_name: 'Teste',
    groom_name: 'Teste',
    event_type: 'Casamento',
    event_date: '2026-10-10',
    location: 'Vila',
    message: 'Venha',
    plan_name: 'Plano Básico'
});

const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/v1/invitations/generate-ia',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let body = '';
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log(`BODY: ${body}`));
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
