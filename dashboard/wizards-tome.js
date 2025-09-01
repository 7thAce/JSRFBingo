// You can access the NodeCG api anytime from the `window.nodecg` object
// Or just `nodecg` for short. Like this!:
nodecg.log.info("Wizard's Tome panel script running!");
console.log("Wizard's Tome panel script running!");

function launchServer() {
    console.log("Launching server...");
    nodecg.sendMessage('launch-server');
}

function launchClient() {
    console.log("Launching client...");
    nodecg.sendMessage('launch-client');
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