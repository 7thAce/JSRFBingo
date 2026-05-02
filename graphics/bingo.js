// You can access the NodeCG api anytime from the `window.nodecg` object
// Or just `nodecg` for short. Like this!:
nodecg.log.info("Here we go now, on the offense.");
const WS_SOURCE = "Display"
const server_ws = new WebSocket("ws://localhost:7135");
let gameTimerTick = null;

function sendToServer(type, message) {
    server_ws.send(JSON.stringify({
        "source": WS_SOURCE,
        "timestamp": Date.now(),
        "type": type,
        "message": message
    }));
}

server_ws.onopen = () => {
    console.log("Connected to local server.");
    sendToServer("connect", "Connected");
};

server_ws.addEventListener("message", (event) => {
    let messageData = JSON.parse(event.data);
    if (messageData.type != "ping") {
        console.log(`[${messageData.type}] Received message: ${messageData}`);
    }
    switch (messageData.type) {
        case "board_update":
            console.log("Received board update: ", messageData.message);
            updateBoardVisuals(JSON.parse(messageData.message));
            break;
        case "game_state_update":
            console.log("Received game state update: ", messageData.message);
            updateGameState(JSON.parse(messageData.message));
            break;
        case "team_data_update":
            console.log("Received team data update: ", messageData.message);
            updateTeamData2(messageData.message);
            break;
        case "game_start":
            console.log("Received game start: ", messageData.message.startTime);
            handleGameStart(messageData.message.startTime);
            break;
        case "game_end":
            console.log("Received game end: ", messageData.message.endTime);
            handleGameEnd(messageData.message.endTime);
            break;
        case "score_update":
            console.log("Received score update: ", messageData.message);
            updateScores(messageData.message);
            break;
        case "ping":
            break;
        default:
            console.log("Received unknown message type: ", messageData.type);
            break;
    }

});

const teamsRep = nodecg.Replicant("teams");

teamsRep.on("change", (newTeamsData) => {
    console.log("Teams data updated: ", newTeamsData);
    // updateTeamData(newTeamsData);
});

function updateTeamData(teamsData) {
    console.log("Teams data!");
    console.log(teamsData.leftTeam);
    if (teamsData["LeftTeam"]) {
        document.getElementById("leftTeamName").textContent = teamsData.LeftTeam.displayData.name;
        document.getElementById("leftTeamScore").textContent = teamsData.LeftTeam.displayData.score;
    }
    if (teamsData["RightTeam"]) {
        document.getElementById("rightTeamName").textContent = teamsData.RightTeam.displayData.name;
        document.getElementById("rightTeamScore").textContent = teamsData.RightTeam.displayData.score;
    }
    
}

function updateTeamData2(teamsData) {
    let leftTeam = teamsData[0];
    let rightTeam = teamsData[1];
    document.getElementById("leftTeamName").textContent = leftTeam.displayData.name;
    document.getElementById("leftTeamScore").textContent = leftTeam.displayData.score;

    document.getElementById("rightTeamName").textContent = rightTeam.displayData.name;
    document.getElementById("rightTeamScore").textContent = rightTeam.displayData.score;
}

function updateBoardVisuals(boardData, teamsData) {
    for (let i = 0; i < 25; i++) {
        let rc = ArrayToGrid(i);
        let boardSquare = boardData.board[rc.row][rc.col];
        console.log(boardSquare);
        setSquareVisuals(boardSquare, rc, boardData.teams);
        setGameDataTexts(teamsData, boardData.pointsToWin, 0);
    }

    // Set score
    // const leftTeam = boardData.teams.find(t => t.id === "left");
    // const rightTeam = boardData.teams.find(t => t.id === "right");
    // document.getElementById("leftTeamScore").textContent = leftTeam ? leftTeam.score : 0;
    // document.getElementById("rightTeamScore").textContent = rightTeam ? rightTeam.score : 0;
}

function handleGameStart(startTime) {
    if (!gameTimerTick) {
        gameTimerTick = setInterval(() => {
            updateGameTime(startTime);
        }, 250);
        document.getElementById("gameTime").style.color = "#fff";
    } else {
        console.warn("Game timer already running!");
    }
}

function handleGameEnd(endTime) {
    if (gameTimerTick) {
        // updateGameTime(endTime);
        clearInterval(gameTimerTick);
        gameTimerTick = null;
    }
    document.getElementById("gameTime").style.color = "#ffbf00";
    // Style the timer.
}

function updateGameTime(timestamp) {
    // Convert timestamp to elapsed time
    let elapsed = Date.now() - timestamp;
    let minutes = Math.floor(elapsed / 60000);
    let seconds = Math.floor((elapsed % 60000) / 1000);
    document.getElementById("gameTime").textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateScores(scoreDict) {
    document.getElementById("leftTeamScore").textContent = scoreDict.leftTeamScore;
    document.getElementById("rightTeamScore").textContent = scoreDict.rightTeamScore;
}

function getContrastingTextColor(backgroundColor) {
    // Parse hex color to RGB
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance using WCAG formula
    const luminance = (channel) => {
        return channel <= 0.03928
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.4);
    };

    const L = 0.2126 * luminance(r) + 0.7152 * luminance(g) + 0.0722 * luminance(b);

    // Return white text for dark backgrounds, black text for light backgrounds
    return L > 0.5 ? "#000" : "#fff";
}

function regionMark(boardSquare) { 
    if (boardSquare.outputColor) {
        return getContrastingTextColor(boardSquare.outputColor);
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

function setSquareTextColor(boardSquare, teamsData) {
    if (boardSquare.outputColor) {
        return getContrastingTextColor(boardSquare.outputColor);
    } else {
        return "#FFF";
    }

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
    document.getElementById(`midtext${rc.row}${rc.col}`).style.color = setSquareTextColor(boardSquare, teams); // Set to contrast.
    document.getElementById(`square${rc.row}${rc.col}`).style.backgroundColor = boardSquare.outputColor;
}

/*
"teams":[{"id":"left","displayData":{"name":"","players":[],"inputColor":"","outputColor":"","outputForeColor":""},"levels":[],"ownedSquares":[],"score":0,"maxScore":0,"bingoCount":0},{"id":"right","displayData":{"name":"","players":[],"inputColor":"","outputColor":"","outputForeColor":""},"levels":[],"ownedSquares":[],"score":0,"maxScore":0,"bingoCount":0}]
*/

function setGameDataTexts(teamData, pointsToWin, startTime) {
    console.log(teamData);
    // TODO: Check if this needs to be removed, it might be done via replicant which might be unnecessary.
    updateTeamData2(teamData);

    document.getElementById("gameTime").textContent = "02:34";
    document.getElementById("pointsToWin").textContent = pointsToWin;
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
    updateBoardVisuals(gameState.board, gameState.teams);
}

function ArrayToGrid(index) {
    return {"row": Math.floor(index / 5), "col": index % 5};
}

function init() {
    console.log("Bingo panel script running!");
}

init();

