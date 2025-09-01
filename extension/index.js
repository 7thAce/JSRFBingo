const { exec } = require('child_process');

module.exports = function(nodecg) {
    nodecg.log.info("Launcher extension initialized...");
    nodecg.log.info("Reminder! I'm index.js in the extension folder!");
    ncgConfig = nodecg.bundleConfig;

    nodecg.listenFor('launch-server', () => {
        nodecg.log.info("Launching JSRF Bingo Server...");
        exec('start bundles\\jsrf-bingo-s-8\\extension\\Server\\startserver.bat', (error, stdout, stderr) => {
            if (error) {
                nodecg.log.error(`Server error: ${error}`);
                return;
            }
        });
    });

    nodecg.listenFor('launch-client', () => {
        nodecg.log.info("Launching JSRF Bingo Client...?");
        exec('start bundles\\jsrf-bingo-s-8\\extension\\Server\\launchclient.bat', (error, stdout, stderr) => {
            if (error) {
                nodecg.log.error(`Client error: ${error}`);
                return;
            }
        });
    });

    nodecg.listenFor('launch-automarker', () => {
        nodecg.log.info("Launching Automarker with parameters... TODO!");
        exec('start bundles\\jsrf-bingo-s-8\\extension\\Multinode\\launchclient.bat', (error, stdout, stderr) => {
            if (error) {
                nodecg.log.error(`Client error: ${error}`);
                return;
            }
        });
    });

    nodecg.listenFor('launch-streamlink-all', () => {
        nodecg.log.info("Launching all streamlinks!");
        exec('start bundles\\jsrf-bingo-s-8\\extension\\Multinode\\launchclient.bat', (error, stdout, stderr) => {
            if (error) {
                nodecg.log.error(`Client error: ${error}`);
                return;
            }
        });
    });

    nodecg.listenFor('launch-streamlink-poisonjam', () => {
        nodecg.log.info("Launching all streamlinks!");
        exec('start bundles\\jsrf-bingo-s-8\\extension\\Multinode\\launchclient.bat', (error, stdout, stderr) => {
            if (error) {
                nodecg.log.error(`Client error: ${error}`);
                return;
            }
        });
    });

    nodecg.listenFor('launch-streamlink-loveshockers', () => {
        nodecg.log.info("Launching all streamlinks!");
        exec('start bundles\\jsrf-bingo-s-8\\extension\\Multinode\\launchclient.bat', (error, stdout, stderr) => {
            if (error) {
                nodecg.log.error(`Client error: ${error}`);
                return;
            }
        });
    });

    nodecg.listenFor('launch-streamlink-pots', () => {
        nodecg.log.info("Launching all streamlinks!");
        exec('start bundles\\jsrf-bingo-s-8\\extension\\Multinode\\launchclient.bat', (error, stdout, stderr) => {
            if (error) {
                nodecg.log.error(`Client error: ${error}`);
                return;
            }
        });
    });

    nodecg.listenFor('launch-streamlink-doomriders', () => {
        nodecg.log.info("Launching all streamlinks!");
        exec('start bundles\\jsrf-bingo-s-8\\extension\\Multinode\\launchclient.bat', (error, stdout, stderr) => {
            if (error) {
                nodecg.log.error(`Client error: ${error}`);
                return;
            }
        });
    });

    nodecg.listenFor('launch-reader-bingosync', () => {
        nodecg.log.info("Launching Bingosync reader into room ${room_id}!");
        exec('start bundles\\jsrf-bingo-s-8\\extension\\Multinode\\launchclient.bat', (error, stdout, stderr) => {
            if (error) {
                nodecg.log.error(`Client error: ${error}`);
                return;
            }
        });
    });

    nodecg.listenFor('launch-reader-kevingo', () => {
        nodecg.log.info("Launching Kevingo reader!");
        exec('start bundles\\jsrf-bingo-s-8\\extension\\Multinode\\launchclient.bat', (error, stdout, stderr) => {
            if (error) {
                nodecg.log.error(`Client error: ${error}`);
                return;
            }
        });
    });
    // Add more listeners for other launch commands as needed
};