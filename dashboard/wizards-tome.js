// You can access the NodeCG api anytime from the `window.nodecg` object
// Or just `nodecg` for short. Like this!:
nodecg.log.info("Wizard's Tome panel script running!");
console.log("Wizard's Tome panel script running!");

function launchServer() {
    console.log("Launching server...");
    nodecg.sendMessage('launch-server');
}

function launchClient() {
    nodecg.sendMessage('launch-client');
}
