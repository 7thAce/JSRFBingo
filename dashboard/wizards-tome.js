// You can access the NodeCG api anytime from the `window.nodecg` object
// Or just `nodecg` for short. Like this!:
nodecg.log.info("Wizard's Tome panel script running!");
console.log("Wizard's Tome panel script running!");
const WS_SOURCE = "Dashboard"
const websocket = new WebSocket("ws://localhost:7135");

websocket.onopen = () => {
    console.log("Connected to WebSocket server.");
    websocket.send("connect", "Connected");
};

websocket.onclose = () => {
    console.log("Disconnected from WebSocket server.");
};

const originalWebSocketSend = WebSocket.prototype.send;
WebSocket.prototype.send = function (type, message) {
    wsSend = {
        "source": WS_SOURCE,
        "timestamp": Date.now(),
        "type": type,
        "message": message,
    }
    originalWebSocketSend.call(this, JSON.stringify(wsSend)); // Or modifiedData if applicable
};

function launchServer() {
    console.log("Launching server...");
    nodecg.sendMessage('launch-server');
}

function launchClient() {
    console.log("Launching client...");
    nodecg.sendMessage('launch-client');
}

function setLightDark(elementName, lightColor = "#FFFFFF", darkColor = "#000000") {
    const element = document.getElementById(elementName);
    if (!element) return null;

    // Get computed background color
    const bg = window.getComputedStyle(element).backgroundColor;

    // Parse rgb(a) string: "rgb(r, g, b)" or "rgba(r, g, b, a)"
    const rgb = bg.match(/\d+/g);
    if (!rgb || rgb.length < 3) {
        element.style.color = darkColor;
        return darkColor; // fallback
    }

    const r = parseInt(rgb[0], 10);
    const g = parseInt(rgb[1], 10);
    const b = parseInt(rgb[2], 10);

    // Calculate luminance (per WCAG)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);

    // Decide text color based on luminance
    const textColor = luminance > 186 ? darkColor : lightColor;
    element.style.color = textColor;
    return textColor;
}