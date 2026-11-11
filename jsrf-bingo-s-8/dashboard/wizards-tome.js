// You can access the NodeCG api anytime from the `window.nodecg` object
// Or just `nodecg` for short. Like this!:
nodecg.log.info("Wizard's Tome panel script running!");
console.log("Wizard's Tome panel script running!");
const WS_SOURCE = "Dashboard"
const server_ws = new WebSocket("ws://localhost:7135");

const teamsRep = nodecg.Replicant("teams", {defaultValue: {}, persistent: true});

const playerDict = {"7thAce": {"name": "7thAce", "pronouns": "she/her"},
                    "Kevin": {"name": "Kevin", "pronouns": "he/him"},
                    "Acebats": {"name": "Acebats", "pronouns": "he/him"},
                    "SylvieT": {"name": "SylvieT", "pronouns": "she/her"},
                    "jon": {"name": "jon", "pronouns": "he/him"},
                    "Yayo": {"name": "YayodelaRiva", "pronouns": "he/him"},
                    "yomsa": {"name": "yomsa", "pronouns": "she/her"},
                    "vaen": {"name": "vaen", "pronouns": "she/they"},
                    "daft7": {"name": "daft7", "pronouns": "he/him"},
                    "Miku_ds": {"name": "Miku_ds", "pronouns": "he/him"},
                    "nago": {"name": "nago", "pronouns": "she/they"},
                    "shovelclaws": {"name": "claws", "pronouns": "it/its"},
                    "nae": {"name": "Naestrinus", "pronouns": "any/all"},
                    "lohsa": {"name": "lohsa", "pronouns": "he/him"},
                    "misc": {"name": "misc", "pronouns": "he/him"},
                    "Fatalr0ck": {"name": "Fatalr0ck", "pronouns": "he/him"},
                    "flashy": {"name": "flashy", "pronouns": "he/him"},
                    "koren": {"name": "koren", "pronouns": "they/she"},
                    "SyiLenSa": {"name": "SyiLenSa", "pronouns": "he/him"},
                    "dynamight": {"name": "dynamight", "pronouns": "he/him"},
                    "LaurieDBunnykins": {"name": "LaurieBunny", "pronouns": "she/her"},
                    "bee": {"name": "bee", "pronouns": "she/her"}
                };

const teamsData = {};

server_ws.onopen = () => {
    console.log("Connected to WebSocket server.");
    sendToServer("connect", "Connected");
};

server_ws.onclose = () => {
    console.log("Disconnected from WebSocket server.");
};

server_ws.addEventListener("message", (event) => {
    let messageData = JSON.parse(event.data);
    switch (messageData["type"]) {
        case "kevingo_connected":
            console.log("Kevingo connected! Update the graphic!");
            document.getElementById("kevingoStatus").textContent = `Connected to ${messageData["message"]["url"]}`;
            return;
        case "kevingo_disconnected":
            console.log("Kevingo disconnected! Update the graphic!");
            document.getElementById("kevingoStatus").textContent = "Disconnected";
            return;
        case "peerjs_connected":
            console.log("PeerJS connected! Update the graphic!");
            document.getElementById("automarkStatus").textContent = "Connected";
            return;
        case "peerjs_disconnected":
            console.log("PeerJS disconnected! Update the graphic!");
            document.getElementById("automarkStatus").textContent = "Disconnected";
            return;
    }
});

window.addEventListener('beforeunload', () => {
    localStorage.setItem('teamDataSave', JSON.stringify(teamsData));
});

function populateTeamDropdowns() {
    const selectOptions = Object.keys(teamDict).sort();
    ["leftTeamSelect", "rightTeamSelect"].forEach((selectId) => {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">Select a team</option>';
        selectOptions.forEach((teamKey) => {
            const option = document.createElement("option");
            option.value = teamKey;
            option.textContent = teamKey;
            select.appendChild(option);
        });
    });
}

function applyTeamPreset(teamSide, teamKey) {
    const teamInfo = teamDict[teamKey];
    if (!teamInfo) return;

    const isLeft = teamSide === "left";
    const teamLabel = isLeft ? "Left" : "Right";
    const teamNameInput = document.getElementById(`${isLeft ? "left" : "right"}TeamName`);
    const topNameInput = document.getElementById(`top${teamLabel}Name`);
    const topPronounsInput = document.getElementById(`top${teamLabel}Pronouns`);
    const bottomNameInput = document.getElementById(`bottom${teamLabel}Name`);
    const bottomPronounsInput = document.getElementById(`bottom${teamLabel}Pronouns`);
    const inColorInput = document.getElementById(`${isLeft ? "left" : "right"}InColor`);
    const outColorInput = document.getElementById(`${isLeft ? "left" : "right"}OutColor`);

    if (teamNameInput) teamNameInput.value = teamInfo.name || teamKey;
    if (topNameInput) topNameInput.value = teamInfo.members?.[0]?.name || "";
    if (topPronounsInput) topPronounsInput.value = teamInfo.members?.[0]?.pronouns || "";
    if (bottomNameInput) bottomNameInput.value = teamInfo.members?.[1]?.name || "";
    if (bottomPronounsInput) bottomPronounsInput.value = teamInfo.members?.[1]?.pronouns || "";
    if (inColorInput) inColorInput.value = teamInfo.inputColor || teamInfo.bingosyncColor || "";
    if (outColorInput) outColorInput.value = teamInfo.displayColor || teamInfo.outputColor || "";

    saveTeamInfo(teamLabel);
}

window.addEventListener('load', () => {
    populateTeamDropdowns();
    const savedData = JSON.parse(localStorage.getItem('teamDataSave'));
    if (savedData) {
        if (savedData["LeftTeam"]) {
            document.getElementById("leftTeamName").value = savedData["LeftTeam"]["name"] || "";
            document.getElementById("topLeftName").value = savedData["LeftTeam"]["player1"]["name"] || "";
            document.getElementById("topLeftPronouns").value = savedData["LeftTeam"]["player1"]["pronouns"] || "";
            document.getElementById("bottomLeftName").value = savedData["LeftTeam"]["player2"]["name"] || "";
            document.getElementById("bottomLeftPronouns").value = savedData["LeftTeam"]["player2"]["pronouns"] || "";
            document.getElementById("leftInColor").value = savedData["LeftTeam"]["inputColor"] || "#FFFFFF";
            document.getElementById("leftOutColor").value = savedData["LeftTeam"]["outputColor"] || "#000000";
            document.getElementById("leftMultiLink").value = savedData["LeftTeam"]["multiLink"] || "";
        }
        if (savedData["RightTeam"]) {
            document.getElementById("rightTeamName").value = savedData["RightTeam"]["name"] || "";
            document.getElementById("topRightName").value = savedData["RightTeam"]["player1"]["name"] || "";
            document.getElementById("topRightPronouns").value = savedData["RightTeam"]["player1"]["pronouns"] || "";
            document.getElementById("bottomRightName").value = savedData["RightTeam"]["player2"]["name"] || "";
            document.getElementById("bottomRightPronouns").value = savedData["RightTeam"]["player2"]["pronouns"] || "";
            document.getElementById("rightInColor").value = savedData["RightTeam"]["inputColor"] || "#FFFFFF";
            document.getElementById("rightOutColor").value = savedData["RightTeam"]["outputColor"] || "#000000";
            document.getElementById("rightMultiLink").value = savedData["RightTeam"]["multiLink"] || "";
        }
    }
    document.getElementById("leftTeamSelect").addEventListener("change", (event) => {
        applyTeamPreset("left", event.target.value);
    });
    document.getElementById("rightTeamSelect").addEventListener("change", (event) => {
        applyTeamPreset("right", event.target.value);
    });
    document.getElementById("commentator1").addEventListener('input', (event) => {
        sendToServer("commentator_names", {"comm1": document.getElementById("commentator1").value,
                                           "comm2": document.getElementById("commentator2").value});
    });
    document.getElementById("commentator2").addEventListener('input', (event) => {
        sendToServer("commentator_names", {"comm1": document.getElementById("commentator1").value,
                                           "comm2": document.getElementById("commentator2").value});
    });
    initMatchScoreControls();
});

function initMatchScoreControls() {
    const squares = document.querySelectorAll('#matchScoreControls .match-score-square');
    squares.forEach(square => {
        square.addEventListener('click', () => {
            square.classList.add("leftFill");
            square.classList.remove("rightFill", "neutralFill");   
            sendToServer("match_score", { "leftScore": document.querySelectorAll('.leftFill').length,
                                          "rightScore": document.querySelectorAll('.rightFill').length});
        });
        square.addEventListener('contextmenu', event => {
            event.preventDefault();
            square.classList.add("rightFill");
            square.classList.remove("leftFill", "neutralFill");
            sendToServer("match_score", { "leftScore": document.querySelectorAll('.leftFill').length,
                                          "rightScore": document.querySelectorAll('.rightFill').length});
        });
        square.addEventListener('mousedown', event => {
            if (event.button === 1) {
                event.preventDefault();
            }
        });
        square.addEventListener('auxclick', (event) => {
            if (event.button !== 1) return;
            event.preventDefault();
            square.classList.add("neutralFill");
            square.classList.remove("rightFill", "leftFill");
            sendToServer("match_score", { "leftScore": document.querySelectorAll('.leftFill').length,
                                          "rightScore": document.querySelectorAll('.rightFill').length});
        });
    });
}

function sendToServer(type, message) {
    server_ws.send(JSON.stringify({
        "source": WS_SOURCE,
        "timestamp": Date.now(),
        "type": type,
        "message": message
    }));
}

function launchServer() {
    console.log("Launching server...");
    nodecg.sendMessage('launch-server');
}

function launchClient() {
    console.log("Launching client...");
    nodecg.sendMessage('launch-reader-kevingo');
}

function launchGameReader() {
    console.log("Launching Game Reader...");
    nodecg.sendMessage('launch-game-reader', {"id": document.getElementById("leftMultiLink").value});
    // nodecg.sendMessage('launch-game-reader', {"id": document.getElementById("rightMultiLink").value});
}

function launchKevingo(kevingoWSName) {
    console.log("Launching kevingo...");
    const teamLeftID = document.getElementById("leftMultiLink").value;
    const teamRightID = document.getElementById("rightMultiLink").value;
    console.log(`Team Left ID: ${teamLeftID}, Team Right ID: ${teamRightID}`);
    let vowelURL = {"bango": "wss://chat.kevcyg.net/", "bingo": "wss://chit.kevcyg.net/", "bongo": "wss://chot.kevcyg.net/", "bungo": "wss://chut.kevcyg.net/"};
    let kevingoWSURL = vowelURL[kevingoWSName];
    nodecg.sendMessage('launch-kevingo', kevingoWSURL);
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

function saveTeamInfo(teamLabel = null) {
    const teamLabels = teamLabel ? [teamLabel] : ["Left", "Right"];
    teamLabels.forEach(team => {
        const teamData = {
            name: document.getElementById(`${team.toLowerCase()}TeamName`).value,
            player1: {
                name: document.getElementById(`top${team}Name`).value,
                pronouns: document.getElementById(`top${team}Pronouns`).value,
            },
            player2: {
                name: document.getElementById(`bottom${team}Name`).value,
                pronouns: document.getElementById(`bottom${team}Pronouns`).value,
            },
            inputColor: document.getElementById(`${team.toLowerCase()}InColor`).value,
            outputColor: document.getElementById(`${team.toLowerCase()}OutColor`).value,
            multiLink: document.getElementById(`${team.toLowerCase()}MultiLink`).value,
        };
        document.querySelector(":root").style.setProperty(`--${team.toLowerCase()}-color`, teamData.outputColor);
        teamsData[`${team}Team`] = teamData;
        console.log(`Saved ${team} team info:`, teamData);
    });
    sendToServer("team_data_update", teamsData);
}

document.getElementById("saveLeftTeam").addEventListener("click", () => saveTeamInfo("Left"));
document.getElementById("saveRightTeam").addEventListener("click", () => saveTeamInfo("Right"));

const teamDict = {  "Peam Tame Nending": {"name": "Peam Tame Nending", "members": [playerDict["nago"], playerDict["flashy"]], "inputColor": "red", "displayColor": "#C42615", "acronym": "PTN"},
                    "Nyarsonists": {"name": "Nyarsonists", "members": [playerDict["nae"], playerDict["koren"]], "inputColor": "green", "displayColor": "#1C890C", "acronym": "NYA"},
                    "Generation zzz": {"name": "Generation zzz", "members": [playerDict["Kevin"], playerDict["shovelclaws"]], "inputColor": "blue", "displayColor": "#032595", "acronym": "GENZ"},
                    "Night Ninjas": {"name": "Night Ninjas", "members": [playerDict["jon"], playerDict["SyiLenSa"]], "inputColor": "purple", "displayColor": "#B831E3", "acronym": "NIN"},
                    "F.C.P.R.E.M.I.X.": {"name": "F.C.P.R.E.M.I.X.", "members": [playerDict["vaen"], playerDict["dynamight"]], "inputColor": "blue", "displayColor": "#8FAFFF", "acronym": "FCP"},
                    "Cook or be Cooked": {"name": "Cook or be Cooked", "members": [playerDict["Miku_ds"], playerDict["Fatalr0ck"]], "inputColor": "blue", "displayColor": "#EE872B", "acronym": "COOK"},
                    "no bun intended": {"name": "no bun intended", "members": [playerDict["yomsa"], playerDict["LaurieDBunnykins"]], "inputColor": "pink", "displayColor": "#FDA3CB", "acronym": "BUN"},
                    "0xSWARM": {"name": "0xSWARM", "members": [playerDict["7thAce"], playerDict["bee"]], "inputColor": "green", "displayColor": "#EFE925", "acronym": "0XS"},
                };