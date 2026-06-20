(() => {

    /*

        To 7thAce:
            
            Ok so! this shouldn't be too crazy, at least as long as you dont need to edit
        the rendering cause well thats a whole 'nother mess. Anyways overview:

                On dom load
                    GetConfig
                        Refresh
                            Get render payload
                                Gets Data (from server or JSON)
                                    // server unimplemented
                                    ReadJson()
                                Use raw data to build formatted / organized object
                                Return as render payload
                            Pass payload to renderer
                    
                    SetupPollInterval to call refresh per Poll. Maybe we dont need this setting to 0 will remove
            
            So ya nothing too crazy hopefully! Although I'm uncertain the exact setup we'd have for NodeCG I tried to make this
        At the least easy to understand. The renderer file didnt really get as much 'organization' treatment so if you need to
        tweak anything in there 



    */



    "use strict";

    // -------------------------------------------------------------------------
    // Config + state
    // -------------------------------------------------------------------------

    const standingsApi = window.JSRFStandings = window.JSRFStandings || {};

    // Default runtime config. Page config can override any of these values.
    // Got in the habit of using these since this is how TSH does things like
    // Have one common JS file while having an html file / browser source per player
    // (so like a P1.html and a P2.html that do the same thing but for diff players)
    // Honestly tho maybe you would just have buttons for changing the config in dashboard?
    const DEFAULT_CONFIG = Object.freeze({
        dataSource: "server", // set to server to activate server branch!
        jsonPath: "example_standings.json",
        
        // Guessing at useful variables
        serverEndpoint: "",
        pollIntervalMs: 0, // Maybe we dont need this but if not we can just keep it at 0!

        showRoundRobin: true,
        showRounds6And7Only: false,
        cycleScheduleWindows: false,
        scheduleDwellMs: 500
    });

    let config = null;
    let renderer = null;
    let pollHandle = null;
    let isRefreshing = false;

    // -------------------------------------------------------------------------
    // Data loading !!!! 
    // -------------------------------------------------------------------------

    // fawk the cache i hate caching!
    async function readJson(path) {
        const response = await fetch(path, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`JSON read failed (${response.status}) at ${path}`);
        }
        return response.json();
    }

    // Backend integration point: replace the server branch with server stuff! otherwise itll default to readJson
    async function readData() {
        if (config.dataSource === "server") {
            let serverURL = "https://jsrf.bingo/api/s8/teams/standings.json"
            const response = await fetch(serverURL);
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
                }

            const result = await response.json();
            return result;
        }

        return readJson(config.jsonPath);
    }

    // -------------------------------------------------------------------------
    // Data -> renderer payload
    // Just kinda normalized so. we can easily pass to standings-renderer
    // -------------------------------------------------------------------------

    function formatPlayers(players = []) {
        return players.join(" & ");
    }

    function abbreviateTeamName(teamName) {
        return String(teamName || "").slice(0, 3);
    }

    function buildAbbreviationMap(standings = []) {
        return new Map(standings.map((team) => [team.team, team.abbreviation]).filter(([, abbreviation]) => abbreviation));
    }

    function getTeamDisplayName(teamName, abbreviations) {
        return abbreviations.get(teamName) || abbreviateTeamName(teamName);
    }

    function normalizeForm(form) {
        const normalizeSymbol = (symbol) => String(symbol || "-").trim().toUpperCase() || "-";

        if (Array.isArray(form)) {
            return form.map(normalizeSymbol);
        }

        if (typeof form === "string") {
            return [...form].map(normalizeSymbol);
        }

        return [];
    }

    function buildTeam(team) {
        return {
            id: `team-${team.position}`,
            teamName: team.team,
            teamMembers: formatPlayers(team.players),
            matchRecord: `${team.matchWins}-${team.matchLosses}`,
            gameScore: `[${team.gameWins}-${team.gameLosses}]`,
            form: normalizeForm(team.form)
        };
    }

    function buildMatch(match, abbreviations) {
        return {
            team1: getTeamDisplayName(match.team1, abbreviations),
            team2: getTeamDisplayName(match.team2, abbreviations),
            score: `${match.score1}-${match.score2}`
        };
    }

    function buildRounds(results = {}, abbreviations) {
        return Object.values(results).map((matches) => matches.map((match) => buildMatch(match, abbreviations)));
    }

    function buildPlayoffMatch(match, abbreviateTeams = false, abbreviations = new Map()) {
        if (!match) {
            return {
                team1: "-",
                team2: "-",
                score1: "-",
                score2: "-"
            };
        }

        return {
            team1: abbreviateTeams ? getTeamDisplayName(match.team1, abbreviations) : (match.team1 || "-"),
            team2: abbreviateTeams ? getTeamDisplayName(match.team2, abbreviations) : (match.team2 || "-"),
            score1: match.score1 ?? "-",
            score2: match.score2 ?? "-"
        };
    }

    function buildPlayoffs(playoffs = {}, abbreviations) {
        const semiFinals = Array.isArray(playoffs.semiFinals) ? playoffs.semiFinals : [];

        return {
            semiFinals: [
                buildPlayoffMatch(semiFinals[0], true, abbreviations),
                buildPlayoffMatch(semiFinals[1], true, abbreviations)
            ],
            finals: buildPlayoffMatch(playoffs.finals, true, abbreviations)
        };
    }

    function buildPayload(data) {
        const standings = Array.isArray(data.standings) ? data.standings : [];
        const abbreviations = buildAbbreviationMap(standings);

        return {
            standings: standings.map(buildTeam),
            rounds: buildRounds(data.results, abbreviations),
            playoffs: buildPlayoffs(data.playoffs, abbreviations)
        };
    }

    async function loadPayload() {
        const data = await readData();
        return buildPayload(data);
    }

    // -------------------------------------------------------------------------
    // Refresh + rendering
    // A) Uses all the above to get a data payload that is formatted for rendering
    // B) Then passes that to the renderer
    // -------------------------------------------------------------------------

    function createRenderer() {
        if (!standingsApi.createRenderer) {
            throw new Error("standings-renderer.js must be loaded before standings.js.");
        }

        return standingsApi.createRenderer({
            logWarn: console.warn.bind(console)
        });
    }

    // refresh() is called once on boot, again by reload/configure, and repeatedly when pollIntervalMs > 0.
    async function refresh() {
        if (isRefreshing) {
            console.log("Standings refresh skipped because one is already in flight.");
            return;
        }

        isRefreshing = true;

        try {
            const payload = await loadPayload();
            renderer.render(payload);
            console.log(`Standings render complete via ${config.dataSource} data source.`);
        } catch (error) {
            console.error("Standings refresh failed.", error);
        } finally {
            isRefreshing = false;
        }
    }

    // setups interval for calling refresh every pollIntervalMS
    function resetPolling() {
        clearInterval(pollHandle);
        pollHandle = null;

        // Does nothing if pollInterval 0 (or less lol)
        if (config.pollIntervalMs > 0) {
            pollHandle = setInterval(refresh, config.pollIntervalMs);
        }
    }

    function configure(newConfig) {
        
        // assign config
        config = newConfig;
        standingsApi.config = newConfig;

        // Get Renderer
        renderer = renderer || createRenderer();
        renderer.updateConfig(newConfig);

        // Setup polling to call refresh every pollInterval
        resetPolling();

        console.log("Standings configured.", {
            dataSource: config.dataSource,
            pollIntervalMs: config.pollIntervalMs
        });
    }

    async function init() {
        console.log("Standings display booting.");

        try {
            configure(getConfig());
            await refresh();
        } finally {
            document.body.style.visibility = "visible";
        }
    }

    // -------------------------------------------------------------------------
    // Public hooks + boot
    // Might be helpful for dashboard i dunno im guessing
    // -------------------------------------------------------------------------

    document.addEventListener("DOMContentLoaded", () => {
        init();
    });

    // Merge window varaibles overtop of default configs
    function getConfig() {
        return {
            ...DEFAULT_CONFIG,
            ...(standingsApi.config || {})
        };
    }
})();
