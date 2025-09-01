const fs = require('fs');

const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const app = express();

let playerLocations = {};
let teamGraffiti = {};
let teamTape = {};

app.listen(3000, () => {
    console.log("Application started and Listening on port 3000");
});

// server css as static
app.use(express.static(__dirname));
app.use(express.json());
app.use(cors());

// get our app to use body parser 
app.use(bodyParser.urlencoded({
    extended: true
  }));

app.get("/", (req, res) => {
  //res.sendFile(__dirname + "/index.html");
});

app.post("/playerloc/set", (req, res) => {
    console.log("- POST: playerloc/set");
    handlePlayerLocationsUpdate(req["body"], res);
});

app.post("/graffiti/set", (req, res) => {
    console.log("- POST: graffiti/set");
    handleGraffitiUpdate(req["body"], res);

});

app.post("/mysterytape/set", (req, res) => {
    console.log("- POST: mysterytape/set");
    handleMysteryTapeUpdate(req["body"], res);
});

function handlePlayerLocationsUpdate(reqBody, res) {
    let teamName = Object.keys(body)[0];
    let playerName = Object.keys(body[teamName])[0];

    let knownTeamsArray = Object.keys(playerLocations);
    if (knownTeamsArray.includes(teamName)) {
        playerLocations[teamName][playerName] = body[teamName][playerName];
    } else {
        playerLocations[teamName] = body[teamName];
    }

    //Object.assign(playerLocations, Objectbody); // This does not need reassignment. It also "appends".
    console.log("Player Locations: ", playerLocations);
    res.send("Player location updated in server.")
}

function handleGraffitiUpdate(reqBody, res) {
    Object.assign(teamGraffiti, reqBody); // This does not need reassignment.
    res.send("Graffiti progress updated in server. " + JSON.stringify(teamGraffiti))
}

function handleMysteryTapeUpdate(reqBody, res) {
    Object.assign(teamTape, reqBody); // This does not need reassignment.
    res.send("Tape progress updated in server. " + JSON.stringify(teamTape))
}

