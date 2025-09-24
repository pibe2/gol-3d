/**
 * Semi-totalistic Cellular Automata Rule: meaning we determine the state of a cell
 *      based on how many neighbors alive, regardless of their configuration.
 *      *** I wanted to consider configurations, but there are too many
 *          possible configurations when dealing 3-d cubes with 26 neighbors
 * @param eL    - minimum number of living neighbors so that a living cell remains alive
 * @param eH    - maximum number of living neighbors so that a living cell remains alive
 * @param fL    - minimum number of living neighbors so that a dead cell becomes alive
 * @param fH    - maximum number of living neighbors so that a dead cell becomes alive
 * @constructor
 */
function Rule(eL, eH, fL, fH) {
    this.eL = eL;
    this.eH = eH;
    this.fL = fL;
    this.fH = fH;

    /**
     * @param {Cell} cell
     * @return number
     */
    this.getNextState = function (cell) {
        const numLivingNeighs = cell.getNumLivingNeighbors();
        // console.log(numLivingNeighs === 0);
        const curState = cell.getState();
        if (curState === CELL_ON) {
            if (numLivingNeighs >= this.eL && numLivingNeighs <= this.eH) {
                return CELL_ON;
            }
            else {
                return CELL_OFF;
            }
        }
        else if (curState === CELL_OFF) {
            if (numLivingNeighs >= this.fL && numLivingNeighs <= this.fH) {
                return CELL_ON;
            }
            else {
                return CELL_OFF;
            }
        }
        return -1;  // unreachable in two-state cellular automata
    }
}
