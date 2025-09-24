//      x and y dir will then be determined by rotating the canonical x and y dirs
//      by the rotation matrix that results from rotating the canonical zdir to the given
//      viewDirection; this will clean up the setFocus method quite a bit, and less
//      parameters will need to be given to create a camera


/**
 * NOTE: camera's directions form a right hand coordinate system
 * with the +z-axis going INTO the page(this makes for an interesting interactor)
 * @param {vec3} eyePt
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspectRatio Aspect ratio. typically viewport width/height
 * @param {number} nearZ Near bound of the frustum
 * @param {number} farZ Far bound of the frustum
 * @constructor
 */
function Camera(eyePt, fovy, aspectRatio, nearZ, farZ) {
    this.eyePt = vec3.copy(vec3.create(), eyePt);
    this.relXDir = vec3.fromValues(1, 0, 0);
    this.relYDir = vec3.fromValues(0, 1, 0);
    this.relZDir = vec3.fromValues(0, 0, 1);    // look vector, forward direction
    this.viewPt = vec3.add(vec3.create(), this.eyePt, this.relZDir);
    this.fovy = fovy;
    this.aspectRatio = aspectRatio;
    this.nearZ = nearZ;
    this.farZ = farZ;
    // for computation
    this.quaternion = quat.identity(quat.create());
}

/**
 * updates view point after rotation and translation
 */
Camera.prototype.updateViewPoint = function () {
    vec3.add(this.viewPt, this.eyePt, this.relZDir);
};

/**
 * after we change the quaternion, we transform relZDir and relXDir
 * by the quaternion, and update the relXDir accordingly
 * updated_relXDir = relYDir (cross) relZDir
 */
Camera.prototype.updateAfterRotation = function () {
    vec3.transformQuat(this.relYDir, this.relYDir, this.quaternion);
    vec3.normalize(this.relYDir, this.relYDir);

    vec3.transformQuat(this.relZDir, this.relZDir, this.quaternion);
    vec3.normalize(this.relZDir, this.relZDir);

    vec3.cross(this.relXDir, this.relYDir, this.relZDir);
    vec3.normalize(this.relXDir, this.relXDir);

    this.updateViewPoint();
};

/**
 * rotate the camera by a given angle around a given unit axis
 * @param {vec3} unitAxis
 * @param {Number} rad
 */
Camera.prototype.rotateAboutAxis = function (unitAxis, rad){
    quat.setAxisAngle(this.quaternion, unitAxis, rad);
    this.updateAfterRotation();
};

/**
 * pitch camera by rad radians
 * @param {Number} rad
 */
Camera.prototype.rotateXRel = function (rad) {
    this.rotateAboutAxis(this.relXDir, rad);
};

/**
 * yaw camera by rad radians
 * @param {Number} rad
 */
Camera.prototype.rotateYRel = function (rad) {
    this.rotateAboutAxis(this.relYDir, rad);
};

/**
 * roll camera by rad riadians
 * @param {Number} rad
 */
Camera.prototype.rotateZRel = function (rad) {
    this.rotateAboutAxis(this.relZDir, rad);
};

/**
 * translate the camera in a given direction by a given distance
 * @param {vec3} unitDir
 * @param {Number} dist
 */
Camera.prototype.translateInDirection = function (unitDir, dist) {
    vec3.scaleAndAdd(this.eyePt, this.eyePt, unitDir, dist);
    this.updateViewPoint();
};

/**
 * @param {number} dist
 */
Camera.prototype.translateRelX = function (dist) {
    this.translateInDirection(this.relXDir, dist);
};

/**
 * @param {number} dist
 */
Camera.prototype.translateRelY = function (dist) {
    this.translateInDirection(this.relYDir, dist);
};

/**
 * @param {number} dist
 */
Camera.prototype.translateRelZ = function (dist) {
    this.translateInDirection(this.relZDir, dist);
};

/**
 * @param {vec3} out
 * @returns {vec3}
 */
Camera.prototype.getRelYDir = function (out) {
    vec3.copy(out, this.relYDir);
    return out;
};

/**
 *
 * @param {vec3} out
 * @returns {vec3}
 */
Camera.prototype.getRelZDir = function (out) {
    vec3.copy(out, this.relZDir);
    return out;
};

/**
 * @param {vec3} out
 * @returns {vec3}
 */
Camera.prototype.getRelXDir = function (out) {
    vec3.copy(out, this.relXDir);
    return out;
};

/**
 * @param {vec3} out
 * @returns {vec3}
 */
Camera.prototype.getEyePt = function (out) {
    vec3.copy(out, this.eyePt);
    return out
};

/**
 * @param {vec3} out
 * @returns {vec3}
 */
Camera.prototype.getViewPoint = function (out) {
    return vec3.copy(out, this.viewPt);
};

/**
 * @param {mat4} out
 * @returns {mat4}
 */
Camera.prototype.getRotationMatrix = function (out) {
    mat4.fromQuat(out, this.quaternion);
    return out;
};

/**
 * returns the perspective projectin matrix of the camera
 * @param {mat4} out
 */
Camera.prototype.getPerspectiveMatrix = function (out) {
    mat4.perspective(out, this.fovy, this.aspectRatio, this.nearZ, this.farZ);
};

/**
 * @param {mat4} out
 */
Camera.prototype.getViewMatrix = function (out) {
    mat4.lookAt(out, this.eyePt, this.viewPt, this.relYDir);
};

/**
 * we calculate a rotation that rotates the old z-naxis to new viewdir
 * a.b = |a||b|cos(angle) where angle is the angle between a and b
 * @param {vec3} newRelZDir    -- must be unit length
 */
Camera.prototype.changeRelZDir = function (newRelZDir) {
    var cosA = vec3.dot(this.relZDir, newRelZDir); // both vectors are unit length
    var A = Math.acos(cosA);
    var rotAxis = vec3.cross(vec3.create(), this.relZDir, newRelZDir);
    vec3.normalize(rotAxis, rotAxis);
    this.rotateAboutAxis(rotAxis, A);
};

/**
 * note that eyeDir must be perpendicular to upDir, and all dir vecs are assumed unit length
 * @param {vec3} eyePt  -- should have the same y-val as the focus, for an updir of [0, 1, 0]
 * @param {vec3} upDir -- cam's relative up dir. usually (0, 1, 0)
 * @param {vec3} focusPt  -- the point which we orbit
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspectRatio Aspect ratio. typically viewport width/height
 * @param {number} nearZ Near bound of the frustum
 * @param {number} farZ Far bound of the frustum
 * @constructor
 */
function OrbitingCamera(eyePt, fovy, aspectRatio, nearZ, farZ) {
    Camera.call(this, eyePt, fovy, aspectRatio, nearZ, farZ); // super cctor
    this.focusPt = vec3.fromValues(0, 0, 0);

    // for orbit computation
    this.eyeptRelFocus = vec3.sub(vec3.create(), this.focusPt, this.eyePt);
}

// OrbitingCamera inherits from Camera
OrbitingCamera.prototype = Object.create(Camera.prototype); // this clone's camera's prototype
OrbitingCamera.prototype.constructor = OrbitingCamera;


/**
 * change the focus of the camera
 * @param {vec3} newFocus -- the new focus we'll orbit around
 */
OrbitingCamera.prototype.setFocus = function (newFocus) {
    vec3.copy(this.focusPt, newFocus);
    var newRelZDir = vec3.sub(vec3.create(), newFocus, this.eyePt);
    vec3.normalize(newRelZDir, newRelZDir);
    this.changeRelZDir(newRelZDir);
};

/**
 * orbit about the camera's focus in the direction of orbitDir, note that orbitDir cannot be the relZDir
 * @param {Number} rad
 * @param {vec3} orbitDir  - must be prependicular to orbitAxis, and unit length
 * @param {vec3} orbitAxis  - must be unit length
 */
OrbitingCamera.prototype.orbit = function (rad, orbitDir, orbitAxis) {
    // camera eyept relative to focus
    this.eyeptRelFocus = vec3.sub(this.eyeptRelFocus, this.eyePt, this.focusPt);

    // rotate this point around orbitAxis
    quat.setAxisAngle(this.quaternion, orbitAxis, rad);
    vec3.transformQuat(this.eyeptRelFocus, this.eyeptRelFocus, this.quaternion);

    // add it back to focus to get our new eyept
    vec3.add(this.eyePt, this.focusPt, this.eyeptRelFocus);

    // let the quaternion take care of the rest
    this.updateAfterRotation();
};

/**
 * orbit about focus with our orbit axis as the camera's relXDir
 * @param rad
 */
OrbitingCamera.prototype.rotateXRel = function (rad) {
    this.orbit(rad, this.relYDir, this.relXDir);
};


/**
* orbit about focus with our orbit axis as the camera's relYDir
* @param rad
*/
OrbitingCamera.prototype.rotateYRel = function (rad) {
    this.orbit(rad, this.relXDir, this.relYDir);
};

/**
 * @param {number} dist
 */
OrbitingCamera.prototype.translateRelX = function (dist) {
    // do nothing
};

/**
 * @param {number} dist
 */
OrbitingCamera.prototype.translateRelY = function (dist) {
    // do nothing
};
