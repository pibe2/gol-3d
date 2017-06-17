function Transforms (camera) {
    this.camera = camera;
    this.cameraPos = vec3.create();
    this.modelMatrix = mat4.create();   // model->world matrix
    this.viewMatrix = mat4.create();
    this.perspectiveMatrix = mat4.create();
    this.modelNormalMatrix = mat3.create();
    this.viewNormalMatrix = mat3.create();

    this.transVec3 = vec3.create();
    this.transMat4 = mat4.create();

    this.stack = [];
}

/**
 * @param {mat3} out
 * @param {mat4} mat
 * @returns {mat3}
 */
Transforms.getNormalVersion4Mat = function (out, mat) {
    // normal matrix
    mat3.fromMat4(out, mat);
    mat3.transpose(out, out);
    mat3.invert(out, out);
    return out;
};

/**
 * @returns {mat4}
 */
Transforms.prototype.getTransMat4 = function () {
    return this.transMat4;
};

/**
 * @returns {vec3}
 */
Transforms.prototype.getTransVec3 = function () {
    return this.transVec3;
};

Transforms.prototype.updateViewMatrices = function () {
    this.camera.getViewMatrix(this.viewMatrix);
    Transforms.getNormalVersion4Mat(this.viewNormalMatrix, this.viewMatrix);
};

/**
 * @returns {mat3}
 */
Transforms.prototype.getViewNormalMatrix = function () {
    return this.viewNormalMatrix;
};

/**
 * @returns {mat4}
 */
Transforms.prototype.getViewMatrix = function () {
    return this.viewMatrix;
};

/**
 * @returns {vec3}
 */
Transforms.prototype.getCameraPosition = function () {
    return this.camera.getEyePt(this.cameraPos);
};

/**
 * apply a transform to the model matrix, using this.transMat4
 */
Transforms.prototype.updateModelMatrices = function () {
    mat4.multiply(this.modelMatrix, this.modelMatrix, this.transMat4);
    Transforms.getNormalVersion4Mat(this.modelNormalMatrix, this.modelMatrix);
};

/**
 * @returns {mat4}
 */
Transforms.prototype.getModelMatrix = function () {
    return this.modelMatrix;
};

/**
 * assumes all modifications to modelMatrix have only been performed
 * through updateModelMatrices()
 * @returns {mat3}
 */
Transforms.prototype.getModelNormalMatrix = function () {
    return this.modelNormalMatrix;
};

/**
 * @returns {mat4}
 */
Transforms.prototype.getPerspectiveMatrix = function () {
    return this.perspectiveMatrix;
};

Transforms.prototype.updatePerspectiveMatrix = function () {
    this.camera.getPerspectiveMatrix(this.perspectiveMatrix);
};

Transforms.prototype.saveModelMatrix = function () {
    var copy = mat4.clone(this.modelMatrix);
    this.stack.push(copy);
};

Transforms.prototype.revertModelMatrix = function () {
    if (this.stack.length == 0) {
        console.log("[revertModelMatrix] Attempted to pop and empty model matrix stack");
        return;
    }
    this.modelMatrix = this.stack.pop();
};
