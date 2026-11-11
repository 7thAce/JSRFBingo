const Peer = require('peerjs-on-node').Peer;

let multiID = null;
let conn = null;
let connectionTimeout = null;
let started = false;
let disconnecting = false;
const peer = new Peer(null, {
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    }
});

function disconnectClient() {
    if (disconnecting) return;
    disconnecting = true;
    clearTimeout(connectionTimeout);

    if (conn) {
        conn.close();
    }
    peer.destroy();

    if (process.connected) {
        process.send({ type: 'disconnected' }, () => process.exit(0));
    } else {
        process.exit(0);
    }
}

function connectClient() {
    console.log(`Received multiID: ${multiID}`);

    peer.on("open", (id) => {
        console.log(`Peer open with id: ${id}`);
        console.log(`Attempting to connect with id ${multiID}`);
        conn = peer.connect(multiID);

        connectionTimeout = setTimeout(() => {
            console.log(`Connection to ${multiID} timed out after 30 seconds.`);
            process.send({ type: 'error', error: 'timeout' });
        }, 30000);

        conn.on('open', () => {
            clearTimeout(connectionTimeout);
            console.log(`Connection to ${multiID} established successfully.`);
            process.send({ type: 'connected' });
        });

        conn.on('error', (err) => {
            clearTimeout(connectionTimeout);
            console.error(`Connection error: ${err}`);
            process.send({ type: 'error', error: err });
        });

        conn.on('close', () => {
            clearTimeout(connectionTimeout);
            console.log(`Connection to ${multiID} closed.`);
        });

        conn.on("data", (data) => {
            // console.log(`Received data: ${data}`);
            process.send({ type: 'data', data: data });
        });
    });

    peer.on("error", (err) => {
        console.error(`Peer error: ${err}`);
        process.send({ type: 'error', error: err });
    });

    peer.on("disconnected", () => {
        console.log("Peer disconnected from server.");
    });
}

process.on('message', (message) => {
    if (message.type === 'disconnect') {
        disconnectClient();
        return;
    }
    if (started) return;

    started = true;
    multiID = message.multiID;
    connectClient();
});