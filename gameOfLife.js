/**
 * @author pibe2
 */

// TODO: create drawable class, that includes the webgl buffers... eliminate these buffer globals

var gl;
var shaderProgram;

var cubeVertSoupBuff, cubeVertNormBuff, cubeVertColorBuff;
var cubeOutlineSoupBuff, cubeOutlineColorBuff;

var cube, cubeRegion;

var cellGrid;
var camera, camInteractor, transforms, unprojector;

var lightPosition = vec3.fromValues(1.0, 0.0, 0.0);
var ambientLightColor = vec3.fromValues(0.1, 0.1, 0.1);
var diffuseLightColor = vec3.fromValues(0.1, 0.1, 0.1);
var specularLightColor = vec3.fromValues(0.1, 0.1, 0.1);

var isSelected = 0;

function setupShaders () {
    var uniforms = [
        "uMMatrix", "uVMatrix", "uMNMatrix",    //view, model, modelNormal
        "uVNMatrix", "uPMatrix",                //viewNormal, perspective matrices
        "uLightPosition", "uAmbientLightColor",
        "uDiffuseLightColor", "uSpecularLightColor",
        "uIsSelected"
    ];
    var attribs = [
        "aVertexPosition", "aVertexNormal",
        "aVertexColor"
    ];
    shaderProgram = ShaderProgram.load("shader-vs", "shader-fs", attribs, uniforms, gl);
}

function uploadUniforms2Shader() {
    gl.uniform3fv(shaderProgram.uLightPosition, lightPosition);
    gl.uniform3fv(shaderProgram.uAmbientLightColor, ambientLightColor);
    gl.uniform3fv(shaderProgram.uDiffuseLightColor, diffuseLightColor);
    gl.uniform3fv(shaderProgram.uSpecularLightColor, specularLightColor);

    gl.uniformMatrix3fv(shaderProgram.uMNMatrix, false, transforms.getModelNormalMatrix());
    gl.uniformMatrix3fv(shaderProgram.uVNMatrix, false, transforms.getViewNormalMatrix());
    gl.uniformMatrix4fv(shaderProgram.uMMatrix, false, transforms.getModelMatrix());
    gl.uniformMatrix4fv(shaderProgram.uVMatrix, false, transforms.getViewMatrix());
    gl.uniformMatrix4fv(shaderProgram.uPMatrix, false, transforms.getPerspectiveMatrix());

    gl.uniform1i(shaderProgram.uIsSelected, isSelected);
}

/**
 * setup gl buffers for the sphere and ppiped
 */
function setupCubeBuffers () {
    cube.setup();

    // vertex positions
    cubeVertSoupBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertSoupBuff);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.verts), gl.STATIC_DRAW);
    cubeVertSoupBuff.itemSize = cube.verts.itemSize;
    cubeVertSoupBuff.numberOfItems = cube.verts.numberOfItems;

    // normals for lighting calculations
    cubeVertNormBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertNormBuff);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.vertNorms), gl.STATIC_DRAW);
    cubeVertNormBuff.itemSize = cube.vertNorms.itemSize;
    cubeVertNormBuff.numberOfItems = cube.vertNorms.numberOfItems;

    // vertColors
    cubeVertColorBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertColorBuff);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.vertColors), gl.STATIC_DRAW);
    cubeVertColorBuff.itemSize = cube.vertColors.itemSize;
    cubeVertColorBuff.numberOfItems = cube.vertColors.numberOfItems;

    // cube outline line vertices
    cubeOutlineSoupBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeOutlineSoupBuff);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.outlineSoup), gl.STATIC_DRAW);
    cubeOutlineSoupBuff.itemSize = cube.outlineSoup.itemSize;
    cubeOutlineSoupBuff.numberOfItems = cube.outlineSoup.numberOfItems;

    // cube outline color
    cubeOutlineColorBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeOutlineColorBuff);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.outlineColors), gl.STATIC_DRAW);
    cubeOutlineColorBuff.itemSize = cube.outlineColors.itemSize;
    cubeOutlineColorBuff.numberOfItems = cube.outlineColors.numberOfItems;
}

function initSceneObjects() {
    var color = vec3.fromValues(0.5, 0.0, 0.0);
    var cubeSize = 1.0;

    var o = vec3.fromValues(0, 0, 0);
    var ox = vec3.fromValues(1, 0, 0);
    var oy = vec3.fromValues(0, 1, 0);
    var oz = vec3.fromValues(0, 0, 1);
    var numDivisions = 0;
    cube = new Parallelepiped(
        o, ox, oy, oz,
        cubeSize, cubeSize, cubeSize,
        color, numDivisions
    );
    cubeRegion = new ParallelepipedRegion(cube);
    cubeRegion.setup();

    var gridSize = 7;
    var el = 6, eh = 15, fl = 12, fh = 21;

    var gridRule = new Rule(el, eh, fl, fh);
    cellGrid = new CellGrid(gridSize, cubeSize, gridRule);
    cellGrid.setup();
    cellGrid.setAllRandom();

    // camera, interactor
    var gridWorldCenter = cellGrid.getWorldCenter(vec3.create());
    var eyePt = vec3.clone(gridWorldCenter);
    var totalSize = gridSize * cubeSize * cellGrid.worldMarginFactor;
    eyePt[2] = -1.5*totalSize;
    camera = new OrbitingCamera(eyePt, Math.PI/4, gl.viewportWidth/gl.viewportHeight, 0.1, 200.0);
    camera.setFocus(gridWorldCenter);

    camInteractor = new CameraInteractor(camera, canvas);
    camInteractor.initEventHandlers();

    transforms = new Transforms(camera);
    unprojector = new Unprojector();
}

function draw() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    camInteractor.updateCamera();
    transforms.updateViewMatrices();
    transforms.updatePerspectiveMatrix();

    drawCells();
}

/**
 * draw the sphere and ppiped
 */
function drawCells () {
    var mouseRay = unprojector.screenToWorldRay(
                            camInteractor.getMTManager().getMouseX(),
                            camInteractor.getMTManager().getMouseY(),
                            gl.viewportWidth, gl.viewportHeight,
                            transforms.getViewMatrix(),
                            transforms.getPerspectiveMatrix()
    );

    var cellWorldOrigin = transforms.getTransVec3();
    var transMat = transforms.getTransMat4();

    cellGrid.iterateCells(
        function (cell, i, j, k){
            cellWorldOrigin = cell.getWorldOrigin(cellWorldOrigin);

            cubeRegion.setOrigin(cellWorldOrigin);
            //isSelected = cubeRegion.doesRayIntersect(camera.eyePt, mouseRay);
            isSelected = cubeRegion.doesLineIntersect(camera.eyePt, mouseRay);
            if(cell.getState() == CELL_ON || isSelected) {
                transforms.saveModelMatrix();
                mat4.identity(transMat);
                mat4.translate(transMat, transMat, cellWorldOrigin);
                transforms.updateModelMatrices();

                // Bind vertex buffer
                gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertSoupBuff);
                gl.vertexAttribPointer(shaderProgram.aVertexPosition, cubeVertSoupBuff.itemSize,
                    gl.FLOAT, false, 0, 0);

                // Bind normal buffer
                gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertNormBuff);
                gl.vertexAttribPointer(shaderProgram.aVertexNormal,
                    cubeVertNormBuff.itemSize,
                    gl.FLOAT, false, 0, 0);

                // Bind color buffer
                gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertColorBuff);
                gl.vertexAttribPointer(shaderProgram.aVertexColor, cubeVertColorBuff.itemSize,
                    gl.FLOAT, false, 0, 0);

                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // blending
                uploadUniforms2Shader();
                gl.drawArrays(gl.TRIANGLES, 0, cubeVertSoupBuff.numberOfItems);

                transforms.revertModelMatrix();
            }
        }
    );
}

// TODO enable simd, have to switch to typed arrays see https://groups.google.com/forum/#!topic/webgl-dev-list/S-bDCLL1u4A
function startup() {
    gl = createGLContext(canvas);
    // gl.ENABLE_SIMD = true;

    initSceneObjects();
    setupShaders();
    setupCubeBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);

    //gl.enable(gl.BLEND);
    //gl.depthMask(false);

    tick();
}

function animate() {
    this.cellGrid.step();
}

function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}
