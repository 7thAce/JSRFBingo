(() => {

    // Renderer for the standings graphic.
    // standings.js handles data loading; this file owns DOM updates, backgrounds, and animations
    // Ideally for setting up nodecg you shouldn't need to go through here...
    // I am horribly sorry if you end up needing to :p

    // General flow:
    // updateConfig(config)
    //   -> sets mode visibility/background
    //
    // render(payload)
    //   -> renderStandings()
    //   -> renderRoundRobinWithWindowConfig() OR renderPlayoffMode()
    //
    // Round robin:
    //   static: renderRoundRobinWindow()
    //   cycle: renderRoundRobinScheduleCycle()

    "use strict";

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    // Background art for each supported standings mode.
    // Round-robin schedule boxes are per-column DOM elements so they can animate.
    const BACKGROUNDS = Object.freeze({
        ROUND_ROBIN_W1_5: "gfx/Standings.svg",
        ROUND_ROBIN_W6_7: "gfx/Standings.svg",
        PLAYOFFS: "gfx/StandingsPlayoffs.png"
    });

    const STANDINGS_FRAME_ROWS = Object.freeze([
        "Standings-1st",
        "Standings-2nd",
        "Standings-3rd",
        "Standings-4th",
        "Standings-5th",
        "Standings-6th",
        "Standings-7th",
        "Standings-8th"
    ]);

    const ROUND_ROBIN_ENTRY_STAGGER_MS = 220;
    const ROUND_ROBIN_PAGE_SWAP_STAGGER_MS = 0;
    const ROUND_ROBIN_ENTRY_DURATION_MS = 620;
    const ROUND_ROBIN_EXIT_DURATION_MS = 260;
    const STANDINGS_CELL_DELAY_NUDGE_MS = 300;
    const standingsApi = window.JSRFStandings = window.JSRFStandings || {};

    // -------------------------------------------------------------------------
    // Renderer factory
    // -------------------------------------------------------------------------

    standingsApi.createRenderer = function createRenderer(options = {}) {
        const logWarn = options.logWarn || console.warn.bind(console);

        // Rendering state lives here so data refreshes do not need to know how the
        // graphic animates or swaps bracket windows.
        const state = {
            config: null,
            roundRobinCycle: null,
            hasAnimatedStandingsLoad: false,
            activeBracketView: null,
            roundRobinScheduleCycle: null,
            inlineBackgrounds: new Map()
        };

        // ---------------------------------------------------------------------
        // DOM builders
        // ---------------------------------------------------------------------

        function getRequiredElement(selector, label) {
            const element = document.querySelector(selector);
            if (!element) {
                logWarn(`${label} not found.`);
                return null;
            }

            return element;
        }

        // Minimal element build for the many small display cells in this overlay.
        function createDiv(className, textContent) {
            const element = document.createElement("div");
            element.className = className;
            if (textContent !== undefined) {
                element.textContent = textContent;
            }
            return element;
        }

        const FORM_MAP = {
            W: { label: "W", class: "Win" },
            L: { label: "L", class: "Loss" }
        };

        function createFormIndicator(symbol) {
            const config = FORM_MAP[symbol] || { label: "", class: "" };
            const cell = createDiv("form-indicator", config.label);

            if (config.class) {
                cell.classList.add(config.class);
            } else {
                cell.classList.add("is-empty");
            }

            return cell;
        }

        function createTeamRow(team) {
            const row = createDiv("team");
            row.id = team.id;

            const teamIdentity = createDiv("team-id");
            teamIdentity.append(
                createDiv("team-name", team.teamName),
                createDiv("team-members", team.teamMembers)
            );

            const formSection = createDiv("form-section");
            for (const symbol of team.form) {
                formSection.appendChild(createFormIndicator(symbol));
            }

            row.append(
                teamIdentity,
                createDiv("match-record", team.matchRecord),
                createDiv("game-score", team.gameScore),
                formSection
            );

            return row;
        }

        function createRoundRobinMatch(match) {
            const row = createDiv("rr-match");
            row.append(
                createDiv("rr-team", match.team1),
                createDiv("rr-vs", ""),
                createDiv("rr-team", match.team2),
                createDiv("rr-score", match.score)
            );
            return row;
        }

        function createRoundRobinColumn(matches, roundNumber) {
            const column = document.createElement("div");
            column.className = "rr-round";
            column.appendChild(createDiv("rr-round-bg"));
            column.appendChild(createDiv("rr-round-label", `Round ${roundNumber}`));
            for (const match of matches) {
                column.appendChild(createRoundRobinMatch(match));
            }
            return column;
        }

        function createPlayoffTeamRow(teamName, score, showScore) {
            const row = createDiv("po-team-info");
            row.appendChild(createDiv("po-team", teamName));
            if (showScore) {
                row.appendChild(createDiv("po-score", String(score)));
            }
            return row;
        }

        function renderPlayoffMatch(container, match, showScore) {
            container.replaceChildren(
                createPlayoffTeamRow(match.team1, match.score1, showScore),
                createPlayoffTeamRow(match.team2, match.score2, showScore)
            );
        }

        // ---------------------------------------------------------------------
        // Animation helpers
        // ---------------------------------------------------------------------

        function getGsap() {
            if (!window.gsap) {
                logWarn("GSAP is not loaded; standings animations will be skipped.");
                return null;
            }

            return window.gsap;
        }

        const ENTRY_ANIMATIONS = Object.freeze({
            slide: {
                from: {
                    autoAlpha: 0,
                    x: 56,
                    filter: "blur(2px) brightness(1.1)",
                    textShadow: "0 0 10px rgba(241, 241, 241, 0.35)"
                },
                to: {
                    autoAlpha: 1,
                    x: 0,
                    filter: "blur(0px) brightness(1)",
                    textShadow: "0 0 0px rgba(241, 241, 241, 0)",
                    duration: 0.74,
                    ease: "power3.out",
                    clearProps: "transform,filter,textShadow,visibility"
                }
            },
            slideOvershoot: {
                from: {
                    autoAlpha: 0,
                    x: 56,
                    scale: 0.98,
                    filter: "blur(2px) brightness(1.1)",
                    textShadow: "0 0 10px rgba(241, 241, 241, 0.35)"
                },
                keyframes: [
                    {
                        autoAlpha: 1,
                        x: -10,
                        scale: 1.05,
                        filter: "blur(0px) brightness(1.08)",
                        textShadow: "0 0 8px rgba(241, 241, 241, 0.25)",
                        duration: 0.42,
                        ease: "power3.out"
                    },
                    {
                        x: 0,
                        scale: 1,
                        filter: "blur(0px) brightness(1)",
                        textShadow: "0 0 0px rgba(241, 241, 241, 0)",
                        duration: 0.22,
                        ease: "power2.out",
                        clearProps: "transform,filter,textShadow,visibility"
                    }
                ]
            },
            fade: {
                from: {
                    autoAlpha: 0
                },
                to: {
                    autoAlpha: 1,
                    duration: 0.34,
                    ease: "none",
                    clearProps: "visibility"
                }
            }
        });

        function addEntryTween(timeline, entry, animation, position, extraVars = {}) {
            const preset = ENTRY_ANIMATIONS[animation] || ENTRY_ANIMATIONS.slide;
            const tweenVars = preset.keyframes
                ? { keyframes: preset.keyframes, ...extraVars }
                : { ...preset.to, ...extraVars };

            timeline.fromTo(entry, preset.from, {
                ...tweenVars,
                overwrite: true
            }, position);
        }

        function animateEntries(entries, delayStepMs = 40, animation = "slide") {
            if (entries.length === 0) {
                return;
            }

            const gsap = getGsap();
            if (!gsap) {
                return;
            }

            gsap.killTweensOf(entries);
            addEntryTween(gsap.timeline(), entries, animation, 0, { stagger: delayStepMs / 1000 });
        }

        function animateQueuedEntries(queuedEntries) {
            if (queuedEntries.length === 0) {
                return;
            }

            const gsap = getGsap();
            if (!gsap) {
                return;
            }

            const timeline = gsap.timeline();

            for (const { entry, animation, delayMs } of queuedEntries) {
                gsap.killTweensOf(entry);
                addEntryTween(timeline, entry, animation, Math.max(0, delayMs) / 1000);
            }
        }

        function animateStandingsEntrance() {
            const rows = Array.from(document.querySelectorAll("#standings .team"));
            if (rows.length === 0) {
                return;
            }

            const queuedEntries = [];
            const rowStepMs = 248;
            const teamTextLeadMs = 62;
            const scoreLeadMs = 92;
            const scoreCellStepMs = 28;
            const formLeadMs = 112;
            const formCellStepMs = 26;

            for (const [rowIndex, row] of rows.entries()) {
                const rowDelay = rowIndex * rowStepMs;
                const frameRow = getStandingsFrameRow(rowIndex);
                if (frameRow) {
                    queuedEntries.push({
                        entry: frameRow,
                        animation: "slideOvershoot",
                        delayMs: rowDelay
                    });
                }

                const teamTextEntries = [
                    row.querySelector(".team-name"),
                    row.querySelector(".team-members")
                ].filter(Boolean);

                for (const [textIndex, entry] of teamTextEntries.entries()) {
                    queuedEntries.push({
                        entry,
                        animation: "fade",
                        delayMs: rowDelay + teamTextLeadMs + STANDINGS_CELL_DELAY_NUDGE_MS + (textIndex * scoreCellStepMs)
                    });
                }

                const scoreEntries = [
                    row.querySelector(".match-record"),
                    row.querySelector(".game-score")
                ].filter(Boolean);

                for (const [scoreIndex, entry] of scoreEntries.entries()) {
                    queuedEntries.push({
                        entry,
                        animation: "fade",
                        delayMs: rowDelay + scoreLeadMs + STANDINGS_CELL_DELAY_NUDGE_MS + (scoreIndex * scoreCellStepMs)
                    });
                }

                const formEntries = Array.from(row.querySelectorAll(".form-indicator"));
                for (const [formIndex, entry] of formEntries.entries()) {
                    queuedEntries.push({
                        entry,
                        animation: "fade",
                        delayMs: rowDelay + formLeadMs + STANDINGS_CELL_DELAY_NUDGE_MS + (formIndex * formCellStepMs)
                    });
                }
            }

            animateQueuedEntries(queuedEntries);
        }

        function getStandingsFrameRow(rowIndex) {
            const rowId = STANDINGS_FRAME_ROWS[rowIndex];
            const frame = document.querySelector(".bg-layer.is-visible .standings-frame");
            return rowId && frame ? frame.querySelector(`[id="${rowId}"]`) : null;
        }

        function animateRoundRobinEntrance() {
            const container = getRoundRobinContainer();
            if (!container) {
                return;
            }

            const visibleLayer = container.querySelector(".rr-layer.is-visible");
            if (!visibleLayer) {
                return;
            }

            animateRoundRobinLayerEntries(visibleLayer);
        }

        function animateRoundRobinLayerEntries(layer, staggerMs = ROUND_ROBIN_ENTRY_STAGGER_MS) {
            const rounds = Array.from(layer.querySelectorAll(".rr-round"));
            animateEntries(rounds, staggerMs, "slideOvershoot");
            return getStaggeredAnimationDurationMs(rounds.length, staggerMs, ROUND_ROBIN_ENTRY_DURATION_MS);
        }

        function getStaggeredAnimationDurationMs(entryCount, staggerMs, durationMs) {
            if (entryCount === 0) {
                return 0;
            }

            return ((entryCount - 1) * staggerMs) + durationMs;
        }

        function fadeOutRoundRobinLayerEntries(layer, onComplete) {
            const rounds = Array.from(layer.querySelectorAll(".rr-round"));
            const gsap = getGsap();

            if (!gsap) {
                for (const round of rounds) {
                    round.style.opacity = "0";
                    round.style.visibility = "hidden";
                }
                onComplete();
                return;
            }

            gsap.killTweensOf(rounds);
            gsap.to(rounds, {
                autoAlpha: 0,
                x: -56,
                duration: ROUND_ROBIN_EXIT_DURATION_MS / 1000,
                ease: "power2.in",
                overwrite: true,
                stagger: ROUND_ROBIN_PAGE_SWAP_STAGGER_MS / 1000,
                onComplete
            });
        }

        function animatePlayoffsEntrance() {
            const entries = Array.from(document.querySelectorAll("#playoffs .po-team, #playoffs .po-score"));
            animateEntries(entries, 62);
        }

        // ---------------------------------------------------------------------
        // Standing rows
        // ---------------------------------------------------------------------

        function renderStandings(standings) {
            const container = document.querySelector("#standings .teams");
            if (!container) {
                logWarn("Standings container not found.");
                return;
            }

            // Replace the whole list in one DOM operation.
            container.replaceChildren(...standings.map(createTeamRow));

            if (!state.hasAnimatedStandingsLoad) {
                animateStandingsEntrance();
                state.hasAnimatedStandingsLoad = true;
            }
        }

        // ---------------------------------------------------------------------
        // Shared layer helpers
        // ---------------------------------------------------------------------

        function ensureLayer(container, attributeName, attributeValue, className) {
            let layer = container.querySelector(`[${attributeName}="${attributeValue}"]`);
            if (!layer) {
                layer = createDiv(className);
                layer.dataset[attributeName.replace("data-", "").replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = attributeValue;
                container.appendChild(layer);
            }

            return layer;
        }

        function setLayerVisibility(layer, isVisible) {
            layer.classList.toggle("is-visible", isVisible);
        }

        function setLayerOpacity(layer, isVisible) {
            const gsap = getGsap();

            if (gsap) {
                gsap.killTweensOf(layer);
                gsap.set(layer, { autoAlpha: isVisible ? 1 : 0 });
            }

            setLayerVisibility(layer, isVisible);
        }

        // ---------------------------------------------------------------------
        // Round-robin rendering
        // ---------------------------------------------------------------------

        function getRoundRobinContainer() {
            return getRequiredElement("#round-robin", "Round robin container");
        }

        function ensureRoundRobinLayers() {
            const container = getRoundRobinContainer();
            if (!container) {
                return null;
            }

            return {
                container,
                primary: ensureLayer(container, "data-rr-layer", "primary", "rr-layer"),
                secondary: ensureLayer(container, "data-rr-layer", "secondary", "rr-layer")
            };
        }

        function renderRoundRobinInto(layer, rounds, startRound = 1) {
            layer.replaceChildren(...rounds.map((matches, index) => createRoundRobinColumn(matches, startRound + index)));
        }

        function setRoundRobinVisibility(isVisible) {
            const container = getRoundRobinContainer();
            if (!container) {
                return;
            }

            container.classList.toggle("is-hidden", !isVisible);
            document.querySelector(".section-title-round-robin")?.classList.toggle("is-hidden", !isVisible);
        }

        function clearRoundRobinCycle() {
            if (state.roundRobinCycle) {
                state.roundRobinCycle.kill();
                state.roundRobinCycle = null;
            }
        }

        function resetRoundRobinLayers() {
            const layers = ensureRoundRobinLayers();
            if (!layers) {
                return;
            }

            layers.primary.replaceChildren();
            layers.secondary.replaceChildren();
            setLayerOpacity(layers.primary, false);
            setLayerOpacity(layers.secondary, false);
        }

        function applyRoundRobinScheduleCycleContent(layers, backgroundLayers, windows, showLastTwo) {
            renderRoundRobinInto(layers.primary, windows.firstFive.rounds, windows.firstFive.startRound);
            renderRoundRobinInto(layers.secondary, windows.lastTwo.rounds, windows.lastTwo.startRound);
            setLayerOpacity(layers.primary, !showLastTwo);
            setLayerOpacity(layers.secondary, showLastTwo);
            setBackgroundLayer(backgroundLayers.primary, windows.firstFive.background, true, false);
            setBackgroundLayer(backgroundLayers.secondary, windows.lastTwo.background, false, false);
        }

        function renderRoundRobinWindow(rounds, background, startRound = 1) {
            const layers = ensureRoundRobinLayers();
            if (!layers) {
                return;
            }

            renderRoundRobinInto(layers.primary, rounds, startRound);
            layers.secondary.replaceChildren();
            setLayerOpacity(layers.primary, true);
            setLayerOpacity(layers.secondary, false);
            applyBackground(background);
        }

        function buildRoundRobinWindowData(rounds) {
            return {
                firstFive: {
                    rounds: rounds.slice(0, 5),
                    startRound: 1,
                    background: BACKGROUNDS.ROUND_ROBIN_W1_5
                },
                lastTwo: {
                    rounds: rounds.slice(5, 7),
                    startRound: 6,
                    background: BACKGROUNDS.ROUND_ROBIN_W6_7
                }
            };
        }

        function prepareRoundRobinScheduleCycle(layers, backgroundLayers, windows) {
            const scheduleCycle = {
                scheduleDwellMs: state.config.scheduleDwellMs,
                showLastTwo: false
            };

            applyRoundRobinScheduleCycleContent(layers, backgroundLayers, windows, scheduleCycle.showLastTwo);
            state.roundRobinScheduleCycle = scheduleCycle;
            return scheduleCycle;
        }

        function renderRoundRobinScheduleCycle(windows) {
            const layers = ensureRoundRobinLayers();
            if (!layers) {
                return;
            }

            const backgroundLayers = ensureBackgroundLayers();
            if (!backgroundLayers) {
                return;
            }

            if (state.roundRobinScheduleCycle) {
                applyRoundRobinScheduleCycleContent(layers, backgroundLayers, windows, state.roundRobinScheduleCycle.showLastTwo);
                return;
            }

            const scheduleCycle = prepareRoundRobinScheduleCycle(layers, backgroundLayers, windows);

            const runScheduleCycle = () => {
                scheduleCycle.showLastTwo = !scheduleCycle.showLastTwo;
                const incomingLayer = scheduleCycle.showLastTwo ? layers.secondary : layers.primary;
                const outgoingLayer = scheduleCycle.showLastTwo ? layers.primary : layers.secondary;

                fadeOutRoundRobinLayerEntries(outgoingLayer, () => {
                    setLayerOpacity(outgoingLayer, false);
                    setLayerOpacity(incomingLayer, true);
                    setBackgroundLayer(backgroundLayers.primary, windows.firstFive.background, true, false);
                    setBackgroundLayer(backgroundLayers.secondary, windows.lastTwo.background, false, false);

                    const entranceDurationMs = animateRoundRobinLayerEntries(incomingLayer, ROUND_ROBIN_PAGE_SWAP_STAGGER_MS);
                    scheduleRoundRobinCycle(runScheduleCycle, scheduleCycle.scheduleDwellMs + entranceDurationMs);
                });
            };

            const initialEntranceDurationMs = getStaggeredAnimationDurationMs(
                layers.primary.querySelectorAll(".rr-round").length,
                ROUND_ROBIN_ENTRY_STAGGER_MS,
                ROUND_ROBIN_ENTRY_DURATION_MS
            );

            scheduleRoundRobinCycle(runScheduleCycle, scheduleCycle.scheduleDwellMs + initialEntranceDurationMs);
        }

        function scheduleRoundRobinCycle(callback, delayMs) {
            clearRoundRobinCycle();

            const gsap = getGsap();
            if (gsap) {
                state.roundRobinCycle = gsap.delayedCall(delayMs / 1000, callback);
            } else {
                const handle = window.setTimeout(callback, delayMs);
                state.roundRobinCycle = {
                    kill: () => window.clearTimeout(handle)
                };
            }
        }

        function pickStaticRoundRobinWindow(windows) {
            return state.config.showRounds6And7Only ? windows.lastTwo : windows.firstFive;
        }

        function clearRoundRobinScheduleCycle() {
            clearRoundRobinCycle();
            state.roundRobinScheduleCycle = null;
            resetRoundRobinLayers();
            resetBackgroundLayers();
        }

        function renderRoundRobinWithWindowConfig(rounds) {
            if (rounds.length <= 5) {
                clearRoundRobinScheduleCycle();
                renderRoundRobinWindow(rounds, BACKGROUNDS.ROUND_ROBIN_W1_5);
                return;
            }

            const windows = buildRoundRobinWindowData(rounds);

            if (state.config.cycleScheduleWindows) {
                renderRoundRobinScheduleCycle(windows);
                return;
            }

            clearRoundRobinScheduleCycle();
            const activeWindow = pickStaticRoundRobinWindow(windows);
            renderRoundRobinWindow(activeWindow.rounds, activeWindow.background, activeWindow.startRound);
        }

        // ---------------------------------------------------------------------
        // Playoff rendering
        // ---------------------------------------------------------------------

        function getPlayoffsContainer() {
            return getRequiredElement("#playoffs", "Playoffs container");
        }

        function setPlayoffsVisibility(isVisible) {
            const container = getPlayoffsContainer();
            if (!container) {
                return;
            }

            container.classList.toggle("is-hidden", !isVisible);
        }

        function renderPlayoffs(playoffs) {
            const semifinal1 = document.getElementById("semifinal1");
            const semifinal2 = document.getElementById("semifinal2");
            const finals = document.getElementById("finals");
            if (!semifinal1 || !semifinal2 || !finals) {
                logWarn("Playoffs match containers not found.");
                return;
            }

            renderPlayoffMatch(semifinal1, playoffs.semiFinals[0], true);
            renderPlayoffMatch(semifinal2, playoffs.semiFinals[1], true);
            renderPlayoffMatch(finals, playoffs.finals, false);
        }

        function renderPlayoffMode(playoffs) {
            clearRoundRobinScheduleCycle();
            setRoundRobinVisibility(false);
            setPlayoffsVisibility(true);
            renderPlayoffs(playoffs);
            applyBackground(BACKGROUNDS.PLAYOFFS);
        }

        // ---------------------------------------------------------------------
        // Background rendering
        // ---------------------------------------------------------------------

        function isInlineSvgBackground(imagePath) {
            return imagePath.endsWith(".svg");
        }

        function ensureBackgroundLayers() {
            const bg = getRequiredElement("#bgdiv", "Background container");
            if (!bg) {
                return null;
            }

            return {
                bg,
                primary: ensureLayer(bg, "data-bg-layer", "primary", "bg-layer"),
                secondary: ensureLayer(bg, "data-bg-layer", "secondary", "bg-layer")
            };
        }

        function readInlineBackground(imagePath) {
            if (!state.inlineBackgrounds.has(imagePath)) {
                state.inlineBackgrounds.set(imagePath, fetch(imagePath, { cache: "no-store" }).then((response) => {
                    if (!response.ok) {
                        throw new Error(`SVG background read failed (${response.status}) at ${imagePath}`);
                    }

                    return response.text();
                }));
            }

            return state.inlineBackgrounds.get(imagePath);
        }

        function prepareStandingsFrame(svg) {
            svg.classList.add("standings-frame");
            svg.setAttribute("aria-hidden", "true");
            svg.setAttribute("focusable", "false");

            const gsap = window.gsap;
            if (!gsap) {
                return;
            }

            const rows = getStandingsFrameRows(svg);
            gsap.killTweensOf(rows);
            gsap.set(rows, { autoAlpha: state.hasAnimatedStandingsLoad ? 1 : 0, x: 0, clearProps: "transform,filter" });
        }

        function getStandingsFrameRows(root = document) {
            if (!root) {
                return [];
            }

            return STANDINGS_FRAME_ROWS
                .map((rowId) => root.querySelector(`[id="${rowId}"]`))
                .filter(Boolean);
        }

        function setRasterBackgroundLayer(layer, imagePath) {
            layer.replaceChildren();
            layer.classList.remove("has-inline-svg");
            layer.style.backgroundImage = `url("${imagePath}")`;
        }

        function setInlineBackgroundLayer(layer, imagePath) {
            layer.style.backgroundImage = "";
            layer.classList.add("has-inline-svg");

            if (layer.dataset.imagePath === imagePath && layer.querySelector(".standings-frame")) {
                return;
            }

            readInlineBackground(imagePath)
                .then((svgText) => {
                    if (layer.dataset.imagePath !== imagePath) {
                        return;
                    }

                    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
                    const svg = doc.documentElement;
                    if (!svg || svg.nodeName.toLowerCase() !== "svg") {
                        throw new Error(`Inline background is not an SVG at ${imagePath}`);
                    }

                    const importedSvg = document.importNode(svg, true);
                    prepareStandingsFrame(importedSvg);
                    layer.replaceChildren(importedSvg);

                    if (state.hasAnimatedStandingsLoad) {
                        animateStandingsFrameRows();
                    }
                })
                .catch((error) => {
                    logWarn("Inline standings background failed; falling back to image background.", error);
                    if (layer.dataset.imagePath === imagePath) {
                        setRasterBackgroundLayer(layer, imagePath);
                    }
                });
        }

        function setBackgroundLayer(layer, imagePath, isVisible) {
            layer.dataset.imagePath = imagePath;

            if (isInlineSvgBackground(imagePath)) {
                setInlineBackgroundLayer(layer, imagePath);
            } else {
                setRasterBackgroundLayer(layer, imagePath);
            }

            const gsap = getGsap();

            if (gsap) {
                gsap.killTweensOf(layer);
                gsap.set(layer, { autoAlpha: isVisible ? 1 : 0 });
            }

            layer.classList.toggle("is-visible", isVisible);
        }

        function animateStandingsFrameRows() {
            const frameRows = getStandingsFrameRows(document.querySelector(".bg-layer.is-visible .standings-frame"));
            const queuedEntries = frameRows.map((entry, rowIndex) => ({
                entry,
                animation: "slideOvershoot",
                delayMs: rowIndex * 248
            }));

            animateQueuedEntries(queuedEntries);
        }

        // Immediate background swap.
        function applyBackground(imagePath) {
            const layers = ensureBackgroundLayers();
            if (!layers) {
                return;
            }

            setBackgroundLayer(layers.primary, imagePath, true);
            setBackgroundLayer(layers.secondary, imagePath, false);
        }

        function resetBackgroundLayers() {
            const layers = ensureBackgroundLayers();
            if (!layers) {
                return;
            }

            clearBackgroundLayer(layers.primary);
            clearBackgroundLayer(layers.secondary);
        }

        function clearBackgroundLayer(layer) {
            const gsap = getGsap();

            if (gsap) {
                gsap.killTweensOf(layer);
                gsap.set(layer, { autoAlpha: 0 });
            }

            layer.style.backgroundImage = "";
            layer.replaceChildren();
            delete layer.dataset.imagePath;
            layer.classList.remove("has-inline-svg");
            layer.classList.remove("is-visible");
        }

        // ---------------------------------------------------------------------
        // Public renderer API
        // ---------------------------------------------------------------------

        function updateConfig(newConfig) {
            state.config = newConfig;
            clearRoundRobinScheduleCycle();
            setRoundRobinVisibility(newConfig.showRoundRobin);
            setPlayoffsVisibility(!newConfig.showRoundRobin);
            applyBackground(newConfig.showRoundRobin ? BACKGROUNDS.ROUND_ROBIN_W1_5 : BACKGROUNDS.PLAYOFFS);
        }

        // Main render coordinator: standings first, then either schedule or playoff mode.
        function render(payload) {
            const nextBracketView = state.config.showRoundRobin ? "roundRobin" : "playoffs";
            const bracketViewChanged = state.activeBracketView !== nextBracketView;

            renderStandings(payload.standings);
            if (!state.config.showRoundRobin) {
                renderPlayoffMode(payload.playoffs);
                if (bracketViewChanged) {
                    animatePlayoffsEntrance();
                }
                state.activeBracketView = nextBracketView;
                return;
            }

            setRoundRobinVisibility(true);
            setPlayoffsVisibility(false);
            renderRoundRobinWithWindowConfig(payload.rounds);
            if (bracketViewChanged) {
                animateRoundRobinEntrance();
            }
            state.activeBracketView = nextBracketView;
        }

        return {
            render,
            updateConfig
        };
    };
})();
