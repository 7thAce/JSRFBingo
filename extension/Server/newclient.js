const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:7135');

ws.on('open', () => {
    ws.send('Hi!');
});

ws.on('message', (data) => {
    console.log(`[${getNow()}] Received: ${data}`);
});

ws.on('error', (err) => {
    console.error('WebSocket error:', err);
});

ws.on('close', () => {
    console.log('WebSocket connection closed');
});

function getNow() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const iii = String(now.getMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${iii}`;
}
