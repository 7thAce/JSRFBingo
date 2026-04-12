// You can access the NodeCG api anytime from the `window.nodecg` object
// Or just `nodecg` for short. Like this!:
nodecg.log.info("Here we go now, on the offense.");
const WS_SOURCE = "Display"
const server_ws = new WebSocket("ws://localhost:7135");

const originalWebSocketSend = WebSocket.prototype.send;
WebSocket.prototype.send = function (type, message) {
    wsSend = {
        "source": WS_SOURCE,
        "timestamp": Date.now(),
        "type": type,
        "message": message,
    }
    originalWebSocketSend.call(this, JSON.stringify(wsSend));
};

server_ws.onopen = () => {
    console.log("Connected to local server.");
    server_ws.send("connect", "Connected");
};

server_ws.addEventListener("message", (event) => {
    let messageData = JSON.parse(event.data);
    switch (messageData.type) {
        case "board_update":
            updateBoardVisuals(JSON.parse(messageData.message));
            break;
        case "game_state_update":
            console.log("Received game state update: ", messageData.message);
            updateGameState(JSON.parse(messageData.message));
            break;
        case "ping":
            break;
        default:
            console.log("Received unknown message type: ", messageData.type);
    }
    if (messageData.type != "ping") {
        console.log("Received message: ", messageData);
    }
});

const teamsRep = nodecg.Replicant("teams");

teamsRep.on("change", (newTeamsData) => {
    console.log("Teams data updated: ", newTeamsData);
    updateTeamData(newTeamsData);
});

function updateTeamData(teamsData) {
    if (teamsData["LeftTeam"]) {
    }
    if (teamsData["RightTeam"]) {
    }
}

function updateBoardVisuals(boardData) {
    for (let i = 0; i < 25; i++) {
        let rc = ArrayToGrid(i);
        let boardSquare = boardData.board[rc.row][rc.col];
        console.log(boardSquare);
        setSquareVisuals(boardSquare, rc, boardData.teams);
    }

    // Set score
    // const leftTeam = boardData.teams.find(t => t.id === "left");
    // const rightTeam = boardData.teams.find(t => t.id === "right");
    // document.getElementById("leftTeamScore").textContent = leftTeam ? leftTeam.score : 0;
    // document.getElementById("rightTeamScore").textContent = rightTeam ? rightTeam.score : 0;
}

function regionMark(boardSquare) { 
    if (boardSquare.outputColor) {
        return "#fff"; // TODO: Update for dark contrast.
    }

    if (boardSquare.region == "shibuya") {
        return "#16A026";
    }

    if (boardSquare.region == "kogane") {
        return "#f00";
    }

    if (boardSquare.region == "benten") {
        return "#44f";
    }

    return "#fff";
}

function setSquareVisuals(boardSquare, rc, teams) {

    let topText = "N/A";
    let midText = "No Data";
    let botText = "aaaNone";
    
    basetext = boardSquare["text"];
    console.log("Base text is " + basetext);

    if (basetext.includes("-")) {
        let parts = basetext.split(" - ")[0].split(" ");
        botText = parts.splice(-1)[0];
        topText = parts.join(" ");
        midText = basetext.split(" - ")[1];
    }

    if (basetext.includes("Unlock")) {
        let parts = basetext.split(" Unlock ");
        botText = "Char";
        topText = parts[0];
        midText = parts[1];
    }

    if (basetext.toLowerCase().includes("graffiti")) {
        let parts = basetext.split(" 100% ")[0].split(" "); //TODO: Update me to fix the BP/Sky issue.
        botText = "Graf";
        topText = parts[0];
        midText = "100% Graffiti";
    }

    console.log("Setting text for square " + rc.row + ", " + rc.col + ": " + topText + " | " + midText);        
    
    // TODO: Constrast - Format this different when we want contrast options!

    document.getElementById(`toptext${rc.row}${rc.col}`).textContent = topText;
    document.getElementById(`toptext${rc.row}${rc.col}`).style.color = regionMark(boardSquare, teams);
    document.getElementById(`midtext${rc.row}${rc.col}`).textContent = midText;
    //document.getElementById(`midtext${rc.row}${rc.col}`).style.color = regionMark(boardSquare, teams); Set to contrast.
    document.getElementById(`square${rc.row}${rc.col}`).style.backgroundColor = boardSquare.outputColor;
}

function updateGameState(gameState) {
    console.log("This is where I'd update the game state... ");
    console.log(typeof(gameState));
    // Let's break all of these down into their own functions.
    // calcGameTime(gameState.timestamp);
    // calcScoreToWin(gameState.board);
    // calcPointsPerArea(gameState.board);
    // updateGameFeed(gameState.gameFeed);
    // checkForGameSet(gameState.teams); //maybe?
    updateBoardVisuals(gameState.board);
}

function ArrayToGrid(index) {
    return {"row": Math.floor(index / 5), "col": index % 5};
}

function init() {
    console.log("Bingo panel script running!");
}

init();

