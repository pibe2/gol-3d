var ShaderProgram = {
    /**
     * The program contains a series of instructions that tell the Graphic Processing Unit (GPU)
     * what to do with every vertex and fragment that we pass it.
     * The vertex shader and the fragment shader together are called the program.
     *
     * NAMING CONVENTION: all attributes/uniforms in given list will be
     *      named the same in their corresponding frag/vert shaders
     *
     * @param {String} vsId  html DOM id of the vertex shader script
     * @param {String} fsId html DOM id of the vertex shader script
     * @param {Array} attributeList
     * @param {Array} uniformList
     * @param gl
     */
    load: function (vsId, fsId, attributeList, uniformList, gl) {
        var vertexShader = ShaderProgram.getShaderFromDOM(vsId, gl);
        var fragmentShader = ShaderProgram.getShaderFromDOM(fsId, gl);
        var shaderPrg = gl.createProgram();
        gl.attachShader(shaderPrg, vertexShader);
        gl.attachShader(shaderPrg, fragmentShader);
        gl.linkProgram(shaderPrg);

        if (!gl.getProgramParameter(shaderPrg, gl.LINK_STATUS)) {
            console.log("[ShaderProgram] Could not initialise shaders");
            console.error(gl.getProgramInfoLog(shaderPrg));
        }

        gl.useProgram(shaderPrg);

        /*
         Always have vertex attrib 0 array enabled.
         If you draw with vertex attrib 0 array disabled,
         you will force the browser to do complicated emulation
         when running on desktop OpenGL (e.g. on Mac OSX).

         This is because in desktop OpenGL, nothing gets drawn if vertex attrib 0 is not
         array-enabled. You can use bindAttribLocation() to force a vertex attribute
         to use location 0, and use enableVertexAttribArray() to make it array-enabled.

         taken from https://developer.mozilla.org/en-US/docs/Web/WebGL/WebGL_best_practices
        */

        gl.bindAttribLocation(shaderPrg, 0, "aVertexPosition");
        gl.enableVertexAttribArray(0);   //vertex position attr. is in location 0

        ShaderProgram.setAttributeLocations(attributeList, shaderPrg, gl);
        ShaderProgram.setUniformLocations(uniformList, shaderPrg, gl);
        return shaderPrg;
    },

    setAttributeLocations: function (attrList, shaderPrg, gl) {

        for (var i = 0, max = attrList.length; i < max; i += 1) {
            shaderPrg[attrList[i]] = gl.getAttribLocation(shaderPrg, attrList[i]);
            gl.enableVertexAttribArray(shaderPrg[attrList[i]]);
        }

    },

    setUniformLocations: function (uniformList, shaderPrg, gl) {

        for (var i = 0, max = uniformList.length; i < max; i += 1) {
            shaderPrg[uniformList[i]] = gl.getUniformLocation(shaderPrg, uniformList[i]);
        }
    },

    getUniform: function (uniformLocation, shaderPrg, gl) {
        return gl.getUniform(shaderPrg, uniformLocation);
    },

    getShaderFromDOM : function (id, gl) {
        var shaderScript = document.getElementById(id);
        // If we don't find an element with the specified id
        // we do an early exit
        if (!shaderScript) {
            return null;
        }
        // Loop through the children for the found DOM element and
        // build up the shader source code as a string
        var shaderSource = "";
        var currentChild = shaderScript.firstChild;
        while (currentChild) {
            if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
                shaderSource += currentChild.textContent;
            }
            currentChild = currentChild.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

};
