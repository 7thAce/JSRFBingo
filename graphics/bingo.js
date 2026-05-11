// Or just `nodecg` for short. Like this!:
nodecg.log.info("Here we go now, on the offense.");
const WS_SOURCE = "Display"
const server_ws = new WebSocket("ws://localhost:7135");
let gameTimerTick = null;
players = {};

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
        case "tape_update":
            console.log("Received tape data update: ", messageData.message);
            updateTapeData(messageData.message);
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
        case "player_location_change":
            console.log("Received location update: ", messageData.message);
            updateAllLocations(messageData.message);
            break;
        case "player_split":
            console.log("Received player split: ", messageData.message);
            displaySplitData(messageData.message);
            break;
        case "event_feed_update":
            console.log("Received event feed update: ", messageData.message);
            createGameFeed(messageData.message);
            break;
        case "square_marked":
            console.log("Received square marked: ", messageData.message);
            // updateSquareVisuals(messageData.message);
            break;
        case "game_feed":
            console.log("Received game feed event: ", messageData.message);
            createGameFeed(messageData.message);
            break;
        case "ping":
            break;
        default:
            console.log(`Received unknown message type: [${messageData.type}]`);
            break;
    }

});

class DisplayPlayer {
    location = "GarageD";
    enterTime = 0;
    name = "";

    constructor(name) {
        this.name = name;
    }
}

function updateTeamData(teamsData) {
    console.log("Teams data!");
    console.log(teamsData.leftTeam);
    if (teamsData["LeftTeam"]) {
        document.getElementById("leftTeamName").textContent = teamsData.LeftTeam.displayData.name;
        document.getElementById("leftTeamScore").textContent = teamsData.LeftTeam.score;
    }
    if (teamsData["RightTeam"]) {
        document.getElementById("rightTeamName").textContent = teamsData.RightTeam.displayData.name;
        document.getElementById("rightTeamScore").textContent = teamsData.RightTeam.score;
    }
    
}

function updateTeamData2(teamsData) {
    console.log("TEAMS DATA IS THIS BIG ANSWER")
    console.log(teamsData);
    let leftTeam = teamsData.leftTeam;
    let rightTeam = teamsData.rightTeam;
    // leftyTeam = teamsData[0];
    // rightyTeam = teamsData[1];
    // TODO: set player names
    console.log("left team is");
    console.log(leftTeam);

    console.log("right team is");
    console.log(rightTeam);


    document.querySelector(":root").style.setProperty("--left-color", leftTeam.displayData.outputColor);
    document.querySelector(":root").style.setProperty("--right-color", rightTeam.displayData.outputColor);
    const leftSvgShape = document.querySelector("#leftTeamSVG .leftColor");
    const rightSvgShape = document.querySelector("#rightTeamSVG .rightColor");
    document.querySelector("#leftTeamSVG .leftColor").style.fill = leftTeam.displayData.outputColor;
    document.querySelector("#rightTeamSVG .rightColor").style.fill = rightTeam.displayData.outputColor;
    
    document.getElementById("leftTeamName").textContent = leftTeam.displayData.name;
    document.getElementById("leftTopPlayer").textContent = leftTeam.displayData.player1.name;
    document.getElementById("leftBottomPlayer").textContent = leftTeam.displayData.player2.name;
    document.getElementById("leftTopPronouns").textContent = leftTeam.displayData.player1.pronouns;
    document.getElementById("leftBottomPronouns").textContent = leftTeam.displayData.player2.pronouns;
    document.getElementById("leftTeamScore").textContent = leftTeam.score;

    document.getElementById("rightTeamName").textContent = rightTeam.displayData.name;
    document.getElementById("rightTopPlayer").textContent = rightTeam.displayData.player1.name;
    document.getElementById("rightBottomPlayer").textContent = rightTeam.displayData.player2.name;
    document.getElementById("rightTopPronouns").textContent = rightTeam.displayData.player1.pronouns;
    document.getElementById("rightBottomPronouns").textContent = rightTeam.displayData.player2.pronouns;
    document.getElementById("rightTeamScore").textContent = rightTeam.score;

    if (players["tl"]?.name != leftTeam.displayData.player1.name) {
        players["tl"] = new DisplayPlayer(leftTeam.displayData.player1);
        players["tl"].elements = {
            location: document.getElementById("tlLocation"),
            duration: document.getElementById("tlDuration"),
            tape: document.getElementById("tlTape"),
            graffiti: document.getElementById("tlGraffiti"),
            split: document.getElementById("tlSplit")
        }
    }

    if (players["bl"]?.name != leftTeam.displayData.player2.name) {
        players["bl"] = new DisplayPlayer(leftTeam.displayData.player2);
        players["bl"].elements = {
            location: document.getElementById("blLocation"),
            duration: document.getElementById("blDuration"),
            tape: document.getElementById("blTape"),
            graffiti: document.getElementById("blGraffiti"),
            split: document.getElementById("blSplit")
        }
    }

    if (players["tr"]?.name != rightTeam.displayData.player1.name) {
        players["tr"] = new DisplayPlayer(rightTeam.displayData.player1);
        players["tr"].elements = {
            location: document.getElementById("trLocation"),
            duration: document.getElementById("trDuration"),
            tape: document.getElementById("trTape"),
            graffiti: document.getElementById("trGraffiti"),
            split: document.getElementById("trSplit")
        }
    }

    if (players["br"]?.name != rightTeam.displayData.player2.name) {
        players["br"] = new DisplayPlayer(rightTeam.displayData.player2);
        players["br"].elements = {
            location: document.getElementById("brLocation"),
            duration: document.getElementById("brDuration"),
            tape: document.getElementById("brTape"),
            graffiti: document.getElementById("brGraffiti"),
            split: document.getElementById("brSplit")
        }
    }

    console.log("After updateTeamsData:");
    console.log(players);

    displayPlayerLocations();
}

function updateBoardVisuals(boardData, teamsData) {
    console.log("UBV teams data is");
    console.group(teamsData);
    for (let i = 0; i < 25; i++) {
        let rc = ArrayToGrid(i);
        let boardSquare = boardData.board[rc.row][rc.col];
        setSquareVisuals(boardSquare, rc, teamsData);
    }
    setGameDataTexts(teamsData, boardData.pointsToWin, 0);


    // Set score
    // const leftTeam = boardData.teams.find(t => t.id === "left");
    // const rightTeam = boardData.teams.find(t => t.id === "right");
    // document.getElementById("leftTeamScore").textContent = leftTeam ? leftTeam.score : 0;
    // document.getElementById("rightTeamScore").textContent = rightTeam ? rightTeam.score : 0;
}

function handleGameStart(startTime) {
    clearInterval(gameTimerTick);
    gameTimerTick = setInterval(() => {
        updateGameTime(startTime);
        updatePlayerLocationDurations();
    }, 250);
    document.getElementById("gameTime").style.color = "#fff";
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

function displayPlayerLocations() {
    Object.entries(players).forEach(([key, value]) => {
        console.log(key + " is in location " + value.location);
        document.getElementById(`${key}Location`).textContent = value.location;
    });
}

function updateScores(scoreDict) {
    document.getElementById("leftTeamScore").textContent = scoreDict.leftTeamScore;
    document.getElementById("rightTeamScore").textContent = scoreDict.rightTeamScore;
}

function createGameFeed(allEvents) {
    let innerHTML = [];
    allEvents.forEach(event => {
        if (event.sectionalArray.length > 2) { // Not Start End Pause events
            // Player data is the 2nd one
            event.sectionalArray[1] = `<style color=${event.player.displayData.outputColor}>` + event.sectionalArray[1] + "</style>";
            // We should *really* change this based on type, but we'll deal with that problem later.
            event.sectionalArray[2] = `<style color=${event.player.displayData.outputColor}>` + event.sectionalArray[2] + "</style>";
            event.sectionalArray[4] = `<style color=${event.player.displayData.outputColor}>` + event.sectionalArray[3] + "</style>";
        }
        event.outText = event.join(" ");
    });    
    innerHTML = allEvents.map(event => event.outText).join("\n");
    console.log("Game feed inner HTML is: " + innerHTML);
    document.getElementById("eventFeed").innerHTML = innerHTML;
}

function updateAllLocations(locationDict) {
    console.log("all location call");
    console.log(locationDict);
    players["tl"].location = locationDict.leftTeam.displayData.player1.location || "Pending...";
    players["bl"].location = locationDict.leftTeam.displayData.player2.location || "Pending...";
    players["tr"].location = locationDict.rightTeam.displayData.player1.location || "Pending...";
    players["br"].location = locationDict.rightTeam.displayData.player2.location || "Pending...";
    players["tl"].enterTime = locationDict.leftTeam.displayData.player1.enterTime || 1778471026142;
    players["bl"].enterTime = locationDict.leftTeam.displayData.player2.enterTime || 1778471026142;
    players["tr"].enterTime = locationDict.rightTeam.displayData.player1.enterTime || 1778471026142;
    players["br"].enterTime = locationDict.rightTeam.displayData.player2.enterTime || 1778471026142;
    updateTapeData(locationDict);
    displayPlayerLocations();
}

function updateTapeData(tapeTeamsDict) {
    if (tapeTeamsDict.leftTeam.tapeData.includes(players["tl"].location)) { 
        players["tl"].elements.tape.style.backgroundImage = "url(gfx/chevronTape.svg)";
    } else {
        players["tl"].elements.tape.style.backgroundImage = "url(gfx/chevronTape.svg)";
    }

    if (tapeTeamsDict.leftTeam.tapeData.includes(players["bl"].location)) { 
        players["bl"].elements.tape.style.backgroundImage = "url(gfx/chevronTape.svg)";
    } else {
        players["bl"].elements.tape.style.backgroundImage = "url(gfx/chevronTape.svg)";
    }

    if (tapeTeamsDict.rightTeam.tapeData.includes(players["tr"].location)) { 
        players["tr"].elements.tape.style.backgroundImage = "url(gfx/chevronTape.svg)";
    } else {
        players["tr"].elements.tape.style.backgroundImage = "url(gfx/chevronTape.svg)";
    }
    if (tapeTeamsDict.rightTeam.tapeData.includes(players["br"].location)) { 
        players["br"].elements.tape.style.backgroundImage = "url(gfx/chevronTape.svg)";
    } else {
        players["br"].elements.tape.style.backgroundImage = "url(gfx/chevronTape.svg)";
    }
}

function updatePlayerLocationDurations() {
    Object.entries(players).forEach(([key, player]) => {
        let DISPLAYTIME = 1000;
        let duration = Date.now() - player.enterTime;
        console.log(`Duration: ${duration} || Player enter time: ${player.enterTime} || Now: ${Date.now()}`);
        player.elements.duration.textContent = timestampToString(duration, "%m:%s");
        if (duration >= DISPLAYTIME && player.elements.location.textContent != "Garage") {
            player.elements.duration.classList.remove("retractedLeftShort");
        } else {
            player.elements.duration.classList.add("retractedLeftShort");
        }
        if (duration >= 15000) {
            player.elements.split.classList.add("retractedLeftShort");
        }
    });
}

function displaySplitData(splitData) {
    Object.entries(players).forEach(([key, player]) => {
        if (player.name == splitData.ahead.player) {
            player.elements.split.textContent = `First!`;
            player.elements.split.classList.remove("retractedLeftShort");
        } else if (player.name == splitData.behind.player) {
            player.elements.split.textContent = "Diff"
            player.elements.split.classList.remove("retractedLeftShort");
        }
    });
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

function timestampToString(timestampMS, dateFormat = "[%m:%s]") {
    // We're going to use a basic implementation where:
    // %m is minutes, %s is seconds, %i is milliseconds.

    let minutes = Math.floor(timestampMS / 60000);
    let seconds = Math.floor((timestampMS % 60000) / 1000);
    let milliseconds = timestampMS % 1000;
    let centiseconds = Math.round(milliseconds / 10, 0);

    minutes = String(minutes); //.padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');
    milliseconds = String(milliseconds).padStart(3, '0');
    centiseconds = String(centiseconds).padStart(2, '0');

    let dateString = dateFormat.replace("%m", minutes).replace("%s", seconds).replace("%i", milliseconds).replace("%c", centiseconds);
    return dateString;
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

function setSquareTextColor(boardSquare) {
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
    
    document.getElementById(`toptext${rc.row}${rc.col}`).textContent = topText;
    document.getElementById(`toptext${rc.row}${rc.col}`).style.color = regionMark(boardSquare);
    document.getElementById(`midtext${rc.row}${rc.col}`).textContent = midText;
    document.getElementById(`midtext${rc.row}${rc.col}`).style.color = setSquareTextColor(boardSquare); // Set to contrast.
    document.getElementById(`square${rc.row}${rc.col}`).style.backgroundColor = boardSquare.outputColor; //maybe change to class system
    animateSquareMark(rc, boardSquare.outputColor, teams);
}

function animateSquareMark(rc, outputColor, teams) {
    console.log("TEAMS IN ANIMATE");
    console.log(teams);
    if (teams.leftTeam.displayData.outputColor == outputColor) {
        document.getElementById(`square${rc.row}${rc.col}`).classList.add("squareanimationleft");
    } else if (teams.rightTeam.displayData.outputColor == outputColor) {
        document.getElementById(`square${rc.row}${rc.col}`).classList.add("squareanimationright");
    } else {
        document.getElementById(`square${rc.row}${rc.col}`).classList.remove("squareanimationleft", "squareanimationright");
    }   
}

/*
"teams":[{"id":"left","displayData":{"name":"","players":[],"inputColor":"","outputColor":"","outputForeColor":""},"levels":[],"ownedSquares":[],"score":0,"maxScore":0,"bingoCount":0},{"id":"right","displayData":{"name":"","players":[],"inputColor":"","outputColor":"","outputForeColor":""},"levels":[],"ownedSquares":[],"score":0,"maxScore":0,"bingoCount":0}]
*/

function setGameDataTexts(teamData, pointsToWin, startTime) {
    // TODO: Check if this needs to be removed, it might be done via replicant which might be unnecessary.
    updateTeamData2(teamData);

    // document.getElementById("gameTime").textContent = "02:34";
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

    // Note that this isn't good because if we change the format in one place, we won't change it here.
    // On that end, we should, in the future request the data from the server rather than GIMME ALL.
    if (gameState.inProgress) {
        if (!gameTimerTick) {
            handleGameStart(gameState.startTime);
        }
    }
    console.log("Think it's a ref");
    console.log(gameState);
    updateBoardVisuals(gameState.board, {"leftTeam": gameState.teams[0], "rightTeam": gameState.teams[1]});
    updateAllLocations({"leftTeam": gameState.teams[0], "rightTeam": gameState.teams[1]})

}

function ArrayToGrid(index) {
    return {"row": Math.floor(index / 5), "col": index % 5};
}

function init() {
    console.log("Bingo panel script running!");
}

init();

