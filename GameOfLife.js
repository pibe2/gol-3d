/**
 * Runs simulation and renders result on the given canvas
 */
class GameOfLife {

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {function|null} onTick
     */
    constructor(canvas, onTick = null) {
        this.canvas = canvas;
        this.gl = null;
        this.shaderProgram = null;

        this.cubeVertSoupBuff = null;
        this.cubeVertNormBuff = null;
        this.cubeVertColorBuff = null;
        this.cubeOutlineSoupBuff = null;
        this.cubeOutlineColorBuff = null;

        this.cube = null;
        this.cubeRegion = null;

        this.cellGrid = null;
        this.camera = null;
        this.camInteractor = null;
        this.transforms = null;
        this.unprojector = null;

        this.lightPosition = vec3.fromValues(1.0, 0.0, 0.0);
        this.ambientLightColor = vec3.fromValues(0.1, 0.1, 0.1);
        this.diffuseLightColor = vec3.fromValues(0.1, 0.1, 0.1);
        this.specularLightColor = vec3.fromValues(0.1, 0.1, 0.1);

        this.frameNumber = 0;
        this.isPaused = true;
        this.gridRule = new Rule(EL_DEFAULT, EH_DEFAULT, FL_DEFAULT, FH_DEFAULT);
        this.framesBetweenSteps = FRAMES_BETWEEN_STEPS_DEFAULT;
        this.onTick = onTick
    }

    // TODO enable simd, have to switch to typed arrays see https://groups.google.com/forum/#!topic/webgl-dev-list/S-bDCLL1u4A
    /**
     * Main game loop
     */
    run() {
        this.gl = createGLContext(this.canvas);
        // this.gl.ENABLE_SIMD = true;

        this.initSceneObjects();
        this.setupShaders();
        this.setupCubeBuffers();

        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.enable(this.gl.DEPTH_TEST);

        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.FRONT);

        this.gl.enable(this.gl.BLEND);
        this.gl.depthMask(true);

        this.tick();
    }

    tick() {
        requestAnimFrame(() => this.tick());
        this.draw();

        // slow down the simulation so we have time to observe
        if (++this.frameNumber % this.framesBetweenSteps === 0 && !this.isPaused) {
            this.animate();
            if (this.onTick) {
                this.onTick();
            }
        }
    }

    animate() {
        this.cellGrid.step(this.gridRule);
    }

    getIsPaused() {
        return this.isPaused;
    }

    /**
     * @param {boolean} isPaused
     */
    setIsPaused(isPaused) {
        this.isPaused = !!isPaused;
    }

    /**
     * @param {number} framesBetweenSteps
     */
    setFramesBetweenSteps(framesBetweenSteps) {
        this.framesBetweenSteps = framesBetweenSteps;
    }

    /**
     * @param {Rule} rule
     */
    setGridRule(rule) {
        this.gridRule = rule;
    }

    setupShaders() {
        let uniforms = [
            "uMMatrix", "uVMatrix", "uMNMatrix",    //view, model, modelNormal
            "uVNMatrix", "uPMatrix",                //viewNormal, perspective matrices
            "uLightPosition", "uAmbientLightColor",
            "uDiffuseLightColor", "uSpecularLightColor",
            "uIsSelected"
        ];
        let attribs = [
            "aVertexPosition", "aVertexNormal",
            "aVertexColor"
        ];
        this.shaderProgram = ShaderProgram.load("shader-vs", "shader-fs", attribs, uniforms, this.gl);
    }

    /**
     * @param {boolean} isSelected
     */
    uploadUniforms2Shader(isSelected) {
        this.gl.uniform3fv(this.shaderProgram.uLightPosition, this.lightPosition);
        this.gl.uniform3fv(this.shaderProgram.uAmbientLightColor, this.ambientLightColor);
        this.gl.uniform3fv(this.shaderProgram.uDiffuseLightColor, this.diffuseLightColor);
        this.gl.uniform3fv(this.shaderProgram.uSpecularLightColor, this.specularLightColor);

        this.gl.uniformMatrix3fv(this.shaderProgram.uMNMatrix, false, this.transforms.getModelNormalMatrix());
        this.gl.uniformMatrix3fv(this.shaderProgram.uVNMatrix, false, this.transforms.getViewNormalMatrix());
        this.gl.uniformMatrix4fv(this.shaderProgram.uMMatrix, false, this.transforms.getModelMatrix());
        this.gl.uniformMatrix4fv(this.shaderProgram.uVMatrix, false, this.transforms.getViewMatrix());
        this.gl.uniformMatrix4fv(this.shaderProgram.uPMatrix, false, this.transforms.getPerspectiveMatrix());

        this.gl.uniform1i(this.shaderProgram.uIsSelected, isSelected ? 1 : 0);
    }

    /**
     * setup gl buffers for the sphere and ppiped
     */
    setupCubeBuffers() {
        this.cube.setup();

        // vertex positions
        this.cubeVertSoupBuff = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertSoupBuff);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cube.verts), this.gl.STATIC_DRAW);
        this.cubeVertSoupBuff.itemSize = this.cube.verts.itemSize;
        this.cubeVertSoupBuff.numberOfItems = this.cube.verts.numberOfItems;

        // normals for lighting calculations
        this.cubeVertNormBuff = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertNormBuff);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cube.vertNorms), this.gl.STATIC_DRAW);
        this.cubeVertNormBuff.itemSize = this.cube.vertNorms.itemSize;
        this.cubeVertNormBuff.numberOfItems = this.cube.vertNorms.numberOfItems;

        // vertColors
        this.cubeVertColorBuff = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertColorBuff);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cube.vertColors), this.gl.STATIC_DRAW);
        this.cubeVertColorBuff.itemSize = this.cube.vertColors.itemSize;
        this.cubeVertColorBuff.numberOfItems = this.cube.vertColors.numberOfItems;

        // this.cube outline line vertices
        this.cubeOutlineSoupBuff = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeOutlineSoupBuff);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cube.outlineSoup), this.gl.STATIC_DRAW);
        this.cubeOutlineSoupBuff.itemSize = this.cube.outlineSoup.itemSize;
        this.cubeOutlineSoupBuff.numberOfItems = this.cube.outlineSoup.numberOfItems;

        // this.cube outline color
        this.cubeOutlineColorBuff = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeOutlineColorBuff);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cube.outlineColors), this.gl.STATIC_DRAW);
        this.cubeOutlineColorBuff.itemSize = this.cube.outlineColors.itemSize;
        this.cubeOutlineColorBuff.numberOfItems = this.cube.outlineColors.numberOfItems;
    }

    initSceneObjects() {
        const color = vec3.fromValues(0.5, 0.0, 0.0);
        const cubeSize = 1.0;

        const o = vec3.fromValues(0, 0, 0);
        const ox = vec3.fromValues(1, 0, 0);
        const oy = vec3.fromValues(0, 1, 0);
        const oz = vec3.fromValues(0, 0, 1);
        const numDivisions = 0;
        this.cube = new Parallelepiped(
            o, ox, oy, oz,
            cubeSize, cubeSize, cubeSize,
            color, numDivisions
        );
        this.cubeRegion = new ParallelepipedRegion(this.cube);
        this.cubeRegion.setup();

        const gridSize = 7;
        this.cellGrid = new CellGrid(gridSize, cubeSize);
        this.cellGrid.setup();
        this.cellGrid.setAllRandom();

        // camera, interactor
        const gridWorldCenter = this.cellGrid.getWorldCenter(vec3.create());
        const eyePt = vec3.clone(gridWorldCenter);
        const totalSize = gridSize * cubeSize * this.cellGrid.worldMarginFactor;
        eyePt[2] = -1.5 * totalSize;
        this.camera = new OrbitingCamera(eyePt, Math.PI / 4, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 200.0);
        this.camera.setFocus(gridWorldCenter);

        this.camInteractor = new CameraInteractor(this.camera, this.canvas);
        this.camInteractor.initEventHandlers();

        this.transforms = new Transforms(this.camera);
        this.unprojector = new Unprojector();
    }

    draw() {
        this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.camInteractor.updateCamera();
        this.transforms.updateViewMatrices();
        this.transforms.updatePerspectiveMatrix();

        this.drawCells();
    }

    /**
     * draw the sphere and ppiped
     */
    drawCells() {
        const mouseRay = this.unprojector.screenToWorldRay(
            this.camInteractor.getMTManager().getMouseX(),
            this.camInteractor.getMTManager().getMouseY(),
            this.gl.viewportWidth, this.gl.viewportHeight,
            this.transforms.getViewMatrix(),
            this.transforms.getPerspectiveMatrix()
        );

        let cellWorldOrigin = this.transforms.getTransVec3();
        const transMat = this.transforms.getTransMat4();

        this.cellGrid.iterateCells((cell, i, j, k) => {
            cellWorldOrigin = cell.getWorldOrigin(cellWorldOrigin);
            this.cubeRegion.setOrigin(cellWorldOrigin)
            const isSelected = this.cubeRegion.doesRayIntersect(this.camera.eyePt, mouseRay);
            if (cell.getState() === CELL_ON || isSelected) {
                this.transforms.saveModelMatrix();
                mat4.identity(transMat);
                mat4.translate(transMat, transMat, cellWorldOrigin);
                this.transforms.updateModelMatrices();

                // Bind vertex buffer
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertSoupBuff);
                this.gl.vertexAttribPointer(this.shaderProgram.aVertexPosition, this.cubeVertSoupBuff.itemSize,
                    this.gl.FLOAT, false, 0, 0);

                // Bind normal buffer
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertNormBuff);
                this.gl.vertexAttribPointer(this.shaderProgram.aVertexNormal,
                    this.cubeVertNormBuff.itemSize,
                    this.gl.FLOAT, false, 0, 0);

                // Bind color buffer
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertColorBuff);
                this.gl.vertexAttribPointer(this.shaderProgram.aVertexColor, this.cubeVertColorBuff.itemSize,
                    this.gl.FLOAT, false, 0, 0);

                this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA); // blending
                this.uploadUniforms2Shader(isSelected);
                this.gl.drawArrays(this.gl.TRIANGLES, 0, this.cubeVertSoupBuff.numberOfItems);

                this.transforms.revertModelMatrix();
            }
        });
    }

    toggleScopedCell() {
        const mouseRay = this.unprojector.screenToWorldRay(
            this.camInteractor.getMTManager().getMouseX(),
            this.camInteractor.getMTManager().getMouseY(),
            this.gl.viewportWidth, this.gl.viewportHeight,
            this.transforms.getViewMatrix(),
            this.transforms.getPerspectiveMatrix()
        );

        let cellWorldOrigin = vec3.create();
        this.cellGrid.iterateCells((cell, i, j, k) => {
            cellWorldOrigin = cell.getWorldOrigin(cellWorldOrigin);
            this.cubeRegion.setOrigin(cellWorldOrigin);
            const isSelected = this.cubeRegion.doesRayIntersect(this.camera.eyePt, mouseRay);
            if (isSelected) {
                cell.setState(cell.getState() === CELL_ON ? CELL_OFF : CELL_ON);
            }
        });
    }
}