var canvas = document.getElementById("myGLCanvas");

/**
 * a javascript version of $('document').ready
 * http://stackoverflow.com/questions/9899372/pure-javascript-equivalent-to-jquerys-ready-how-to-call-a-function-when-the
 * @param f
 */
function onDocumentReady(f){
    /in/.test(document.readyState)? setTimeout("onDocumentReady("+f+")", 9) : f();
}

function setCanvasDimensions () {
    canvas.width = window.innerWidth;
    canvas.height = .90 * window.innerHeight;
}

onDocumentReady(function(){
    setCanvasDimensions();  //have to do this first or webGL draws on a tiny canvas
    startup();
});
