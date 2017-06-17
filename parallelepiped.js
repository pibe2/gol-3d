/**
 * @author pibe2 on 10/15/16.
 */

/*
TODO: REFACTOR PARLLELEPIPED, SO THAT THE REGION OBJECTS ARE INTEGRATED WITH PPIPED
 AND BOTH OF THESE ARE DISTINCT FROM THE POINT GENERATION
 SO THAT SAY WE CAN CHANGE THE ORIGIN OF THE PPIPED AND TRANFER THIS TO THE REGION,
 OR PERHAPS ROTATE THE PPIPED AND TRANSFER THIS CHANGE TO THE REGIONS
*/

/*
points a ppiped is defined by the parametric equation:

p(u,v,w) = o + u*uVec + v*vVec + w*wVec
where u,v,w lie in interval [0, 1]

We can check whether a point is inside or outside the box by
solving for u,v,w and checking that u,v,w fall within [0, 1]

note that the ppiped equation describes as a vector space with
basis vectors uVec, vVec, wVec. In fact the equation above can be
directly translated to the following matrix multiplication

b = Ax
                [uVec]^T
p(u,v,w) + o =  |vVec|   * [u,v,w]^T
                [wVec]

so given a point p, we can find it's coordinates in the vector space
(u,v,w) by solving the equation for x.
Even better, we can pre-compute the inverse of the matrix (AInv), and
given a point p, we can compute it's coordinates in the vector space
simply by computing:
[u,v,w]^T = AInv * (p - o)
with this computed u,v,w coords, we can check if they lie within [0,1]
to see if they're inside the plane

From original ppiped equation we can extract each of the bounding planes
easily;
if w is kept constant:
    w = 0 gives us the back plane described by:
    p(u,v,w=0) = o + u*uVec + v*vVec

    w = 1 gives us the front plane described by:
    p(u,v,w=1) = (o + wVec) + u*uVec + v*vVec

if v is kept constant:
    v = 0 gives us the bottom plane described by:
    p(u,v=0,w) = o + u*uVec + w*wVec

    v = 1 gives us the top plane described by:
    p(u,v=1,w) = (o + vVec) + u*uVec + w*wVec

if u is kept constant:
    u = 0 gives us the left plane described by:
    p(u=0,v,w) = o + v*vVec + w*wVec

    v = 1 gives us the right plane described by:
    p(u=1,v,w) = (o + uVec) + v*vVec + w*wVec

line hits the plane at one point
line lies in the plane
line is parallel to plane:
    does not lie in the plane
    lies in the plane: (we ignore it. another plane will catch it)
    -- this means we have to test each box separately for ray collision

    line-plane collision:
    l(t) = o + t*k
    p(u,v) = s + u*a + v*b
    t,u,v are in R, and the rest are vectors in R3
    three equations, unknowns

    l(t) = p(u,v) => (o - s) = u*a + v*b - t*k

    equMat (Ax = b)
        [a ]^T
    A = |b |
        [-k]
    b = (o - s)
    x = [u, v, t]^T (we're solving for this)

 */

function PlaneRegion(o, xVec, yVec) {
    this.o = vec3.clone(o);
    this.xVec = vec3.clone(xVec);
    this.yVec = vec3.clone(yVec);
    this.mat = mat3.fromValues(
            xVec[0], yVec[0], -1,
            xVec[1], yVec[1], -1,
            xVec[2], yVec[2], -1
    );
    mat3.transpose(this.mat, this.mat);  // in gl-matrix rows = columns
    this.matInv = mat3.create();
    this.b = vec3.create();
    this.UVTCoords = vec3.create();

    /**
     * determine if a point lies inside the parametric plane
     * @param {vec3} point
     * @returns {boolean}
     */
    this.isPointInsideRegion = function (point) {
        //TODO: IMPLEMENT THIS
    };

    /**
     * checking for simplest case where the ray is not parallel to the plane,
     * but intersects it at exactly one point
     * remember this is a ray, so points behind the rayStart are not valid
     * @param {vec3} rayStart
     * @param {vec3} rayDir -- must be a unit vector
     * @returns {boolean}
     */
    this.doesRayIntersectOnce = function (rayStart, rayDir) {
        this.updateMatForRay(rayDir);

        var invertRes = mat3.invert(this.matInv, this.mat);
        if(invertRes == null) {
            return false;
        }

        this.b = vec3.sub(this.b, rayStart, this.o);
        vec3.transformMat3(this.UVTCoords, this.b, this.matInv);

        var u = this.UVTCoords[0];
        var v = this.UVTCoords[1];
        var t = this.UVTCoords[2];
        return (t >= 0 && u >= 0 && u <= 1 && v >= 0 && v <= 1);
    };

    /**
     * same as doesRayIntersectOnce, but deals with a line, which means
     * we consider intersection points that are behind rayStart (t < 0) as valid
     * @param {vec3} rayStart
     * @param {vec3} rayDir
     * @returns {boolean}
     */
    this.doesLineIntersectOnce = function (rayStart, rayDir) {
        this.updateMatForRay(rayDir);
        var invertRes = mat3.invert(this.matInv, this.mat);
        if(invertRes == null) {
            return false;
        }
        this.b = vec3.sub(this.b, rayStart, this.o);
        vec3.transformMat3(this.UVTCoords, this.b, this.matInv);

        var u = this.UVTCoords[0];
        var v = this.UVTCoords[1];
        return (u >= 0 && u <= 1 && v >= 0 && v <= 1);
    };

    this.updateMatForRay = function (rayDir) {
        // in gl-matrix last column corresponds to last three entries
        this.mat[6] = -rayDir[0];
        this.mat[7] = -rayDir[1];
        this.mat[8] = -rayDir[2];
    };

    this.setOrigin = function (newOrigin) {
        vec3.copy(this.o, newOrigin);
    };
}

/**
 * object to determine whether a point is inside a ppiped region
 * @param {Parallelepiped} ppiped
 * @constructor
 */
function ParallelepipedRegion(ppiped) {
    this.ppiped = ppiped;
    this.backFace = null;
    this.frontFace = null;
    this.leftFace = null;
    this.rightFace = null;
    this.bottomFace = null;
    this.topFace = null;
    this.o = vec3.create();

    //for computation of Ax = b
    this.mat = mat3.create();
    this.matInv = mat3.create();
    this.b = vec3.create();
    this.UVWCoords = vec3.create();

    this.faceOrigin = vec3.create();    //used for computation of face origins

    this.setup = function () {
        this.mat = mat3.set(this.mat,    // box(u,v,w) = mat * (u,v,w)
            ppiped.xVec[0], ppiped.yVec[0], ppiped.zVec[0],
            ppiped.xVec[1], ppiped.yVec[1], ppiped.zVec[1],
            ppiped.xVec[2], ppiped.yVec[2], ppiped.zVec[2]
        );
        mat3.transpose(this.mat, this.mat);  // in gl-matrix rows = columns

        var invertRes = mat3.invert(this.matInv, this.mat);
        if (invertRes == null) {
            throw "Exception: xVec, yVec, zVec do not describe a valid parallelepiped"
        }

        this.backFace = new PlaneRegion(this.ppiped.o, this.ppiped.yVec, this.ppiped.xVec);
        this.frontFace = new PlaneRegion(this.ppiped.oz, this.ppiped.xVec, this.ppiped.yVec);
        this.bottomFace = new PlaneRegion(this.ppiped.o, this.ppiped.xVec, this.ppiped.zVec);
        this.topFace = new PlaneRegion(this.ppiped.oy, this.ppiped.zVec, this.ppiped.xVec);
        this.leftFace = new PlaneRegion(this.ppiped.o, this.ppiped.zVec, this.ppiped.yVec);
        this.rightFace = new PlaneRegion(this.ppiped.ox, this.ppiped.yVec, this.ppiped.zVec);
    };

    /**
     * variable origins allows us to use the same object to handle collisions
     * for multiple translated instaces of the same ppiped (this doesn't work
     * if we rotate however, at least not yet)
     * @param newOrigin
     */
    this.setOrigin = function (newOrigin) {
        this.o = vec3.copy(this.o, newOrigin);

        vec3.copy(this.faceOrigin, this.o);
        this.backFace.setOrigin(this.faceOrigin);

        vec3.add(this.faceOrigin, this.o, this.ppiped.zVec);
        this.frontFace.setOrigin(this.faceOrigin);

        vec3.copy(this.faceOrigin, this.o);
        this.bottomFace.setOrigin(this.faceOrigin);

        vec3.add(this.faceOrigin, this.o, this.ppiped.yVec);
        this.topFace.setOrigin(this.faceOrigin);

        vec3.copy(this.faceOrigin, this.o);
        this.leftFace.setOrigin(this.faceOrigin);

        vec3.add(this.faceOrigin, this.o, this.ppiped.xVec);
        this.rightFace.setOrigin(this.faceOrigin);
    };

    /**
     * support for rotated instances of the same ppiped
     * @param {mat3} rotationMatrix
     */
    this.rotateRegion = function (rotationMatrix) {
        // TODO: IMPLEMENT THIS
    };

    /**
     * basic collision detection: determines whether a given point is inside the ppiped
     * treats the plane as a parametric curve given by
     * (x,y,z) = o + u*this.xVec + v*vVec + w*wVec, where u,v,w lie in range [0, 1]
     * therefore a point (x,y,z) is outside the plane if it intersects the curve, at some
     * u,v,w, where at least one of u,v,w lies outside the range [0, 1], otherwise, the point
     * is inside the ppiped
     *
     * @param {vec3} point
     * @returns {boolean}
     */
    this.isPointOutsideRegion = function (point) {
        var b = vec3.sub(this.b, point, this.o);
        var x = vec3.transformMat3(this.UVWCoords, b, this.matInv);
        return x[0] > 1 || x[0] < 0 || x[1] > 1 || x[1] < 0 || x[2] > 1 || x[2] < 0;
    };

    /**
     * determines if a ray intersects the ppiped
     * @param {vec3} rayStart
     * @param {vec3} rayDir
     * @returns {boolean}
     */
    this.doesRayIntersect = function (rayStart, rayDir) {
        return  this.backFace.doesRayIntersectOnce(rayStart, rayDir) ||
                this.frontFace.doesRayIntersectOnce(rayStart, rayDir) ||
                this.bottomFace.doesRayIntersectOnce(rayStart, rayDir) ||
                this.topFace.doesRayIntersectOnce(rayStart, rayDir) ||
                this.leftFace.doesRayIntersectOnce(rayStart, rayDir) ||
                this.rightFace.doesRayIntersectOnce(rayStart, rayDir);
    };

    /**
     * determines if a line intersects the ppiped
     * @param {vec3} rayStart
     * @param {vec3} rayDir
     * @returns {boolean}
     */
    this.doesLineIntersect = function (rayStart, rayDir) {
        return  this.backFace.doesLineIntersectOnce(rayStart, rayDir) ||
                this.frontFace.doesLineIntersectOnce(rayStart, rayDir) ||
                this.bottomFace.doesLineIntersectOnce(rayStart, rayDir) ||
                this.topFace.doesLineIntersectOnce(rayStart, rayDir) ||
                this.leftFace.doesLineIntersectOnce(rayStart, rayDir) ||
                this.rightFace.doesLineIntersectOnce(rayStart, rayDir);
    };

}


/**
 * create a parallelepiped; parameters specify a
 * coordinate system of sorts in R3
 * @param {vec3} o
 * @param {vec3} xDir
 * @param {vec3} yDir
 * @param {vec3} zDir
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @param {vec3} color
 * @param {number} numDivisions
 * @constructor
 */
function Parallelepiped (o, xDir, yDir, zDir, width, height, depth, color, numDivisions) {
    this.numDivisions = numDivisions;
    this.color = vec3.copy(vec3.create(), color);
    this.outlineColor = vec3.fromValues(1, 1, 1);

    this.width = width;
    this.height = height;
    this.depth = depth;

    this.xDir = vec3.normalize(xDir, xDir);
    this.yDir = vec3.normalize(yDir, yDir);
    this.zDir = vec3.normalize(zDir, zDir);

    this.xVec = vec3.scale(vec3.create(), this.xDir, this.width);
    this.yVec = vec3.scale(vec3.create(), this.yDir, this.height);
    this.zVec = vec3.scale(vec3.create(), this.zDir, this.depth);

    this.o = vec3.copy(vec3.create(), o);
    this.ox = vec3.add(vec3.create(), this.o, this.xVec);
    this.oy = vec3.add(vec3.create(), this.o, this.yVec);
    this.oz = vec3.add(vec3.create(), this.o, this.zVec);
    this.oxy = vec3.add(vec3.create(), this.ox, this.yVec);
    this.oxz = vec3.add(vec3.create(), this.ox, this.zVec);
    this.oyz = vec3.add(vec3.create(), this.oy, this.zVec);
    this.oxyz = vec3.add(vec3.create(), this.oxy, this.zVec);

    this.numTris = 0;
    this.verts = [];
    this.vertNorms = [];
    this.vertColors = [];
    this.outlineSoup = [];
    this.outlineColors = [];

    /**
     * create all 6 facesRegions of parallelepiped
     */
    this.createPFaces = function () {
        var faceNormXY = vec3.cross(vec3.create(), this.yDir, this.xDir);
        var faceNormXZ = vec3.cross(vec3.create(), this.xDir, this.zDir);
        var faceNormYZ = vec3.cross(vec3.create(), this.zDir, this.yDir);

        var negFaceNormXY = vec3.scale(vec3.create(), faceNormXY, -1);
        var negFaceNormXZ = vec3.scale(vec3.create(), faceNormXZ, -1);
        var negFaceNormYZ = vec3.scale(vec3.create(), faceNormYZ, -1);

        this.numTris += this.createPFace(this.o, this.oy, this.ox, this.oxy, faceNormXY);
        this.numTris += this.createPFace(this.o, this.oz, this.oy, this.oyz, faceNormYZ);
        this.numTris += this.createPFace(this.o, this.ox, this.oz, this.oxz, faceNormXZ);
        this.numTris += this.createPFace(this.oz, this.oxz, this.oyz, this.oxyz, negFaceNormXY);
        this.numTris += this.createPFace(this.ox, this.oxy, this.oxz, this.oxyz, negFaceNormYZ);
        this.numTris += this.createPFace(this.oy, this.oyz, this.oxy, this.oxyz, negFaceNormXZ);
    };

    /**
     * add outline vertices and colors
     * @param {vec3} o
     * @param {vec3} oy
     * @param {vec3} ox
     * @param {vec3} oxy
     */
    this.addFaceOutline = function (o, oy, ox, oxy) {
        MathUtils.pushVertex(o, this.outlineSoup);
        MathUtils.pushVertex(ox, this.outlineSoup);

        MathUtils.pushVertex(o, this.outlineSoup);
        MathUtils.pushVertex(oy, this.outlineSoup);

        MathUtils.pushVertex(ox, this.outlineSoup);
        MathUtils.pushVertex(oxy, this.outlineSoup);

        MathUtils.pushVertex(oy, this.outlineSoup);
        MathUtils.pushVertex(oxy, this.outlineSoup);

        for (var i = 0; i < 8; i++) {
            MathUtils.pushVertex(this.outlineColor, this.outlineColors);
        }
    };

    /**
     * create side/face of ppiped
     * @param {vec3} o
     * @param {vec3} oy
     * @param {vec3} ox
     * @param {vec3} oxy
     * @param {vec3} faceNorm
     * @returns {number}
     */
    this.createPFace = function (o, oy, ox, oxy, faceNorm) {
        var numT = 0;
        numT += this.divideTriangle(o, ox, oy, this.numDivisions-1, faceNorm);
        numT += this.divideTriangle(oxy, oy, ox, this.numDivisions-1, faceNorm);

        this.addFaceOutline(o, oy, ox, oxy);

        return numT;
    };

    /**
     * recursively divide the triangle into smaller triangles
     * until we reach numDivisions == 0
     * @param {vec3} a
     * @param {vec3} b
     * @param {vec3} c
     * @param {number} numDivisions
     * @param {vec3} faceNorm - the normal for this side of the ppiped
     * @returns {number}
     */
    this.divideTriangle = function (a, b, c, numDivisions, faceNorm) {
        if (numDivisions > 0) {
            var numT = 0;
            var ab = vec3.create();
            vec3.lerp(ab, a, b, 0.5);
            var ac = vec3.create();
            vec3.lerp(ac, a, c, 0.5);
            var bc = vec3.create();
            vec3.lerp(bc, b, c, 0.5);

            numT += this.divideTriangle(a, ab, ac, numDivisions - 1, faceNorm);
            numT += this.divideTriangle(ab, b, bc, numDivisions - 1, faceNorm);
            numT += this.divideTriangle(bc, c, ac, numDivisions - 1, faceNorm);
            numT += this.divideTriangle(ab, bc, ac, numDivisions - 1, faceNorm);
            return numT;
        }
        else {
            // Add 3 vertices to the array
            MathUtils.pushVertex(a, this.verts);
            MathUtils.pushVertex(b, this.verts);
            MathUtils.pushVertex(c, this.verts);
            // add normals and color, one for added each vertex
            for (var i = 0; i < 3; i++) {
                MathUtils.pushVertex(this.color, this.vertColors);
                MathUtils.pushVertex(faceNorm, this.vertNorms);
            }
            return 1;
        }
    };

    /**
     * set the size attributes as needed in gl buffer calls
     */
    this.setGLSizeAttrs = function () {
        this.verts.numberOfItems = 3*this.numTris;
        this.verts.itemSize = 3;

        this.vertNorms.numberOfItems = 3*this.numTris;
        this.vertNorms.itemSize = 3;

        this.vertColors.numberOfItems = 3*this.numTris;
        this.vertColors.itemSize = 3;

        this.outlineSoup.numberOfItems = 8*6;
        this.outlineSoup.itemSize = 3;

        this.outlineColors.numberOfItems = 8*6;
        this.outlineColors.itemSize = 3;
    };

    this.setup = function () {
        this.createPFaces();
        this.setGLSizeAttrs();
    };
}
