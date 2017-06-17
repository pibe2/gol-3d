/**
 * Created by pibe2 on 10/30/16.
 */

// TODO: implement @param {Array} neighborsConfig, 3-d array specifying relative mouseX, mouseY, z grid locations of a cell's neighbors
// TODO: implement nearest neighbor search to determine closest cell to a world coord
// TODO: implement more freedom with grid size, ie breadth, width, height
// TODO: separate the model from the view, as in model view controller

/**
 TODO: IMPORVE CELL SELECTION with below suggestion
 * to implement cell selection with mouse,
 * first acquire all six planes that comprise the grid their normals and origin
 * find the ones that facesRegions the camera
 * find its intersection with the ray cast from camera,
 * find the cell that it hit if any
 *      will need to somehow be able to truncate planes, so they are not unbounded
 */

/**
 * @param {number} size
 * @param {number} cellWorldSize
 * @param {Rule} rule
 * @constructor
 */
function CellGrid(size, cellWorldSize, rule) {
    this.grid = null;
    this.size = size;
    this.rule = rule;
    this.cellWorldSize = cellWorldSize;
    this.worldCenter = null;
    this.worldMarginFactor = 1.5;

    this.setup = function () {
        this.grid = MathUtils.create3dArray(size, size, size);
        this.createCells();
        this.setCellNeighbors();
        this.setCellWorldInfo();
        this.calculateWorldCenter();
    };

    this.createCells = function () {
        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                for (var k = 0; k < this.size; k++) {
                    this.grid[i][j][k] = new Cell(CELL_ON, i, j, k);
                }
            }
        }
    };

    /**
     * @param {function} func applied to each cell, and it's grid coords
     * func is of form (void func(Cell, i, j, k))
     */
    this.iterateCells = function (func) {
        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                for (var k = 0; k < this.size; k++) {
                    func(this.grid[i][j][k], i, j, k);
                }
            }
        }
    };

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Cell}
     */
    this.getCell = function (x, y, z) {
        return this.grid[x][y][z];
    };

    /**
     * note that there are 27 neighbors:
     *  we just take a 3*3*3 block with the current cell at the center
     *  note that one of these 'neighbors' will be the cell itself
     *  Also note that the grid is treated as a toroidal one

     */
    this.setCellNeighbors = function () {
        var curNeigh;
        var dimSteps = [-1, 0, 1];
        var size = this.size;
        var grid = this.grid;


        this.iterateCells(
            function (curCell, i, j, k){
                for (var x in dimSteps) {
                    for (var y in dimSteps) {
                        for (var z in dimSteps) {
                            curNeigh = grid[(i + x)%size][(j + y)%size][(k + z)%size];
                            curCell.addNeighbor(curNeigh);
                        }
                    }
                }

            }
        );
    };

    /**
     * set the world positions of the cells
     */
    this.setCellWorldInfo = function () {
        var wx = 0, wy = 0, wz = 0; // cell world coords
        var cellWorldOrigin, cellWorldCenter;
        cellWorldOrigin = vec3.create();
        cellWorldCenter = vec3.create();
        var self = this;

        this.iterateCells(
            function (cell, i, j, k) {
                wx = self.worldMarginFactor * i * self.cellWorldSize;
                wy = self.worldMarginFactor * j * self.cellWorldSize;
                wz = self.worldMarginFactor * k * self.cellWorldSize;

                vec3.set(cellWorldOrigin, wx, wy, wz);
                vec3.set(cellWorldCenter,
                        wx + self.cellWorldSize/2,
                        wy + self.cellWorldSize/2,
                        wz + self.cellWorldSize/2);

                cell.setWorldOrigin(cellWorldOrigin);
                cell.setWorldCenter(cellWorldCenter);
                cell.setWorldSize(self.cellWorldSize);
            }
        );
    };

    this.calculateWorldCenter = function () {
        var mid = Math.floor(this.size/2);
        var center = vec3.create();
        var midCellCenter = this.grid[mid][mid][mid].getWorldCenter(vec3.create());
        if (MathUtils.isEven(this.size)) {
            var midCellCenter2 = this.grid[mid + 1][mid + 1][mid + 1].getWorldCenter(vec3.create());
            vec3.lerp(center, midCellCenter, midCellCenter2, 0.5);
        }
        else if(MathUtils.isOdd(this.size)) {
            vec3.copy(center, midCellCenter)
        }
        this.worldCenter = center;
    };

    /**
     * @param {vec3} out
     * @returns {vec3}
     */
    this.getWorldCenter = function (out) {
        return vec3.copy(out, this.worldCenter);
    };

    this.step = function () {
        var self = this;
        this.iterateCells(
            function (cell, i, j, k) {
                cell.setState(self.rule.getNextState(cell));
            }
        );
    };

    /**
     * set all cells to the given state
     * @param state
     */
    this.setAll = function (state) {
        this.iterateCells (
            function (cell, i, j, k) {
                cell.setState(state);
            }
        )
    };

    /**
     * set all cells to a random state
     * @param state
     */
    this.setAllRandom = function () {
        this.iterateCells (
            function (cell, i, j, k) {
                cell.setStateRandom();
            }
        )
    };

}//end class
