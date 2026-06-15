const WebSocket = require('ws');
const fs = require('fs');
const WS_SOURCE = "Kevingo Reader";

let argarray = [];
process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
    argarray = array.slice(2);
  });

const COLORS = Object.freeze({
    "#101010": "blank",
    "#DB1111": "red",
    "#195BD7": "blue",
	"#159C0E": "green",
	"#FF69B4": "pink",
	"#8013E0": "purple",
    "#ffffff": "SERVER"
});

const LIGHTCOLORS = Object.freeze({
    "#D3D3D3": "blank",
    "#ff4f4f": "red",
    "#4fd6ff": "blue",
    "#80ff93": "green",
    "#ff80fd": "pink",
    "#a480ff": "purple",
    "#ffffff": "SERVER"
})

function launchKevingoReader(kevingoWSURL) {
    let vowel = 
    console.log("Attempting to launch Kevingo Reader with URL: " + kevingoWSURL);
    kevingo = new WebSocket(kevingoWSURL);
    nodecgServer = new WebSocket('ws://localhost:7135');

    kevingo.onopen = () => {
        console.log("Connected to WebSocket server");
        kevingo.send(JSON.stringify({ username : argarray[0] }));
        sendToServer("kevingo_connect", kevingoWSURL);
    };

    nodecgServer.onopen = () => {
        sendToServer("connect", "Connected");
    }

    kevingo.onclose = (event) => console.log("Disconnected from WebSocket server", event);
    kevingo.onerror = (error) => console.error("WebSocket error:", error);

    kevingo.on("message", function message(data) {
        processWebsocketMessage(JSON.parse(data));
    });

    return kevingo;
}

function processWebsocketMessage(data) {
    if (data["type"] == "history") return;
    if (data["type"] == "user_list") return;
    console.log("Received message from Kevingo:");
    console.log(data);
    if (data["type"] == "board") { processBoard(data, "board_update"); }
    if (data["type"] == "new_board") { processBoard(data, "new_board"); }
    if (data["type"] == "message") { processChat(data); }
    if (data["type"] == "game_start") { processGameStart(data); }
    if (data["type"] == "square_marked") { processSquareMark(data); }
    if (data["type"] == "unmark_square") { processSquareUnmark(data); } //NEVER HAPPENS RN
    if (data["type"] == "user_list") { return; }
    if (data["type"] == "history") { return; }
}

function processSquareMark(data) {
    console.log("Received Square Mark Event!");
    let player = data["data"]["user"];
    let text = data["data"]["text"];
    let index = data["data"]["index"];
    let source = data["data"]["source"];
    sendToServer("square_marked", JSON.stringify({
        "player": player,
        "text": text,
        "index": index,
        "source": source
    }));
}

function processSquareUnmark(data) {
    // UNUSED IN KEVINGO
    console.log("Received Square Unmark Event!");
    let player = data["data"]["user"];
    let text = data["data"]["text"];
    let index = data["data"]["index"];
    let source = data["data"]["source"];
    sendToServer("square_marked", JSON.stringify({
        "player": player,
        "text": text,
        "index": index,
        "source": source
    }));
}

function processBoard(data, message_type) {
    let i = 0;
    data["data"].forEach(square => {
        square["slot"] = `slot${i++}`;
        delete Object.assign(square, {["colors"]: square["color"] })["color"];
        square["colors"] = COLORS[square["colors"]];
    });
    // sendToServer("end_game", JSON.stringify({}));
    sendBoardToServer(data["data"], message_type);
}

function sendBoardToServer(data, message_type) {
    sendToServer(message_type, JSON.stringify(data));
}

function processChat(jsonData) {
    console.log(jsonData);
    let timestamp = new Date().getTime();
    let user = jsonData["data"]["username"];
    let color = LIGHTCOLORS[jsonData["data"]["color"]];
    let message = jsonData["data"]["content"];

    if (message == "GO!" && color == "SERVER") {
        sendToServer("start_game", JSON.stringify({}));
    }

    if (message.toLowerCase() == "gg" && color != "blank") {
        sendToServer("end_game", JSON.stringify({}));
    }

    sendToServer("chat_message", JSON.stringify({
        "timestamp": timestamp,
        "user": user,
        "color": color,
        "message": message
    }));
}

function processGameStart(jsonData) {
    console.log("KEVINGO JSON DATA IS: " + JSON.stringify(jsonData));
    sendToServer("start_game", {"start_time": jsonData.data.timestamp});
}

function sendToServer(type, message) {
    nodecgServer.send(JSON.stringify({
        "source": WS_SOURCE,
        "timestamp": Date.now(),
        "type": type,
        "message": message
    }));
}

module.exports = {
    launchKevingoReader
};