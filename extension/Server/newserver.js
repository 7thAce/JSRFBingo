const { set } = require('lodash');
const { type } = require('os');
const WebSocket = require('ws');

const ws_read = new WebSocket.Server({ port: 7136 });

let subscribers = [];
console.log("Websocket started on port 7Ace");
console.log("Server version 2")

function publish(message) {
  if (typeof message !== 'string') {
    message = JSON.stringify(message);
  }
  console.log(`[${getNow()}] Broadcasting: ${message}`);
  subscribers.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

ws_read.on('connection', function connection(ws) {
  subscribers.push(ws);

  ws.on('message', function incoming(message) {
    console.log(message);
    publish(message);
  });

  ws.on("jsrfbingo", function incoming(message) {
    console.log(message);
  });


  ws.on('close', function close() {
    console.log('disconnected');
    subscribers = subscribers.filter(client => client !== ws);
  })
});

pingTimer = setInterval(ping, 1000);


function ping() {
  if (subscribers.length == 0) return;
  publish("ping");
}

function getNow() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const iii = String(now.getMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${iii}`;
}