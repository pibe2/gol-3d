/**
 * Created by daxterix on 11/11/16.
 */
// TODO: refactor into orbitting and non-orbitting camera mouseManagers
// TODO: REFACTOR TO MAKE CONTROLS MORE INTUITIVE WRT CAMERA DIRECTIONS

/**
 *
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 */
function MouseTurningManager(canvasWidth, canvasHeight){
    this.canvasRelMidX = canvasHeight/2;    // x is the rows
    this.canvasRelMidY = canvasWidth/2;     // y is the columns

    this.xDist2Mid = 0;
    this.yDist2Mid = 0;

    this.curX = 0;
    this.curY = 0;

    this.prevX = 0;
    this.prevY = 0;

    this.isDragging = false;

    /**
     * @returns {number}
     */
    this.getXDist2Mid = function () {
        return this.xDist2Mid;
    };

    /**
     * @returns {number}
     */
    this.getYDist2Mid = function () {
        return this.yDist2Mid;
    };

    this.getDx = function () {
        return this.dx;
    };

    this.getDy = function () {
        return this.dy;
    };

    this.getMouseX = function () {
        return this.curX;
    };

    this.getMouseY = function () {
        return this.curY;
    };

    this.setDragState = function (isDragging) {
        this.isDragging = isDragging;
    };

    /**
     *
     * @param {number} relMouseX
     * @param {number} relMouseY
     */
    this.update = function (relMouseX, relMouseY) {
        this.xDist2Mid = relMouseX - this.canvasRelMidX;
        this.yDist2Mid = relMouseY - this.canvasRelMidY;

        this.prevX = this.curX;
        this.prevY = this.curY;

        this.curX = relMouseX;
        this.curY = relMouseY;

        this.dx = this.prevX - this.curX;
        this.dy = this.prevY - this.curY;
    };

}

function CameraInteractor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;

    this.MTManager = new MouseTurningManager(canvas.height, canvas.width);
    this.freeCameraFactor = .000015;
    this.orbitCameraFactor = this.freeCameraFactor * 200;
    this.shouldMouseTurn = !(this.camera instanceof OrbitingCamera);

    this.orbitTransDist = 0.005 * this.freeCameraFactor / 0.000015;
    this.transDist = 100 * this.orbitTransDist;
    //this.transDist = 5 * 0.01 * this.freeCameraFactor / 0.000015;
    this.rotDist = 0.01;

    this.maxVel = .01;
    this.vel = 0;

    this.isShift = false;
    this.isCtrl = false;
    this.isAlt = false;
    this.pressedKeys = {};

    this.handleKeyDown = function (event) {
        this.pressedKeys[event.keyCode] = true;
    };

    this.handleKeyUp = function (event) {
        this.pressedKeys[event.keyCode] = false;
    };

    this.handleMouseWheel = function (event) {
        this.camera.translateRelZ(-.001 * event.deltaY);
    };

    this.handleMouseMove = function (event) {
        // these are mouse position RELATIVE to canvas
        this.MTManager.update(event.offsetX, event.offsetY);

        if (this.MTManager.isDragging) {
            if(this.isShift){
                this.camera.rotateZRel(this.orbitCameraFactor * this.MTManager.getDy());
            }
            else {
                this.camera.rotateYRel(this.orbitCameraFactor * this.MTManager.getDx());
                this.camera.rotateXRel(-this.orbitCameraFactor * this.MTManager.getDy());
            }
        }
    };

    this.handleMouseUp = function (event) {
        this.MTManager.setDragState(false);
    };

    this.handleMouseDown = function (event) {
        this.MTManager.setDragState(true);
        this.isShift = event.shiftKey;  //TODO: IS THIS THE RIGHT PLACE TO DO THIS
    };

    /**
     * set keyboard and mouse event handlers
     */
    this.initEventHandlers = function () {
        var self = this;
        document.onkeydown = function (event) {self.handleKeyDown(event);};
        document.onkeyup = function (event) {self.handleKeyUp(event);};
        canvas.onmousedown = function (event) {self.handleMouseDown(event);};
        canvas.onmouseup = function (event) {self.handleMouseUp(event);};
        canvas.onmousemove = function (event) {self.handleMouseMove(event);};
        canvas.onwheel = function (event) {self.handleMouseWheel(event);};
    };

    this.handleMouseTurning = function () {
        var xDist2Mid = this.MTManager.getXDist2Mid();
        var yDist2Mid = this.MTManager.getYDist2Mid();

        if (Math.abs(yDist2Mid) > 100) {
            this.camera.rotateXRel(this.freeCameraFactor * yDist2Mid);
        }
        if (Math.abs(xDist2Mid) > 100) {
            this.camera.rotateYRel(-this.freeCameraFactor * xDist2Mid);
        }
    };

    this.handleMouse = function () {
        /*
        if(this.camera instanceof OrbitingCamera) {
            return;
        }
        */
        if (this.shouldMouseTurn) {
            this.handleMouseTurning();
        }
    };

    this.updateCamera = function () {
        this.handleMouse();   // for FPS mode, non orbitting camera
        this.handleKeyboard();
    };

    /**
     * note the camera's positive x-direction is viewer's left (not right)
     * bc we're using a right-hand coord system, and camera's +z points
     * into the page
     */
    this.handleKeyboard = function () {
        if (this.pressedKeys[65]) { // key A
            this.camera.translateRelX(this.transDist);     //move left
        }
        if (this.pressedKeys[68]) { // key D
            this.camera.translateRelX(-this.transDist);       //move right
        }
        if (this.pressedKeys[83]) { // key S
            this.camera.translateRelY(-this.transDist);         //move down
        }
        if (this.pressedKeys[87]) { // key W
            this.camera.translateRelY(this.transDist);          //move up
        }
        if (this.pressedKeys[73]) { // key i
            this.camera.translateRelZ(this.transDist + this.vel);     //move forward
        }
        // if vel is on and forward button isn't pressed then move forward anyway
        else {
            this.camera.translateRelZ(this.vel);
        }
        if (this.pressedKeys[75]) { // key k
            this.camera.translateRelZ(-this.transDist);     //move backward
        }
        if (this.pressedKeys[74]) { // key j
            this.camera.rotateZRel(-this.rotDist);     //roll right
        }
        if (this.pressedKeys[76]) { // key l
            this.camera.rotateZRel(this.rotDist);    //roll left
        }
        if (this.pressedKeys[37]) { // left cursor
            this.camera.rotateYRel(this.rotDist);     //yaw
        }
        if (this.pressedKeys[39]) {  // right cursor
            this.camera.rotateYRel(-this.rotDist);    //yaw
        }
        if (this.pressedKeys[38]) {  // up cursor
            this.camera.rotateXRel(-this.rotDist);     //pitch
        }
        if (this.pressedKeys[40]) {  // down cursor
            this.camera.rotateXRel(this.rotDist);    //pitch
        }

        if (this.pressedKeys[32]) {  // spacebar
            this.vel = !this.vel * this.maxVel;      //toggle velocity
        }
        if (this.pressedKeys[86]) {      // key v
            this.shouldMouseTurn = true;    // enable mouse turning
        }
        else if(this.pressedKeys[66]) {  //key b
            this.shouldMouseTurn = false;   // disable mouse turning
        }
    };

    /**
     * @returns {MouseTurningManager}
     */
    this.getMTManager = function () {
        return this.MTManager;
    };
}
