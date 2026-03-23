// You can access the NodeCG api anytime from the `window.nodecg` object
// Or just `nodecg` for short. Like this!:
nodecg.log.info("Wizard's Tome panel script running!");
console.log("Wizard's Tome panel script running!");
const WS_SOURCE = "Dashboard"
const websocket = new WebSocket("ws://localhost:7135");

const teamsRep = nodecg.Replicant("teams", {defaultValue: {}, persistent: true});

websocket.onopen = () => {
    console.log("Connected to WebSocket server.");
    websocket.send("connect", "Connected");
};

websocket.onclose = () => {
    console.log("Disconnected from WebSocket server.");
};

window.addEventListener('beforeunload', () => {
    localStorage.setItem('teamDataSave', JSON.stringify(teamsRep.value));
});

window.addEventListener('load', () => {
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
});

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
    nodecg.sendMessage('launch-reader-kevingo');
}

function launchAutomarker() {
    console.log("Launching automarker...");
    const teamLeftID = document.getElementById("leftMultiLink").value;
    const teamRightID = document.getElementById("rightMultiLink").value;
    console.log(`Team Left ID: ${teamLeftID}, Team Right ID: ${teamRightID}`);
    nodecg.sendMessage('launch-automarker', {"ID1": teamLeftID, "ID2": teamRightID});
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

function saveTeamInfo(team) {
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
    teamsRep.value[`${team}Team`] = teamData;
    console.log(`Saved ${team} team info:`, teamData);
    websocket.send("team_data_update", teamsRep.value);
}

document.getElementById("saveLeftTeam").addEventListener("click", () => saveTeamInfo("Left"));
document.getElementById("saveRightTeam").addEventListener("click", () => saveTeamInfo("Right"));