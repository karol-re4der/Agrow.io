
var entities = [];
var context;
var canvas;
var dpi;
var keyevents = [];
var resized = true;

var tickSpan = 8;
var running = false;
var serverAdress;
var playerName;
var connectionId;

var socket;
var foorl = "localhost:3000";

var apparentSize = 90;
var edibleColor = "#006600";
var neutralColor = "#737373";
var hostileColor = "#cc0000";

function init(){
    canvas = document.getElementById("gameCanvas");
    context = canvas.getContext("2d");
    dpi = window.devicePixelRatio;
    
    onkeydown = onkeyup = function(e){
	e = e || event;
	keyevents[e.keyCode] = e.type === 'keydown';
    };
    
    //set button actions
    document.getElementById("join-button").addEventListener("click", buttonAction);

    //fix dpi
    correctDPI();
    window.onresize = correctDPI;
    
}
function tick(){
    if(running){
	checkForDeath();
	processKeyInput();
	draw();
    }
}

function exchangeData(data){
    socket.emit("playerAction", JSON.stringify(data));
}

function draw(){
    if(entities.length>0){
	var pIndex = 0;
	for(var i = 0; i<entities.length; i++){
	    if(entities[i].type==="player"){
		if(entities[i].id===socket.id.toString()){
		    pIndex = i;
		}
	    }
	}

	//clear canvas
	var canvasWidth = document.getElementById("gameCanvas").width;
	var canvasHeight = document.getElementById("gameCanvas").height;
	context.clearRect(0, 0, canvasWidth, canvasHeight);

	//draw grid
	var gridSize = apparentSize*8-entities[pIndex].size;

	var shiftX = (entities[pIndex].posX-entities[pIndex].size*2)%(gridSize);
	var shiftY = (entities[pIndex].posY-entities[pIndex].size*2)%(gridSize);

	context.beginPath();
	context.strokeStyle = "#000000";
	for(var x = 0; x<canvasWidth+gridSize; x+=gridSize){
	    context.moveTo(x-shiftX+entities[pIndex].size, 0);
	    context.lineTo(x-shiftX+entities[pIndex].size, canvasHeight);
	}
	for(var y = 0; y<canvasHeight+gridSize; y+=gridSize){
	    context.moveTo(0, y-shiftY+entities[pIndex].size);
	    context.lineTo(canvasWidth, y-shiftY+entities[pIndex].size);
	}
	context.stroke();
	context.closePath();

	//draw player
	var digSize = (entities[pIndex].size+entities[pIndex].digesting)/entities[pIndex].size*apparentSize;
	drawCircle(canvasWidth/2-digSize/2, canvasHeight/2-digSize/2, digSize/2, edibleColor);
	drawCircle(canvasWidth/2-apparentSize/2, canvasHeight/2-apparentSize/2, apparentSize/2, neutralColor);
	setFont(entities[pIndex].name, apparentSize);
	context.fillStyle = "red";
	context.textAlign = "center";
	context.fillText(entities[pIndex].name, canvasWidth/2, canvasHeight/2);

	//draw objects
	for(var i = 0; i<entities.length; i++){
	    if(entities[i].type==="cluster"){
		//drawObject(entities[i], canvasWidth, canvasHeight, pIndex);
		for(var ii = 0; ii<entities[i].inside.length; ii++){
		    drawObject(entities[i].inside[ii], canvasWidth, canvasHeight, pIndex);
		}
	    }
	    else if(entities[i].type==="player" && i!==pIndex){
		drawObject(entities[i], canvasWidth, canvasHeight, pIndex);
	    }
	}
    }
}

//helper functions
function correctDPI(){
    var style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
    var style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
    canvas.setAttribute('height', style_height * dpi);
    canvas.setAttribute('width', style_width * dpi);
    if(socket){
	socket.emit("resize", JSON.stringify({canvasWidth:document.getElementById("gameCanvas").width, canvasHeight:document.getElementById("gameCanvas").height, apparentSize:apparentSize}));
    }
}
function buttonAction(){
    hosting = false;
    running = true;
    serverAdress = document.getElementById("server-name").value;
    playerName = document.getElementById("player-name").value;
    document.getElementById("menu").style.setProperty("display", "none");
    document.getElementById("gameCanvas").style.setProperty("display", "initial");
    document.title = playerName+" on "+serverAdress;

    //open connection
    if(!socket){
	socket = io(serverAdress);
	socket.on("new_data", function(data){
	    entities = JSON.parse(data);
	});
	socket.on("disconnect", function(){
	    location.reload();
	});
    }
    
    socket.emit("resize", JSON.stringify({canvasWidth:document.getElementById("gameCanvas").width, canvasHeight:document.getElementById("gameCanvas").height, apparentSize:apparentSize}));
    socket.emit("name", playerName);
    
}
function processKeyInput(){
    //set direction
    var dirX = dirY = 0;
    if(keyevents[37]){
	dirX--;
    }
    if(keyevents[38]){
	dirY--;
    }
    if(keyevents[39]){
	dirX++;
    }
    if(keyevents[40]){
	dirY++;
    }
    if(dirX || dirY){
	exchangeData({dirX:dirX, dirY:dirY});
    }
}
function checkForDeath(){
    if(entities.length>0){
	var alive = false;
	for(var i = 0; i<entities.length; i++){
	    if(entities[i].type==="player"){
		if(entities[i].id===socket.id.toString()){
		    alive = true;
		}
	    }
	}
	if(!alive){
	    running = false;
	    location.reload();
	}
    }
}
function drawCircle(x, y, r, color){
    context.beginPath();
    context.fillStyle = color;
    context.strokeStyle = "#000000";
    context.arc(x+r, y+r, r, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
    context.closePath();
}
function drawObject(object, canvasWidth, canvasHeight, pIndex){
    var relSize = object.size/entities[pIndex].size*apparentSize;

    var scale = apparentSize/entities[pIndex].size;
    var relX = canvasWidth/2-(entities[pIndex].posX-object.posX)*scale;
    var relY = canvasHeight/2-(entities[pIndex].posY-object.posY)*scale;

    var entityColor = neutralColor;
    drawCircle(relX-relSize/2, relY-relSize/2, relSize/2, entityColor);
    
    if(object.type==="player"){
	setFont(object.name, relSize);
	context.fillStyle = "red";
	context.textAlign = "center";
	context.fillText(object.name, relX, relY);
    }
}
function setFont(text, space){
    var fontSize = 200;
    do{
	context.font = fontSize+"px Comic Sans MS";
	fontSize--;
    }while(context.measureText(text).width>=space);
}

init();
setInterval(tick, tickSpan);