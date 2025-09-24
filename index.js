/**
 * a javascript version of $('document').ready
 * http://stackoverflow.com/questions/9899372/pure-javascript-equivalent-to-jquerys-ready-how-to-call-a-function-when-the
 * @param {function} f
 */
function onDocumentReady(f) {
    /in/.test(document.readyState) ? setTimeout("onDocumentReady(" + f + ")", 9) : f();
}

onDocumentReady(function () {
    const canvas = document.getElementById("myGLCanvas");
    const gameLoop = new GameOfLife(canvas);

    setCanvasDimensions(canvas);  //have to do this first or webGL draws on a tiny canvas

    canvas.addEventListener('click', () => {
        gameLoop.toggleScopedCell();
    });

    const playPauseButton = document.getElementById("play-pause-button");
    playPauseButton.addEventListener('click', () => {
        if (gameLoop.getIsPaused()) {
            gameLoop.setIsPaused(false);
            playPauseButton.textContent = "Pause"
        } else {
            gameLoop.setIsPaused(true);
            playPauseButton.textContent = "Play"
        }
    });

    const applyButton = document.getElementById("apply-button");
    applyButton.addEventListener('click', () => {
        gameLoop.setGridRule(readEnteredRules());
        gameLoop.setFramesBetweenSteps(readEnteredFramesBetweenSteps());
    });

    gameLoop.run();
});

function captureCanvas() {
    const canvas = document.querySelector('#myGLCanvas');
    const imageData = canvas.toDataURL("image/png");
    const  image = document.createElement('img');
    image.src = imageData;
    document.getElementById("logo-capture").append(image)
}

function setCanvasDimensions(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = .90 * window.innerHeight;
}

/**
 * @param {HTMLInputElement} input
 * @param {number} defaultValue
 */
function parseIntegerInputOrDefault(input, defaultValue) {
    if (input.value) {
        try {
            return parseInt(input.value)
        } catch (_) {
        }
    }
    return defaultValue
}

/**
 * @returns {Rule}
 */
function readEnteredRules() {
    const el = parseIntegerInputOrDefault(document.getElementById("eL"), EL_DEFAULT);
    const eh = parseIntegerInputOrDefault(document.getElementById("eH"), EH_DEFAULT);
    const fl = parseIntegerInputOrDefault(document.getElementById("fL"), FL_DEFAULT);
    const fh = parseIntegerInputOrDefault(document.getElementById("fH"), FH_DEFAULT);
    return new Rule(el, eh, fl, fh);
}

/**
 * @returns {number}
 */
function readEnteredFramesBetweenSteps() {
    const entered = parseIntegerInputOrDefault(document.getElementById("step-delay"), FRAMES_BETWEEN_STEPS_DEFAULT);
    return Math.max(0, entered);
}
