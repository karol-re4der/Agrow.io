
var entities = [{type:"player", size:3, posX:10, posY:10, vel:new Victor(0, 0), dec:0.1, acc:1, digesting:0}];
var context;
var canvas;
var dpi;
var keyevents = {};

var mapSize = 100;
var fodderSpawnRate = 1;
var maxFodder = 1000;
var consumeTreshold = 1.1;
var tickSpan = 8;
var playerApparentSize = 30;
var digestionRate = 0.05;

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

  //fix dpi
  var style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
  var style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
  canvas.setAttribute('height', style_height * dpi);
  canvas.setAttribute('width', style_width * dpi);
}
function tick(){
    refresh();
    draw();
}
function refresh(){
    processKeyInput();
    digest();
    moveEntities();
    spawnFodder();
    checkCollisions();
    checkForDeath();
}
function draw(){
    var playerImg = document.getElementById("playerImage");
    var mobImg = document.getElementById("mobImage");
    var debugImg = document.getElementById("debugImage");
    var debugImgTwo = document.getElementById("debugImageTwo");
    var gridImg = document.getElementById("gridImage");
    
    //clear canvas
    var canvasWidth = document.getElementById("gameCanvas").width;
    var canvasHeight = document.getElementById("gameCanvas").height;
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    
    //draw grid
    var gridSize = playerApparentSize*8-entities[0].size;
    
    var shiftX = (entities[0].posX-entities[0].size*2)%(gridSize);
    var shiftY = (entities[0].posY-entities[0].size*2)%(gridSize);
    
    context.beginPath();
    context.strokeStyle = "#000000";
    for(var x = 0; x<canvasWidth+gridSize; x+=gridSize){
	context.moveTo(x-shiftX+entities[0].size, 0);
	context.lineTo(x-shiftX+entities[0].size, canvasHeight);
    }
    for(var y = 0; y<canvasHeight+gridSize; y+=gridSize){
	context.moveTo(0, y-shiftY+entities[0].size);
	context.lineTo(canvasWidth, y-shiftY+entities[0].size);
    }
    context.stroke();
    context.closePath();
    
    //draw player
    var digSize = (entities[0].size+entities[0].digesting)/entities[0].size*playerApparentSize;
    drawCircle(canvasWidth/2-digSize/2, canvasHeight/2-digSize/2, digSize/2, edibleColor);
    drawCircle(canvasWidth/2-playerApparentSize/2, canvasHeight/2-playerApparentSize/2, playerApparentSize/2, neutralColor);
    
    //draw objects
    for(var i = 1; i<entities.length; i++){
	var relSize = entities[i].size/entities[0].size*playerApparentSize;

	var scale = playerApparentSize/entities[0].size;
	var relX = canvasWidth/2-(entities[0].posX-entities[i].posX)*scale;
	var relY = canvasHeight/2-(entities[0].posY-entities[i].posY)*scale;
	
	if(isOnScreen(entities[i].posX, entities[i].posY, entities[i].size, canvasWidth, canvasHeight)){
	    var entityColor = neutralColor;
	    if(entities[i].size>=entities[0].size*consumeTreshold){
		entityColor = hostileColor;
	    }
	    else if(entities[0].size>=entities[i].size*consumeTreshold){
		entityColor = edibleColor;
	    }
	    drawCircle(relX-relSize/2, relY-relSize/2, relSize/2, entityColor);
	}
    }
}

//helper functions
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
    
    //accelerate
    if(dirX!==0 && dirY!==0){
	if(dirX>0 && dirY>0){
	    acceleratePlayer(2, 0.5);
	    acceleratePlayer(3, 0.5);
	}
	else if(dirX>0 && dirY<0){
	    acceleratePlayer(2, 0.5);
	    acceleratePlayer(1, 0.5);
	}
	else if(dirX<0 && dirY>0){
	    acceleratePlayer(4, 0.5);
	    acceleratePlayer(3, 0.5);
	}
	else{
	    acceleratePlayer(4, 0.5);
	    acceleratePlayer(1, 0.5);
	}
    }
    else{
	if(dirY<0){
	    acceleratePlayer(1, 1);
	}
	else if(dirY>0){
	    acceleratePlayer(3, 1);
	}
	else if(dirX<0){
	    acceleratePlayer(4, 1);
	}
	else if(dirX>0){
	    acceleratePlayer(2, 1);
	}
    }

}
function acceleratePlayer(direction, accMod){
    var accVec = 0;
    switch(direction){
	case 1:
	    accVec = new Victor(0, accMod*entities[0].acc);
	    break;
	case 2:
	    accVec = new Victor(accMod*entities[0].acc, 0);
	    break;
	case 3:
	    accVec = new Victor(0, -accMod*entities[0].acc);
	    break;
	case 4:
	    accVec = new Victor(-accMod*entities[0].acc, 0);
	    break;
    }
    
    entities[0].vel.add(accVec);
}
function moveEntities(){
    for(var i = 0; i<entities.length; i++){
	//decelerate
	var resVec = new Victor(entities[i].vel.x, entities[i].vel.y);
	resVec.x*=entities[i].dec;
	resVec.y*=entities[i].dec;
	
	if(i===0){
	    console.log("v "+entities[i].vel.toString());
	    console.log("r "+resVec.toString());
	}
	if(resVec.length()<entities[i].acc/100){
	    entities[i].vel = new Victor(0, 0);
	}
	else{
	    entities[i].vel.subtract(resVec);
	}
	
	//move
	entities[i].posX+=entities[i].vel.x;
	entities[i].posY-=entities[i].vel.y;
    
    
	//notify
	if(i===0){
	    document.title = Math.trunc(entities[i].posX)+"x "+Math.trunc(entities[i].posY)+"y "+Math.trunc(entities[i].vel.length())+"p/t s"+Math.trunc(entities[i].size);
	}

    }
}
function randInt(max, min){
    return Math.floor(Math.random() * (max - min) ) + min;
}
function spawnFodder(){
    //count fodder
    var fodderAmount = 0;
    for(var i = 0; i<entities.length; i++){
	if(entities[i].type==="fodder"){
	    fodderAmount++;
	}
    }
    if(fodderAmount>=maxFodder){
	return;
    }
    
    //spawn fodder
    var toSpawn = fodderSpawnRate;
    if(toSpawn+fodderAmount>maxFodder){
	toSpawn = maxFodder-fodderAmount;
    }
    for(var i = 0; i<toSpawn; i++){
	var size, posX, posY;
	size = entities[0].size/9;
	var attempts = 0;
	do{
	    posX = randInt(-mapSize, mapSize);
	    posY = randInt(-mapSize, mapSize);
	    if(attempts>100){
		return;
	    }
	    attempts++;
	} while(isOnScreen(posX, posY, size));
	entities[entities.length] = {type:"fodder", size:size, posX:posX, posY:posY, vel:new Victor(0, 0), dec:0, acc:0, digesting:0};
    }
}
function checkCollisions(){
    for(var o = 0; o<entities.length; o++){
	for(var i = 0; i<entities.length; i++){
	    if(i!==o){
		var distance = Math.sqrt( Math.pow(entities[o].posX-entities[i].posX, 2) + Math.pow(entities[o].posY-entities[i].posY, 2) );
		var hitDistance = entities[o].size/2+entities[i].size/2;
		if(hitDistance>=distance){
		    collide(o, i);
		}
	    }
	}
    }
}
function collide(entA, entB){
    if(entities[entA].size>entities[entB].size*consumeTreshold){
	if(entities[entA].type!=="fodder"){
	    entities[entA].digesting+=entities[entB].size*(entities[entB].size/entities[entA].size);
	    entities.splice(entB, 1);
	}
    }
    else if(entities[entB].size>entities[entA].size*consumeTreshold){
	if(entities[entB].type!=="fodder"){
	    entities[entB].digesting+=entities[entA].size*(entities[entA].size/entities[entB].size);
	    entities.splice(entA, 1);
	}
    }
}
function checkForDeath(){
    if(entities[0].type!=="player"){
	location.reload();
    }
}
function digest(){
    for(var i = 0; i<entities.length; i++){
	if(entities[i].digesting>=digestionRate){
	    entities[i].digesting-=digestionRate;
	    entities[i].size+=digestionRate;
	}
	else if(entities[i].digesting>0){
	    entities[i].size+=entities[i].digesting;
	    entities[i].digesting = 0;
	}
    }
}
function drawCircle(x, y, r, color){
    context.beginPath();
    context.fillStyle = color;
    context.strokeStyle = "#000000";
    context.arc(x+r, y+r, r, 0, 2 * Math.PI);
    context.fill();
    context.stroke()
    context.closePath();
}
function isOnScreen(x, y, size, canvasWidth, canvasHeight){
    var relSize = size/entities[0].size*playerApparentSize;
    var scale = playerApparentSize/entities[0].size;
    var relX = canvasWidth/2-(entities[0].posX-x)*scale;
    var relY = canvasHeight/2-(entities[0].posY-y)*scale;

    if(relX-canvasWidth/2<=canvasWidth/2+relSize/2 && relY-canvasHeight/2<=canvasHeight/2+relSize/2){
	return true;
    }
    return false;
}

init();
setInterval(tick, tickSpan);