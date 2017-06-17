var MathUtils = {
    /**
     * @param {number} value
     * @returns {boolean}
     */
    isPowerOf2: function (value) {
        return (value & (value - 1)) == 0;
    },

    /**
     * @param {number} degrees
     * @returns {number}
     */
    degreesToRadians: function (degrees) {
        return Math.PI * degrees / 180.0;
    },

    /**
     * @param {number} rad
     * @returns {number}
     */
    radiansToDegrees: function (rad) {
        return 180.0 * rad / Math.PI;
    },

    /**
     * @param {number} val
     * @return {boolean}
     */
    isEven: function (val) {
        return (val%2 == 0);
    },

    /**
     * @param {number} val
     * @return {boolean}
     */
    isOdd: function (val) {
        return (val%2 == 1);
    },

    /**
     * @param {number} val
     * @param {number} rangeA
     * @param {number} rangeB
     * @returns {number}
     */
    clamp: function (val, rangeA, rangeB) {
        var min = (rangeA <= rangeB) ? rangeA : rangeB;
        var max = (rangeA >= rangeB) ? rangeA : rangeB;

        if (val < min) {
            val = min;
        }
        else if (val > max) {
            val = max;
        }
        return val
    },

    /**
     * @param {number} value
     * @param {number} low1
     * @param {number} high1
     * @param {number} low2
     * @param {number} high2
     * @returns {number}
     */
    rangeMap: function (value, low1, high1, low2, high2) {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    },

    /**
     * @param {number} value
     * @param {number} low1
     * @param {number} high1
     * @param {number} low2
     * @param {number} high2
     * @returns {number}
     */
    clampedRangeMap: function (value, low1, high1, low2, high2) {
        var mappedVal = MathUtils.rangeMap(value, low1, high1, low2, high2);
        return mathUtils.clamp(mappedVal, low2, high2);
    },



    /**
     * create three-dimensional array
     * @param {number} xSize
     * @param {number} ySize
     * @param {number} zSize
     * @returns {Array}
     */
    create3dArray: function (xSize, ySize, zSize) {
        var arr = new Array(xSize);
        for (var i = 0; i < ySize; i++) {
            arr[i] = new Array(ySize);
            for (var j = 0; j < ySize; j++) {
                arr[i][j] = new Array(zSize);
            }
        }
        return arr;
    },

    /**
     * create two-dimensional array
     * @param {number} xSize
     * @param {number} ySize
     * @returns {Array}
     */
    create2dArray: function (xSize, ySize) {
        var arr = new Array(xSize);
        for (var i = 0; i < ySize; i++) {
            arr[i] = new Array(ySize);
        }
        return arr;
    },

    /**
     *
     * @param {vec3} v
     * @param {object} vArray
     */
    pushVertex: function (v, vArray) {
        for (var i = 0; i < 3; i++) {
            vArray.push(v[i]);
        }
    },

    /**
     * helps us index into a 1-d array like it was a 2-d array of
     * size arrSize-by-arrSize
     * @param {number} i
     * @param {number} j
     * @param {number} gridSize  size of the 2d array being emulated
     * @returns {Number}
     */
    grid2ArrIdx: function (i, j, gridSize) {
        return (i * gridSize) + j;
    },

     /**
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {number}
     */
    avgOf4: function (a, b, c, d) {
        return (a + b + c + d)/4.0;
    },

    /**
     * helper for unrolling cellGrid into a glBuffer.
     * places the coords into the given array
     * @param {vec3} theVec    the vector being extracted
     * @param {vec3} outArr    the array that's going to hold the unrolled elements
     * @param {number} startIdx  the start index to place the coord elements into
     */
    extractVec3: function (outArr, startIdx, theVec) {
        outArr[startIdx] = theVec[0];
        outArr[startIdx + 1] = theVec[1];
        outArr[startIdx + 2] = theVec[2];
    },

    /**
     * x mod y return x mod y
     * assuming -y < x
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    mMod: function (x, y){
        return (x + y) % y;
    },

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {number}
     */
    vec3Len: function (x, y, z){
        return Math.sqrt(x*x + y*y + z*z);
    },

    /**
     * @param mat
     * @param size
     * @returns {string}
     */
    matToString: function (mat, size) {
        var res = "";
        for (var i = 0; i < size; i++) {
            res += "[ ";
            for (var j = 0; j < size; j++) {
                res += mat[i*size + j] + " ";
            }
            res += " ]\n";
        }
        return res;
    }
};