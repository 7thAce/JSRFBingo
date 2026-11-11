const WebSocket = require('ws');
const fs = require('fs');
const https = require('https');

const bingosync = new WebSocket('wss://sockets.bingosync.com/broadcast');

let boardJSON = "";

clearChatLog();
getBoard();

function getBoard() {
    https.get("https://bingosync.com/room/Pbpf1ZonQN-Fco1-PVut_w/board", function(res) {
        console.log(res.statusCode);
        res.setEncoding('utf8');
        res.on('data', function(data) {
            boardJSON = JSON.parse(data);
            fs.writeFile('boardstate.txt', data + "\n", err => {
                if (err) {
                    if (err == 429) {
                        console.error("429: Rate limit.")
                    }
                    console.error(err);
                    return;
                }
            });
        });
    }).on('error', function(err) {
        console.log(err);
    });
}

function processWebsocketMessage(data) {
    if (data.length < 10) {
        return;
    }

    let jsonData = JSON.parse(data);
    let messageType = jsonData["type"];

    if (messageType == "error") {
        alert("A bingosync error occurred!");
    }

    if (messageType == "new-card") {
        console.log("New Card Detected!");
        console.log(jsonData);
        getBoard();
        clearChatLog();
        //drawBoard()
        //populateForm() //all the other data
    }
 
    if (messageType == "chat") {
        let user = jsonData["player"]["name"];
        let message = jsonData["text"];
        let userColor = jsonData["player_color"];
        console.log(user + ": " + message);
        a = {"type": "chat", "timestamp": 1708637942.351689, "room": "Z2PxirRLSxOV2BBAk6R1Jg", "text": "Yes :D", "player_color": "blank", "player": {"uuid": "PTL9TWE-RFWlNvF8judilA", "name": "Crabbi", "is_spectator": true, "color": "blank"}}
        b = {"type": "chat", "timestamp": 1708550615.643175, "room": "Z2PxirRLSxOV2BBAk6R1Jg", "text": "asdf", "player_color": "red", "player": {"uuid": "bdPfoIkLQbKnHSp-tuUUpw", "name": "7thace", "is_spectator": false, "color": "red"}}

        let textTemplate = "<br>unix:{timestamp} <span style='color:{color};font-weight:bold'>{name}</span>: {text}";
        let outText = textTemplate.replaceAll("{color}", userColor).replaceAll("{name}", user).replaceAll("{text}", message).replaceAll("{timestamp}", new Date().getTime());
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

    if (messageType == "goal") {
        let slotNum = parseInt(jsonData["square"]["slot"].split("slot")[1]);
        let user = jsonData["player"]["name"];
        let userColor = jsonData["color"];
        let squareText = jsonData["square"]["name"];
        //console.log(jsonData);
        console.log("Found square changed slot " + slotNum + " by " + user + "[" + userColor + "]");
        boardJSON[slotNum - 1].colors = jsonData["square"]["colors"];
        fs.writeFile('boardstate.txt', JSON.stringify(boardJSON), err => {
            if (err) {
                console.error(err);
                return;
            }
        });

        let textTemplate = "<br>unix:{timestamp} <span style='color:{color};font-weight:bold'>{name}</span> marked square <span style='color:{color};font-weight:bold'>{square}</span>";
        if (jsonData["remove"] == true) {
            textTemplate = "<br>unix:{timestamp} <span style='color:{color};font-weight:bold'>{name}</span> unmarked square <span style='color:black;font-weight:bold'>{square}</span>";
        }
        //{"remove": false, "type": "goal", "timestamp": 1708646923.407257, "room": "Z2PxirRLSxOV2BBAk6R1Jg", "square": {"name": "FRZ Spray 100% GRAFFITI", "colors": "green", "slot": "slot7"}, "player_color": "green", "player": {"uuid": "bdPfoIkLQbKnHSp-tuUUpw", "name": "7thace", "is_spectator": false, "color": "green"}, "color": "green"}
        let outText = textTemplate.replaceAll("{color}", userColor).replaceAll("{name}", user).replaceAll("{square}", squareText).replaceAll("{timestamp}", new Date().getTime());

        fs.appendFile('chatlog.txt', outText, err => {
            if (err) {
                console.error(err);
                return;
            }
        });
    }
}

function clearChatLog() {
    fs.writeFile('chatlog.txt', "[SYS] Start of chat log.", err => {
        if (err) {
            console.error(err);
            return;
        }
    });
}

// req 2
function next_request(path, cookie) {
	var opt = {
	  host: 'bingosync.com',
	  path: path,
	  port: '443',
	  method: 'GET',
	  headers: {
		  'Cookie': cookie
	  }
	};
	
	callback = function(res) {
		var str = ''
		res.on('data', function(chunk) {
			str += chunk;
		});
		res.on('end', function() {
			console.log(str);
      bingosync.send(str);
		});
	}
	
	var req2 = https.request(opt, callback);
	req2.end();
}


// req 1
var options = {
  host: 'bingosync.com',
  path: '/api/join-room',
  port: '443',
  method: 'POST',
};

callback = function(response) {
  var str = ''
  //console.log(response);
  next_request(response.headers.location, response.headers['set-cookie'][0]);
  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
    console.log("Str is: " + str);
    var socketKey = JSON.parse(JSON.stringify(str)).socket_key;
    console.log("attempting the thing");
    bingosync.on("open", function open() {
        console.log("connected to bangosync");
        bingosync.send(JSON.stringify({"socket_key": socketKey}));
        console.log("maybe connected to room");
        //make a board request ONE time and then run the event updates from there
    });

    bingosync.on("message", function message(data) {
        //console.log('received: %s', data);
        //This is where the magic happens
        processWebsocketMessage(data);
    });


    bingosync.on("board-changed", function boardchange(data) {
        console.log("The board changed!");
    });
  });
}

var req = https.request(options, callback);
//This is the data we are posting, it needs to be a string or a buffer
req.write(JSON.stringify({
	"room": "Pbpf1ZonQN-Fco1-PVut_w",
	"password": "bango",
	"nickname": "ace.js",
	"is_spectator": true
}));
req.end();
