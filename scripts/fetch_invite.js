const https = require('https');
const fs = require('fs');

const url = "https://in.limintso.com/lisaisaias-wedding/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb252aWRhZG9JZCI6MTAyNzQsImNhc2FtZW50b0lkIjo4MCwiaWF0IjoxNzUzNzEyMjkxLCJleHAiOjE3ODQ4MTYyOTF9.rAnVspk4jxeaJtmxPwa4z1zo3VCBTWMYTrh0LRWs7mU#";

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('invite_raw.html', data);
        console.log('HTML saved to invite_raw.html. Length: ' + data.length);
    });
}).on('error', (err) => {
    console.log('Error: ' + err.message);
});
