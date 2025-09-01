const WebSocket = require('ws');
const fs = require('fs');

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
	"#8013E0": "purple"
});

const LIGHTCOLORS = Object.freeze({
    "#D3D3D3": "blank",
    "#ff4f4f": "red",
    "#4fd6ff": "blue",
    "#80ff93": "green",
    "#ff80fd": "pink",
    "#a480ff": "purple"
})

kevingo = new WebSocket("wss://chat.kevcyg.net");

kevingo.onopen = () => {
	console.log("Connected to WebSocket server");
	kevingo.send(JSON.stringify({ username : argarray[0] }));
};

kevingo.onclose = (event) => console.log("Disconnected from WebSocket server", event);
kevingo.onerror = (error) => console.error("WebSocket error:", error);

kevingo.on("message", function message(data) {
    processWebsocketMessage(JSON.parse(data));
});

function processWebsocketMessage(data) {
    //console.log(data);
    if (data["type"] == "board") { processBoard(data); }
    if (data["type"] == "new_board") { processBoard(data); }
    if (data["type"] == "message") { processChat(data); }
}

function processBoard(data) {
    let i = 0;
    data["data"].forEach(square => {
        square["slot"] = `slot${i++}`;
        delete Object.assign(square, {["colors"]: square["color"] })["color"];
        square["colors"] = COLORS[square["colors"]];
    });
    writeOutBoard(data["data"]);
}


function writeOutBoard(data) {
    fs.writeFile('../../boardstate.txt', JSON.stringify(data), err => {
        if (err) {
            console.error(err);
            return;
        }
    });
}

function processChat(jsonData) {
    console.log(jsonData);
    let timestamp = new Date().getTime();
    let user = jsonData["data"]["username"];
    let color = LIGHTCOLORS[jsonData["data"]["color"]];
    let message = jsonData["data"]["content"];

    let outText = `<br>unix:${timestamp} <span style='color:${color};font-weight:bold'>${user}</span>: ${message}`;
    console.log(`${user}: ${message}`);
    if (message == "GO!") {
        outText += "<br>[SYS] Game started at unix:" + new Date().getTime();
    }
    if (message.toLowerCase().startsWith("gg")) {
        outText += "<br>[SYS] Game ended at unix:" + new Date().getTime();
    }
    fs.appendFile('chatlog.txt', outText, err => {
        if (err) {
            console.error(err);
            return;
        }
    });
}