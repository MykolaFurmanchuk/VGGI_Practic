'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
    return angle * Math.PI / 180;
}
// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        for(let i = 3; i<=vertices.length; i+=6){
            vertices[i] = vertices[i+1077];//1077
            vertices[i+1] = vertices[i+1078];//1078
            vertices[i+2] = vertices[i+1079];//1079
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length/3;
    }

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
         let curLine = 0;
         let nextLine = 360;
         let countLine = Math.floor(this.count / nextLine); 
         for(let i = 0; i <= countLine; i++){
             gl.drawArrays(gl.LINE_STRIP, curLine , nextLine);
             curLine += nextLine;
         }
        //gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}



// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() { 
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    
    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI/8, 1, 8, 12); 
    
    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,-10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView );
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0 );
        
    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1 );

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection );
    
    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [0,1,0,1] );

    surface.Draw();
}

function CreateSurfaceData()
{
    let R1 = 0.3;
    let R2 = 3 * R1;
    let b =  3 * R1;
    let vertexList = [];
    let r = 0;
    let x = 0;
    let y = 0;
    let an = 0;
    // 2 * b is a lenght of a segment between two cylinders of diferent diameters
    for (let i=0; i < 2 * b;  i+= 0.1) {
        // j is the angle in the planes of parallels taken from the axis Ox in the direction of the axis Oy
        for (let j = 0; j< 360; j+=1){   
            an = deg2rad(( 180 * i ) / (4 * b))
            r = ( R2 - R1 ) * Math.pow(Math.sin(an),2) + R1; 
            x = r * Math.cos(deg2rad(j))
            y = r * Math.sin(deg2rad(j))
            vertexList.push(x, y, i);   
        }
    }
    return vertexList;
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex              = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor                     = gl.getUniformLocation(prog, "color");
    shProgram.positionLocation = gl.getAttribLocation(program, "a_position");
    shProgram.normalLocation = gl.getAttribLocation(program, "a_normal");

    // lookup uniforms
    shProgram.worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
    shProgram.worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
    shProgram.colorLocation = gl.getUniformLocation(program, "u_color");
    shProgram.lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
    shProgram.worldLocation = gl.getUniformLocation(program, "u_world");

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
     }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}
