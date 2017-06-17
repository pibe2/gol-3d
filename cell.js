/**
 * Created by pibe2 on 10/30/16.
 */

// TODO: use prototyping for cell class since there are quite a few instances of it.
// TODO: Implement multi-state cells/rules

var CELL_OFF = 0;
var CELL_ON = 1;
var cellStates = [CELL_OFF, CELL_ON];

/**
 *
 * @param {number} state
 * @param {number} gridX
 * @param {number} gridY
 * @param {number} gridZ
 * @param {number} numNeighbors
 * @constructor
 */
function Cell (state, gridX, gridY, gridZ) {
    this.state = state;
    this.neighbors = [];
    this.worldSize = -1;
    this.worldCenter = vec3.create();
    this.worldOrigin = vec3.create();

    // note these are for gui purposes alone
    this.gridX = gridX;
    this.gridY = gridY;
    this.gridZ = gridZ;

    /**
     * @param {cell} neighbor
     */
    this.addNeighbor = function (neighbor){
        this.neighbors.push(neighbor);
    };

    /**
     * @returns {number}
     */
    this.getGridX = function () {
        return this.gridX;
    };

    /**
     * @returns {number}
     */
    this.getGridY = function () {
        return this.gridY;
    };

    /**
     * @returns {number}
     */
    this.getGridZ = function () {
        return this.gridZ;
    };

    /**
     * @returns {number}
     */
    this.getState = function () {
        return this.state;
    };

    /**
     * @param {number} newState
     */
    this.setState = function (newState) {
        this.state = newState;
    };

    /**
     * set the state of the cell to a random state
     */
    this.setStateRandom = function () {
        var idx = Math.round(Math.random());
        this.setState(cellStates[idx]);
    };

    this.toggleState = function () {
        this.state = !this.state;
    };

    /**
     * @returns {Array}
     */
    this.getNeighbors = function () {
        return this.neighbors;
    };

    /**
     * @returns {number}
     */
    this.getNumLivingNeighbors = function () {
        var count = 0;
        for (var i = 0, len = this.neighbors.length; i < len; i++) {
            var neighbor = this.neighbors[i];
            if (neighbor.getState() == CELL_ON) {
                count += 1;
            }
        }
        return count;
    };

    /**
     * @param {number} worldSize
     */
    this.setWorldSize = function(worldSize) {
        this.worldSize = worldSize;
    };

    /**
     * @param {vec3} worldCenter
     */
    this.setWorldCenter = function (worldCenter) {
        this.worldCenter = vec3.copy(this.worldCenter, worldCenter);
    };

    /**
     * @param {vec3} worldOrigin
     */
    this.setWorldOrigin = function (worldOrigin) {
        this.worldOrigin = vec3.copy(this.worldOrigin, worldOrigin);
    };

    /**
     * @returns {number}
     */
    this.getWorldSize = function() {
        return this.worldSize;
    };

    /**
     * @param {vec3} out
     * @returns {vec3}
     */
    this.getWorldCenter = function (out) {
        return vec3.copy(out, this.worldCenter);
    };

    /**
     * @param {vec3} out
     * @returns {vec3}
     */
    this.getWorldOrigin = function (out) {
        return vec3.copy(out, this.worldOrigin);
    };
}
