
var entities = [{type:"player", size:36, posX:10, posY:10, velX:0, velY:0, maxVel:10, dec:0.25, acc:1}, {type:"mob", size:72, posX:200, posY:300, velX:0.5, velY:0.1, maxVel:10, dec:0, acc:1}];
var context;
var canvas;
var dpi;
var keyevents = {};

var mapSize = 500;
var fodderSpawnRate = 1;
var maxFodder = 100;
var consumeTreshold = 1.1;

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
    moveEntities();
    spawnFodder();
    checkCollisions();
    checkForDeath();
}
function draw(){
    var playerImg = document.getElementById("playerImage");
    var mobImg = document.getElementById("mobImage");
    
    //clear canvas
    var canvasWidth = document.getElementById("gameCanvas").width;
    var canvasHeight = document.getElementById("gameCanvas").height;
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    
    //draw grid
    var gridDensity = 8;
    
    var shiftX = entities[0].posX%(canvasWidth/gridDensity);
    var shiftY = entities[0].posY%(canvasWidth/gridDensity);
    
    context.beginPath();
    for(var x = 0; x<canvasWidth+canvasWidth/gridDensity; x+=canvasWidth/gridDensity){
	context.moveTo(x-shiftX, 0);
	context.lineTo(x-shiftX, canvasHeight);
    }
    for(var y = 0; y<canvasHeight+canvasWidth/gridDensity; y+=canvasWidth/gridDensity){
	context.moveTo(0, y-shiftY);
	context.lineTo(canvasWidth, y-shiftY);
    }
    context.stroke();
    context.closePath();
    
    //draw player
    context.drawImage(playerImg, canvasWidth/2-entities[0].size/2, canvasHeight/2-entities[0].size/2, entities[0].size, entities[0].size);
    
    //draw objects
    for(var i = 1; i<entities.length; i++){
	var relX = -(entities[0].posX-entities[i].posX);
	var relY = -(entities[0].posY-entities[i].posY);
	context.drawImage(mobImg, canvasWidth/2+relX-entities[i].size/2, canvasHeight/2+relY-entities[i].size/2, entities[i].size, entities[i].size);
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
    console.log(entities[0].velX+" "+entities[0].velY);
    switch(direction){
	case 1:
	    entities[0].velY-=entities[0].acc*accMod;
	    if(entities[0].velY<-entities[0].maxVel){
		entities[0].velY = -entities[0].maxVel;
	    }
	    break;
	case 2:
	    entities[0].velX+=entities[0].acc*accMod;
	    if(entities[0].velX>entities[0].maxVel){
		entities[0].velX = entities[0].maxVel;
	    }
	    break;
	case 3:
	    entities[0].velY+=entities[0].acc*accMod;
	    if(entities[0].velY>entities[0].maxVel){
		entities[0].velY = entities[0].maxVel;
	    }
	    break;
	case 4:
	    entities[0].velX-=entities[0].acc*accMod;
	    if(entities[0].velX<-entities[0].maxVel){
		entities[0].velX = -entities[0].maxVel;
	    }
	    break;
    }
}
function moveEntities(){
    for(var i = 0; i<entities.length; i++){
	var x = entities[i].velX;
	var y = entities[i].velY;
	var z = Math.sqrt(x*x+y*y);
	var A = B = C = 0;

	//correct according to max velocity
	if(z>entities[i].maxVel){
	    C = Math.PI/2;
	    A = Math.atan(Math.abs(y/x));
	    B = Math.PI-(C+A);

	    y = entities[i].maxVel*Math.sin(A)/Math.sin(C);
	    x = entities[i].maxVel*Math.sin(B)/Math.sin(C);

	    //correct direction
	    if(entities[i].velX<0){
		x = -x;
	    }
	    if(entities[i].velY<0){
		y = -y;
	    }
	}

	//move
	entities[i].posX+=x;	
	entities[i].posY+=y;

	//set title (for debug purposes only I guess)
	if(i===0){
	    document.title = Math.trunc(entities[0].posX)+"x "+Math.trunc(entities[0].posY)+"y "+Math.trunc(Math.sqrt(x*x+y*y))+"p/t "+Math.trunc(entities[0].size);
	}

	//decelerate
	if(Math.abs(x)<2*entities[i].dec){
	    x = 0;
	    entities[i].velX = x;
	}
	if(Math.abs(y)<2*entities[i].dec){
	    y = 0;
	    entities[i].velY = y;
	}
	if(x!==0 && y!==0){
	    C = Math.PI/2;
	    A = Math.atan(Math.abs(y/x));
	    B = Math.PI-(C+A);


	    u = Math.sqrt(x*x+y*y)-entities[i].dec;
	    y = u*Math.sin(A)/Math.sin(C);
	    x = u*Math.sin(B)/Math.sin(C);

	    //correct directions
	    if(entities[i].velX<0){
		x = -x;
	    }
	    if(entities[i].velY<0){
		y = -y;
	    }

	    entities[i].velX = x;
	    entities[i].velY = y;
	}
	else if(x===0 && y!==0){
	    if(y>0){
		entities[i].velY-=entities[i].dec;
		if(entities[i].velY<0){
		    entities[i].velY = 0;
		}
	    }
	    else{
		entities[i].velY+=entities[i].dec;
		if(entities[i].velY>0){
		    entities[i].velY = 0;
		}
	    }
	}
	else if(x!==0 && y===0){
	    if(x>0){
		entities[i].velX-=entities[i].dec;
		if(entities[i].velX<0){
		    entities[i].velX = 0;
		}
	    }
	    else{
		entities[i].velX+=entities[i].dec;
		if(entities[i].velX>0){
		    entities[i].velX = 0;
		}
	    }
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
	size = 9;
	posX = randInt(-mapSize, mapSize);
	posY = randInt(-mapSize, mapSize);
	entities[entities.length] = {type:"fodder", size:size, posX:posX, posY:posY, velX:0, velY:0, maxVel:0, dec:0, acc:0};
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
	    entities[entA].size+=entities[entB].size*(entities[entB].size/entities[entA].size);
	    entities.splice(entB, 1);
	}
    }
    else if(entities[entB].size>entities[entA].size*consumeTreshold){
	if(entities[entB].type!=="fodder"){
	    entities[entB].size+=entities[entA].size*(entities[entA].size/entities[entB].size);
	    entities.splice(entA, 1);
	}
    }
    
    
}
function checkForDeath(){
    if(entities[0].type!=="player"){
	location.reload();
    }
}

init();
setInterval(tick, 16);