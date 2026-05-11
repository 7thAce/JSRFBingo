const WebSocket = require('ws');
const axios = require('axios');
const { fork } = require('child_process');

const WS_SOURCE = "Game Reader";

let nodecgServer = new WebSocket("ws://localhost:7135");
let readers = [];
let teams = [];

// const ID1 = ["cedc46d4-1df3-4738-9257-58bd39124dee", "7thAce"];


function launchGameReader(multiID) {
    console.log(`Launching Game Reader for multiID: ${multiID}`);
    let gameReader = new TeamGameReader(multiID);
    sendToServer("connect", "Connected");
    readers.push(gameReader);
    // return gameReader;
}

class Player {
	name = null;

	constructor(_name) {
		this.name = _name;
	}
}

class TeamGameReader {

    players = [];
    conn = null;

    constructor(multiID) {
        console.log(`MultiID is: ${multiID}`);
        if (multiID.includes("connect=")) {
            this.multiID = multiID.split("connect=")[1];
        } else {
            this.multiID = multiID;
        }

        // Fork the child process for PeerJS
        this.child = fork(__dirname + '/test_peer.js');
        this.child.send({ multiID: this.multiID });

        this.child.on('message', (message) => {
            if (message.type === 'data') {
                this.ParseGameData(JSON.parse(message.data));
            } else if (message.type === 'connected') {
                console.log(`Connection to ${this.multiID} established in child process.`);
            } else if (message.type === 'error') {
                console.error(`Connection error in child: ${message.error}`);
            }
        });
    }
        // const peer = new Peer(null, {});
        // peer.on("open", (id) => {
        //     console.log(`Peer open with id: ${id}`);
        //     console.log(`Attempting to connect with id ${this.multiID}`);
        //     this.conn = peer.connect(this.multiID);

        //     // Set a timeout to detect stalled connections
        //     const connectionTimeout = setTimeout(() => {
        //         console.log(`Error: Connection to ${this.multiID} timed out after 10 seconds.`);
        //         // Optionally, you can retry or handle the stall here
        //     }, 10000); // 10 seconds timeout

        //     this.conn.on('open', () => {
        //         clearTimeout(connectionTimeout);
        //         console.log(`Connection to ${this.multiID} established successfully.`);
        //     });

        //     this.conn.on('error', (err) => {
        //         clearTimeout(connectionTimeout);
        //         console.error(`Connection error: ${err}`);
        //     });

        //     this.conn.on('close', () => {
        //         clearTimeout(connectionTimeout);
        //         console.log(`Connection to ${this.multiID} closed.`);
        //     });

        //     this.conn.on("data", (data) => {
        //         console.log(`Received data: ${data}`);
        //         this.ParseGameData(JSON.parse(data));
        //     });
        // });

        // peer.on("error", (err) => {
        //     console.error(`Peer error: ${err}`);
        // });

        // peer.on("disconnected", () => {
        //     console.log("Peer disconnected from server.");
        // });
    

    ParseGameData(jsonData) {
        const prefix = `Received Data - cat: ${jsonData.cat}, sub: ${jsonData.sub}, b: ${jsonData.b}, dw1: ${jsonData.dw1}, dw2: ${jsonData.dw2}, dw3: ${jsonData.dw3} -> `;
    
        switch (jsonData.cat) {
            case 0:
                console.log(prefix);
                switch (jsonData.sub) {
                    case 0:
                        console.log(`Connected`);
                        break;
                    case 1:
                        console.log(`Ping received`);
                        break;
                    case 2:
                        console.log(`Player count: ${jsonData.b}`);
                        this.players.length = jsonData.b;
                        break;
                    case 3:
                        console.log(`Set player index: ${jsonData.b}`);
                        break;
                    case 4:
                        HandlePlayerRegister(dwsToString(jsonData.dw1, jsonData.dw2, jsonData.dw3), jsonData.b, this);
                        break;
                    case 5:
                        console.log(`Tickrate set to: ${jsonData.dw1}`);
                        break;
                    case 6:
                        console.log(`Kill combo activated`);
                        HandleKillCombo(this);
                        break;
                    case 7:
                        console.log(`Load mission - Chapter: ${jsonData.dw1}, Mission: ${jsonData.dw2}, Entrance: ${jsonData.dw3}`);
                        break;
                    case 8:
                        console.log(`Recording state: ${jsonData.b}`);
                        break;
                }
                break;
            case 1:
                switch (jsonData.sub) {
                    case 0:
                        console.log(`Health restored: ${jsonData.dw1}`);
                        break;
                    case 1:
                        console.log(`Cans collected: ${jsonData.dw1}`);
                        break;
                }
                break;
            case 2:
                // console.log(prefix);
                switch (jsonData.sub) {
                    case 0:
                        // console.log(`Tag sprayed - Area: ${jsonData.dw1}, Spray: ${jsonData.dw2}, Value: ${jsonData.dw3}`);
                        HandleTagSprayed(jsonData.dw1, jsonData.dw2, jsonData.dw3, jsonData.src, this); // jsonData.b is player index, but I don't know if we need that. Maybe we do.
                        break;
                    case 1:
                        HandleSoulCollect(jsonData.dw1 + 1, jsonData.src, this);
                        break;
                    case 2:
                        console.log(`Tape collected: ${jsonData.dw1}`);
                        HandleTapeCollect(jsonData.dw1, jsonData.src, this);
                        break;
                    case 3:
                        console.log(`Soul unlocked: ${jsonData.dw1 + 1}, Area: ${jsonData.dw2}, Index: ${jsonData.dw3}`);
                        HandleSoulUnlock(jsonData.dw1 + 1, this);
                        break;
                    case 4:
                        console.log(`Character unlocked: ${jsonData.dw1}`);
                        HandleCharUnlock(jsonData.dw1, jsonData.src, this);
                        break;
                    case 5:
                        // console.log(`Progress flag changed: ${jsonData.dw1}`);
                        break;
                    case 6:
                        // console.log(`Sprays reset - Area: ${jsonData.dw1}, Start: ${jsonData.dw2}, End: ${jsonData.dw3}`);
                        break;
                }
                break;
            case 3:
                switch (jsonData.sub) {
                    case 0:
                        console.log(jsonData);
                        HandleAreaChange(jsonData.dw1, jsonData.src, this);
                        break;
                    case 1:
                        //console.log(`Movement coords - Index: ${jsonData.b}, X: ${jsonData.dw1}, Y: ${jsonData.dw2}, Z: ${jsonData.dw3}`);
                        break;
                    case 2:
                        //console.log(`Movement move - Index: ${jsonData.b}, Rotation: ${jsonData.dw1}, Speed: ${jsonData.dw2}, VSpeed: ${jsonData.dw3}`);
                        break;
                    case 3:
                        //console.log(`Ground coords - Index: ${jsonData.b}, X: ${jsonData.dw1}, Y: ${jsonData.dw2}, Z: ${jsonData.dw3}`);
                        break;
                    case 4:
                        //console.log(`Air coords - Index: ${jsonData.b}, X: ${jsonData.dw1}, Y: ${jsonData.dw2}, Z: ${jsonData.dw3}`);
                        break;
                    case 5:
                        //console.log(`Grind coords - Index: ${jsonData.b}, X: ${jsonData.dw1}, Y: ${jsonData.dw2}, Z: ${jsonData.dw3}`);
                        break;
                }
                break;
        }
    }
}

// Event Handlers

function HandlePlayerRegister(playerName, playerIndex, teamObj) {
    if (playerIndex < teamObj.players.length) {
        if (teamObj.players[playerIndex] == null) {
            teamObj.players[playerIndex] = new Player(playerName);
            console.log(`Added EXISTING player ${playerName} to team ${teamObj.name} at index ${playerIndex}`);
        } else {
            teamObj.players[playerIndex].name = playerName
            console.log(`Changed name for player ${playerIndex} to ${playerName} on team ${teamObj.name}`);
        }
    } else {
        teamObj.players.push(new Player(playerName));
        console.log(`Added NEW player ${playerName} to team ${teamObj.name} at index ${playerIndex}`);
    }
    
    const players = teams.map(team => team.players).flat();
    const playerNames = players.filter(player => player.name !== "").map(player => player.name);
    sendToServer("automarker_forward", JSON.stringify({type : "set_automark", data : {names : playerNames}}));
}

function HandleTagSprayed(levelID, graffitiID, tagID, playerIndex, teamObj) {
    // This might be a single tag and we only need it on completion.
	sendToServer("graffiti_sprayed", {
        "teamID": teamObj.multiID,
        "levelID": levelID,
        "graffitiID": graffitiID,
        "tagID": tagID,
        "player": teamObj.players[playerIndex]
    });
    // Should we error catch these?
}

function HandleSoulCollect(soulID, playerIndex, teamObj) {
    // console.log(soulID);
    // console.log(playerIndex);
    // console.log(teamObj);
    // TODO: Fix the player identification. I really want to handle that here.
    console.log(`[${GetNow()}] Player ${"7thAce"} picked up soul number ${soulID}.`);
    sendToServer("soul_collected", {
        "teamID": teamObj.multiID,
        "soulID": soulID,
        "player": "7thAce"
    });
	return;
}

function HandleTapeCollect(tapeID, playerIndex, teamObj) {
	console.log(`[${GetNow()}] Team ${teamObj.multiID} have collected tape ID ${tapeID}.`);

    sendToServer("tape_collected", {
        "teamID": teamObj.multiID,
        "tapeID": tapeID,
        "player": teamObj.players[playerIndex]
    });
	return;
}

function HandleSoulUnlock(soulNum, teamObj) {
	console.log(`[${GetNow()}] Team ${teamObj.multiID} have unlocked soul number ${soulNum}.`);
	sendToServer("soul_unlocked", {
		"teamID": teamObj.multiID,
		"soulID": soulNum
	});
	return;
}

function HandleCharUnlock(charID, playerIndex, teamObj) {
    sendToServer("char_unlocked", {
        "teamID": teamObj.multiID,
        "charID": charID,
        "player": teamObj.players[playerIndex]
    });
	return;
}

// Player Tracker?
function HandleAreaChange(levelID, playerIndex, teamObj) {
    if (playerIndex != undefined) {
        console.log("PLAYER LOCATION CHANGE INFO:");
        console.log(teamObj);
        console.log("Player index is " + playerIndex);
        sendToServer("player_location_change", {
            "teamID": teamObj.multiID,
            "levelID": levelID,
            "test": "debug",
            "player": teamObj.players[playerIndex]
        });
    } else {
    	console.log("Unknown Player Location (they haven't moved)");
	}    
    return;
}

function HandleKillCombo(teamObj) {
    sendToServer("kill_combo", {
        "teamID": teamObj.multiID
    });
    return;
}

function dwsToString(dw1, dw2, dw3) {
    function dwToBytes(dw) {
        return [dw & 0xFF, (dw >> 8) & 0xFF, (dw >> 16) & 0xFF, (dw >> 24) & 0xFF];
    }
    let allBytes = [...dwToBytes(dw1), ...dwToBytes(dw2), ...dwToBytes(dw3)];
    return String.fromCharCode(...allBytes.filter(b => b !== 0));
}

// const originalWebSocketSend = WebSocket.prototype.send;
// WebSocket.prototype.send = function (type, message) {
//     if (typeof message !== 'string') {
//         message = JSON.stringify(message);
//     }
//     wsSend = {
//         "source": WS_SOURCE,
//         "timestamp": Date.now(),
//         "type": type,
//         "message": message,
//     }
//     originalWebSocketSend.call(this, JSON.stringify(wsSend)); // Or modifiedData if applicable
// };

function sendToServer(type, message) {
    nodecgServer.send(JSON.stringify({
        "source": WS_SOURCE,
        "timestamp": Date.now(),
        "type": type,
        "message": message
    }));
}

function GetNow() {
	let rightNow = new Date();
	return rightNow.toLocaleTimeString().split(" ")[0] + "." + (rightNow.getMilliseconds() + "000").slice(0,3);
}


module.exports = {
    launchGameReader
};