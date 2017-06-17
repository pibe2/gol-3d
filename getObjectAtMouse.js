/**
 * Created by pibe2 on 10/30/16.
 */

/**
// TODO: DON'T THINK THIS WILL WORK, OR IS EVEN NECESSARY
// WE NEED TO TRACE TO THE CLOSEST PLANE
*/

/**
 *
 * @param {vec3} point
 * @returns {Cell}
 */
function getClosestCell(point){
    var closestCell = cellGrid.getCell(0, 0, 0);
    var currCellCenter = closestCell.getWorldCenter(vec3.create());
    var closestCellDist = vec3.distance(currCellCenter, point);
    var currDist = -1;

    cellGrid.iterateCells(
        function (currCell, i, j, k) {
            currCellCenter = currCell.getWorldCenter(currCellCenter);
            currDist = vec3.distance(currCellCenter, point);
            if (currDist <= closestCellDist) {
                closestCell = currCell;
                closestCellDist = currDist;
            }
        }
    );
    return closestCell;
}

/**
 * create an object to unproject screen coordinates to mouse coordinates
 * @constructor
 */
function Unprojector() {
    this.viewInverse = mat4.create();
    this.perspInverse = mat4.create();
    this.rayClip4D = vec4.create();
    this.rayEye4D = vec4.create();
    this.rayWorld4D = vec4.create();
    this.rayWorld3D = vec3.create();

    /**
     * @param {number} vpX  -viewport mouseX aka mouse mouseX
     * @param {number} vpY  -viewport mouseY aka mouse mouseY
     * @param {number} vpW  -viewport width
     * @param {number} vpH  -viewport height
     * @param {mat4} viewMat
     * @param {mat4} perspMat
     * @returns {vec3}
     */
    this.screenToWorldRay = function (vpX, vpY, vpW, vpH, viewMat, perspMat) {
        vpY = vpH - vpY;    // mouse y increases as we go down, instead of up

        // viewport (mouse) coordinates range [0:vpW, 0:vpH]
        // Normalized device coordinates range [-1:1, -1:1]
        var normDeviceX = MathUtils.rangeMap(vpX, 0, vpW, -1, 1);
        var normDeviceY = MathUtils.rangeMap(vpY, 0, vpH, -1, 1);

        // clip coordinates range [-1:1, -1:1, -1:1, -1:1],
        // we set z=-1 bc we want the ray pointing into the screen
        this.rayClip4D = vec4.set(this.rayClip4D, normDeviceX, normDeviceY, -1, 1);

        this.perspInverse = mat4.invert(this.perspInverse, perspMat);
        this.rayEye4D = vec4.transformMat4(this.rayEye4D, this.rayClip4D, this.perspInverse);

        // we're unprojecting the x-y part only
        this.rayEye4D[2] = -1;
        this.rayEye4D[3] = 0;

        this.viewInverse = mat4.invert(this.viewInverse, viewMat);
        this.rayWorld4D = vec4.transformMat4(this.rayWorld4D, this.rayEye4D, this.viewInverse);

        vec3.set(this.rayWorld3D, this.rayWorld4D[0],
                this.rayWorld4D[1], this.rayWorld4D[2]);

        vec3.normalize(this.rayWorld3D, this.rayWorld3D);

        return this.rayWorld3D;
    };


    /**
     * @param {number} vpX  -viewport mouseX aka mouse mouseX
     * @param {number} vpY  -viewport mouseY aka mouse mouseY
     * @param {number} vpW  -viewport width
     * @param {number} vpH  -viewport height
     * @param {mat4} viewMat
     * @param {mat4} perspMat
     * @returns {vec3}
     */
    /*
    this.viewPerspInverse = mat4.create();
    this.screenToWorldRay_doesnt_work = function (vpX, vpY, vpW, vpH, viewMat, perspMat) {
        vpY = vpH - vpY;    // mouse y increases as we go down, instead of up

        // viewport (mouse) coordinates range [0:vpW, 0:vpH]
        // Normalized device coordinates range [-1:1, -1:1]
        var normDeviceX = MathUtils.rangeMap(vpX, 0, vpW, -1, 1);
        var normDeviceY = MathUtils.rangeMap(vpY, 0, vpH, -1, 1);

        // clip coordinates range [-1:1, -1:1, -1:1, -1:1],
        // we set z=-1 bc we want the ray pointing into the screen
        vec4.set(this.rayClip4D, normDeviceX, normDeviceY, -1, 1);

        mat4.multiply(this.viewPerspInverse, perspMat, viewMat);
        mat4.invert(this.viewPerspInverse, this.viewPerspInverse);
        vec4.transformMat4(this.rayWorld4D, this.rayClip4D, this.viewPerspInverse);
        vec3.set(this.rayWorld3D, this.rayWorld4D[0],
                this.rayWorld4D[1], this.rayWorld4D[2]);

        vec3.normalize(this.rayWorld3D, this.rayWorld3D);
        return this.rayWorld3D;
    };
    */

}

