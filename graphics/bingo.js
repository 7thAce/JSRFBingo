const WS_SOURCE = "Display"
const server_ws = new WebSocket("ws://localhost:7135");
let gameTimerTick = null;
players = {};
let DISPLAYTIME = 30000;
let MAXSPLITDIFF = 25000;


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
        case "graffiti_progress":
            console.log("Received graffiti progress update: ", messageData.message);
            handleGraffitiProgress(messageData.message);
            break;
        case "event_feed_update":
            console.log("Received event feed update: ", messageData.message);
            createGameFeed(messageData.message);
            break;
        case "match_score":
            console.log("Received match score update: ", messageData.message);
            updateMatchScore(messageData.message);
            break;
        // case "square_marked":
        //     console.log("Received square marked: ", messageData.message);
        //     handleSquareMark(messageData.message);
        //     break;
        // case "square_unmarked":
        //     console.log("Received square unmarked: ", messageData.message);
        //     handleSquareUnmark(messageData.message);
        //     break;
        case "ping":
            break;
        default:
            console.log(`Received unknown message type: [${messageData.type}]`);
            break;
    }

});

class DisplayPlayer {
    location = "Waiting...";
    enterTime = 0;
    name = "";

    constructor(name) {
        this.name = name;
    }
}

// function updateTeamData(teamsData) {
//     console.log("Teams data!");
//     console.log(teamsData.leftTeam);
//     if (teamsData["LeftTeam"]) {
//         document.getElementById("leftTeamName").textContent = teamsData.LeftTeam.displayData.name;
//         document.getElementById("leftTeamScore").textContent = teamsData.LeftTeam.score;
//     }
//     if (teamsData["RightTeam"]) {
//         document.getElementById("rightTeamName").textContent = teamsData.RightTeam.displayData.name;
//         document.getElementById("rightTeamScore").textContent = teamsData.RightTeam.score;
//     }
    
// }

function updateTeamData2(teamsData) {
    console.log("TEAMS DATA IS THIS BIG ANSWER")
    console.log(teamsData);
    let leftTeam = teamsData.leftTeam;
    let rightTeam = teamsData.rightTeam;

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
    document.getElementById("leftTeamScore").textContent = String(leftTeam.score).padStart(2, '0');
    document.getElementById("leftTopPlayer").style.color = getContrastingTextColor(leftTeam.displayData.outputColor);
    document.getElementById("leftBottomPlayer").style.color = getContrastingTextColor(leftTeam.displayData.outputColor);
    document.getElementById("leftTopPronouns").style.color = getContrastingTextColor(leftTeam.displayData.outputColor);
    document.getElementById("leftBottomPronouns").style.color = getContrastingTextColor(leftTeam.displayData.outputColor);


    document.getElementById("rightTeamName").textContent = rightTeam.displayData.name;
    document.getElementById("rightTopPlayer").textContent = rightTeam.displayData.player1.name;
    document.getElementById("rightBottomPlayer").textContent = rightTeam.displayData.player2.name;
    document.getElementById("rightTopPronouns").textContent = rightTeam.displayData.player1.pronouns;
    document.getElementById("rightBottomPronouns").textContent = rightTeam.displayData.player2.pronouns;
    document.getElementById("rightTeamScore").textContent = String(rightTeam.score).padStart(2, '0');
    document.getElementById("rightTopPlayer").style.color = getContrastingTextColor(rightTeam.displayData.outputColor);
    document.getElementById("rightBottomPlayer").style.color = getContrastingTextColor(rightTeam.displayData.outputColor);
    document.getElementById("rightTopPronouns").style.color = getContrastingTextColor(rightTeam.displayData.outputColor);
    document.getElementById("rightBottomPronouns").style.color = getContrastingTextColor(rightTeam.displayData.outputColor);

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

function updateBoardVisuals(gameData, teamsData) {
    let boardData = gameData.board;
    // console.log("UBV teams data is");
    // console.group(teamsData);
    for (let i = 0; i < 25; i++) {
        let rc = ArrayToGrid(i);
        let boardSquare = boardData.board[rc.row][rc.col];
        setSquareVisuals(boardSquare, rc, teamsData);
    }
    console.log("UBV board data is ")
    console.log(gameData);
    setGameDataTexts(boardData, teamsData, gameData.scoreToWin);

    // Set score
    // const leftTeam = boardData.teams.find(t => t.id === "left");
    // const rightTeam = boardData.teams.find(t => t.id === "right");
    // document.getElementById("leftTeamScore").textContent = leftTeam ? leftTeam.score : 0;
    // document.getElementById("rightTeamScore").textContent = rightTeam ? rightTeam.score : 0;
}

function handleGameStart(startTime) {
    console.log("start time is by game start " + startTime);
    console.log(typeof(startTime));
    clearInterval(gameTimerTick);
    gameTimerTick = setInterval(() => {
        updateGameTime(startTime);
        updatePlayerLocationDurations();
    }, 250);
    let digitElements = document.querySelectorAll(".timerDigit");
    digitElements.forEach(element => {
        element.style.color = "#fff";
    });
}

function handleGameEnd(endTime) {
    if (gameTimerTick) {
        let digitElements = document.querySelectorAll(".timerDigit");
        digitElements.forEach(element => {
            element.style.color = "#ffbf00";
        });
        clearInterval(gameTimerTick);
        gameTimerTick = null;
    }
    // Style the timer.
}

function updateGameTime(timestamp) {
    // Convert timestamp to elapsed time
    // console.log("start timestamp is " + timestamp);
    let elapsed = Date.now() - timestamp;
    let minutes = Math.floor(elapsed / 60000);
    let seconds = Math.floor((elapsed % 60000) / 1000);
    gameTimeToDigits(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
}

function gameTimeToDigits(timeString) {
    let timeArray = timeString.split("");
    document.getElementById("gameTimeDigit4").textContent = timeArray[timeArray.length - 1]
    document.getElementById("gameTimeDigit3").textContent = timeArray[timeArray.length - 2]
    document.getElementById("gameTimeDigit2").textContent = timeArray[timeArray.length - 4]
    document.getElementById("gameTimeDigit1").textContent = timeArray[timeArray.length - 5]
}

function displayPlayerLocations() {
    Object.entries(players).forEach(([key, value]) => {
        document.getElementById(`${key}Location`).textContent = value.location;
    });
}

function updateScores(scoreDict) {
    document.getElementById("leftTeamScore").textContent = String(scoreDict.leftTeamScore).padStart(2, '0');;
    document.getElementById("rightTeamScore").textContent = String(scoreDict.rightTeamScore).padStart(2, '0');;
}

function createGameFeed(allEvents) {
    console.log("Creating game feed with events:");
    console.log(allEvents);
    let innerHTML = "";
    allEvents.forEach(event => {
        console.log("Processing event:");
        console.log(event);
        if (event.sectionalArray.length > 2) {
            [topText, midText, botText] = triTextFromBaseText(event.sectionalArray[4]);
            event.sectionalArray[4] = `${topText} ${midText}`;

            if (event.sectionalArray[1] != null) {
                event.sectionalArray[1] = wrapInColorSpan(event.sectionalArray[1], event.team.displayData.outputColor);
            }
            if (event.sectionalArray[2] != null) {
                event.sectionalArray[2] = wrapInColorSpan(event.sectionalArray[2], event.team.displayData.outputColor);
            }
            if (event.sectionalArray[4] != null) {
                event.sectionalArray[4] = wrapInColorSpan(event.sectionalArray[4], event.team.displayData.outputColor);
            }
        }
        event.displayText = event.sectionalArray.filter(item => item !== null).join("\u00A0");
        if (event.displayText.length > 0) {
            innerHTML += (event.displayText + "<br>");
        }
    });
    document.getElementById("eventFeed").innerHTML = innerHTML.split("<br>").slice(-4).join("<br>");
}

function wrapInColorSpan(text, color) {
    return `<span style="font-weight: bold; color: ${color};">${text}</span>`;
}

function updateMatchScore(matchScoreData) {
    let leftTeamScore = matchScoreData.leftScore;
    let rightTeamScore = matchScoreData.rightScore;
    document.querySelector("#Bo5-L1").setAttribute("class", "neutralColor");
    document.querySelector("#Bo5-L2").setAttribute("class", "neutralColor");
    document.querySelector("#Bo5-5").setAttribute("class", "neutralColor")
    document.querySelector("#Bo5-R2").setAttribute("class", "neutralColor");
    document.querySelector("#Bo5-R1").setAttribute("class", "neutralColor");
    
    document.querySelector("#Bo3-L1").setAttribute("class", "neutralColor");
    document.querySelector("#Bo3-3").setAttribute("class", "neutralColor");
    document.querySelector("#Bo3-R1").setAttribute("class", "neutralColor");


    if (leftTeamScore >= 1) {
        document.querySelector("#Bo5-L1").setAttribute("class", "leftColor");
        document.querySelector("#Bo3-L1").setAttribute("class", "leftColor");
    }
    if (leftTeamScore >= 2) {
        document.querySelector("#Bo5-L2").setAttribute("class", "leftColor");
        document.querySelector("#Bo3-3").setAttribute("class", "leftColor");
    }
    if (leftTeamScore >= 3) {
        document.querySelector("#Bo5-5").setAttribute("class", "leftColor");
    }

    if (rightTeamScore >= 1) {
        document.querySelector("#Bo5-R1").setAttribute("class", "rightColor");
        document.querySelector("#Bo3-R1").setAttribute("class", "rightColor");
    }
    if (rightTeamScore >= 2) {
        document.querySelector("#Bo5-R2").setAttribute("class", "rightColor");
        document.querySelector("#Bo3-3").setAttribute("class", "rightColor");
    }
    if (rightTeamScore >= 3) {
        document.querySelector("#Bo5-5").setAttribute("class", "rightColor");
    }
}

function handleSquareMark(squareMarkData) {
    console.log("Received square mark event!");
    console.log(squareMarkData)
    return;
}

function handleSquareUnmark(squareUnmarkData) {
    console.log("Received square unmark event!");
    console.log(squareUnmarkData)
    return;
}

function updateAllLocations(locationDict) {
    console.log("all location call");
    console.log(locationDict);
    players["tl"].location = locationDict.leftTeam.displayData.player1.location || "Pending...";
    players["bl"].location = locationDict.leftTeam.displayData.player2.location || "Pending...";
    players["tr"].location = locationDict.rightTeam.displayData.player1.location || "Pending...";
    players["br"].location = locationDict.rightTeam.displayData.player2.location || "Pending...";
    players["tl"].enterTime = locationDict.leftTeam.displayData.player1.enterTime || 0;
    players["bl"].enterTime = locationDict.leftTeam.displayData.player2.enterTime || 0;
    players["tr"].enterTime = locationDict.rightTeam.displayData.player1.enterTime || 0;
    players["br"].enterTime = locationDict.rightTeam.displayData.player2.enterTime || 0;
    updateTapeData(locationDict);
    displayGraffitiChevron(locationDict);
    displayPlayerLocations();
}

function updateTapeData(tapeTeamsDict) {
    console.log("updating tape data!");
    console.log(tapeTeamsDict.leftTeam.tapeData);
    console.log(players["tl"].location);
    if (tapeTeamsDict.leftTeam.tapeData.includes(players["tl"].location)) { 
        players["tl"].elements.tape.style.backgroundImage = "url(gfx/chevronTape.svg)";
    } else {
        players["tl"].elements.tape.style.backgroundImage = "url(gfx/chevronNoTape.svg)";
    }

    if (tapeTeamsDict.leftTeam.tapeData.includes(players["bl"].location)) { 
        players["bl"].elements.tape.style.backgroundImage = "url(gfx/chevronTape.svg)";
    } else {
        players["bl"].elements.tape.style.backgroundImage = "url(gfx/chevronNoTape.svg)";
    }

    if (tapeTeamsDict.rightTeam.tapeData.includes(players["tr"].location)) { 
        players["tr"].elements.tape.style.backgroundImage = "url(gfx/chevronTape.svg)";
    } else {
        players["tr"].elements.tape.style.backgroundImage = "url(gfx/chevronNoTape.svg)";
    }
    if (tapeTeamsDict.rightTeam.tapeData.includes(players["br"].location)) { 
        players["br"].elements.tape.style.backgroundImage = "url(gfx/chevronTape.svg)";
    } else {
        players["br"].elements.tape.style.backgroundImage = "url(gfx/chevronNoTape.svg)";
    }
}

function updatePlayerLocationDurations() {
    if (!gameTimerTick) return;
    Object.entries(players).forEach(([key, player]) => {
        let duration = Date.now() - player.enterTime;
        if (duration > 100000000000) return;

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
    if (!gameTimerTick) return;

    Object.entries(players).forEach(([key, player]) => {
        if (player.location == "Garage") return;
        let playerData = splitData.find(p => p.player == player.name.name);
        if (playerData == undefined) {
            return;
        }

        let timeDiff =  player.enterTime - splitData[0].enterTime;
        if (timeDiff == 0) {
            player.elements.split.textContent = `First!`;
            player.elements.split.classList.remove("retractedLeftShort");
        } else{
            player.elements.split.textContent = timestampToString(timeDiff, "+%s.%c")
            player.elements.split.classList.remove("retractedLeftShort");
        }
    });
}

function handleGraffitiProgress(graffitiData) {
    displayGraffitiChevron(graffitiData);
    // displayGraffitiChevron({"leftTeam": graffitiData.leftTeam, "rightTeam": graffitiData.rightTeam, "board": graffitiData.board});
}

function displayGraffitiChevron(teamsData) {
    let leftTeam = teamsData.leftTeam;
    let rightTeam = teamsData.rightTeam;
    let board = teamsData.board; // We sneakily pass it through here to use.
    // let levelProg = leftTeam.levelProgress;
    Object.entries(players).forEach(([key, player]) => {
        if (board.graffitiList.includes(player.location)) {
            if (key.endsWith("l")) { // this is the worst implementation ever.
                levelProg = leftTeam.graffitiProgress[player.location];
            } else {
                levelProg = rightTeam.graffitiProgress[player.location];
            }
            player.elements.graffiti.classList.remove("retractedLeftLong");
            player.elements.graffiti.textContent = `${levelProg.completeGraffiti.length}/${levelProg.maxGraffiti}`;
        } else {
            player.elements.graffiti.classList.add("retractedLeftLong");
            player.elements.graffiti.textContent = `0/0`;
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

    [topText, midText, botText] = triTextFromBaseText(boardSquare["text"]);

    document.getElementById(`toptext${rc.row}${rc.col}`).textContent = topText;
    document.getElementById(`toptext${rc.row}${rc.col}`).style.color = regionMark(boardSquare);
    document.getElementById(`midtext${rc.row}${rc.col}`).textContent = midText;
    document.getElementById(`midtext${rc.row}${rc.col}`).style.color = setSquareTextColor(boardSquare); // Set to contrast.
    document.getElementById(`square${rc.row}${rc.col}`).style.backgroundColor = boardSquare.outputColor; //maybe change to class system
    if (boardSquare.isGraffiti) {
        if (getContrastingTextColor(boardSquare.outputColor) == "#000") {
            document.getElementById(`square${rc.row}${rc.col}`).classList.add("graffitiSquareInverted");
        } else {
            document.getElementById(`square${rc.row}${rc.col}`).classList.add("graffitiSquare");
        }
    } else {
        document.getElementById(`square${rc.row}${rc.col}`).classList.remove("graffitiSquare");
        document.getElementById(`square${rc.row}${rc.col}`).classList.remove("graffitiSquareInverted");
    }
    animateSquareMark(rc, boardSquare.outputColor, teams);
}

function triTextFromBaseText(baseText) {
    let topText = "N/A";
    let midText = "No Data";
    let botText = "None";

    if (baseText.includes("-")) {
        let parts = baseText.split(" - ")[0].split(" ");
        botText = parts.splice(-1)[0];
        topText = parts.join(" ");
        midText = baseText.split(" - ")[1];
    }

    if (baseText.includes("Unlock")) {
        let parts = baseText.split(" Unlock ");
        botText = "Char";
        topText = parts[0];
        midText = parts[1];
    }

    if (baseText.toLowerCase().includes("graffiti")) {
        let parts = baseText.split(" Spray 100% ")[0];
        botText = "Graf";
        topText = parts;
        midText = "100% Graffiti";
    }
    return [topText, midText, botText];
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

function setGameDataTexts(boardData, teamData, pointsToWin) {
    document.getElementById("pointsToWin").textContent = pointsToWin;
    updateTeamData2(teamData);

    let shibuyaPoints = 0;
    let koganePoints = 0;
    let bentenPoints = 0;
    let defaultPoints = 0;

    for (let i = 0; i < 25; i++) {
        let rc = ArrayToGrid(i);
        let boardSquare = boardData.board[rc.row][rc.col];
        console.log(boardSquare);
        if (boardSquare.region == "shibuya" && boardSquare.outputColor == null) {
            shibuyaPoints += boardSquare.value;
        }
        if (boardSquare.region == "benten" && boardSquare.outputColor == null) {
            bentenPoints += boardSquare.value;
        }
        if (boardSquare.region == "kogane" && boardSquare.outputColor == null) {
            koganePoints += boardSquare.value;
        }
        if (boardSquare.isDefault) {
            defaultPoints += boardSquare.value;
        }
    }
    document.getElementById("shibuyaPoints").textContent = String(shibuyaPoints).padStart(2, "0");
    document.getElementById("bentenPoints").textContent = String(bentenPoints).padStart(2, "0");
    document.getElementById("koganePoints").textContent = String(koganePoints).padStart(2, "0");
    document.getElementById("defaultPoints").textContent = String(defaultPoints).padStart(2, "0");
    // document.getElementById("gameTime").textContent = "02:34";
}

function updateGameState(gameState) {
    if (gameState.inProgress) {
        if (!gameTimerTick) {
            console.log("start time is " + gameState.startTime);
            handleGameStart(gameState.startTime);
        }
    }
    updateBoardVisuals(gameState, {"leftTeam": gameState.teams[0], "rightTeam": gameState.teams[1]});
    updateAllLocations({"leftTeam": gameState.teams[0], "rightTeam": gameState.teams[1], "board": gameState.board});
    console.log("Calling create game feed");
    createGameFeed(gameState.events);
}

function ArrayToGrid(index) {
    return {"row": Math.floor(index / 5), "col": index % 5};
}

function init() {
    console.log("Bingo panel script running!");
}

init();

