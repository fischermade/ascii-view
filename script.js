"use strict";

const displayer = document.querySelector("#grid");
const chars = {
	".": ".",
	"0": "0",
	"_":"_",
	"-":"-",
	",":",",
	"!":"!",
	"#":"#",
	"/":"/",
	"\\":"\\",
	"O":"O",
	"player":"&",
	"^":"^",
	"%":"%",
	"$":"$",
	"@":"@",
	"*":"*",
	"(":"(",
	"+":"+",
	"|":"|"
}
function makeBlank(width,height) {
	let grid = [];
	for (let y = 0; y < height; y++){
		let row = [];
		for (let x =0; x < width; x++) {
			row.push(".");
		}
		grid.push(row);
	}
	grid[0] = grid[0].map(j => "-");

	grid[grid.length-1] = grid[grid.length-1].map(j => "_");
	for (let y = 0; y < grid.length; y++){
		grid[y][0] = "|";
		grid[y][grid[y].length-1] = "|";
	}
	return grid;
}

class Vec2 {
	constructor(x,y) {
		this.x = x; this.y = y;
	}
	plus(other) {
		let sumVec = new Vec2(this.x + other.x, this.y+other.y);
		return sumVec;
	}
	times(factor) {
		return new Vec2(this.x * factor, this.y * factor);
	}
}
class Line{
	constructor(vec1, vec2){
		this.start = vec1; this.end= vec2; 
		this.points = [];
		// define width of line
		if (vec1.y > vec2.y) {
			this.height = vec1.y - vec2.y;
		} else {	this.height = vec2.y - vec1.y;}
		if (vec1.x > vec2.x) {
			this.width = vec1.x - vec2.x;
		} else {	this.width = vec2.x - vec1.x;}
		
		// horizontal line
		if (vec1.y == vec2.y) {
			for (let r = 0; r < this.width; r++) {
				this.points.push(new Vec2(vec1.x+r, vec1.y));
			}
		} else if (vec1.x == vec2.x) { // vertical line
			for (let c = 0; c < this.height; c++) {
				this.points.push(new Vec2(vec1.x, vec1.y+c));
			}
		} else { //diagonal lines
			let angle = Math.atan(this.height / this.width);
			let dist = Math.round(Math.tan(angle) * this.width);
			for (let curr = 0; curr < this.width; curr++) {
				let offH = Math.round(Math.tan(angle) * curr);
				if (vec1.y < vec2.y) {
					this.points.push(new Vec2(vec1.x + curr, vec1.y + offH));
				} else {
					this.points.push(new Vec2(vec1.x + curr, vec1.y - offH));
				}
			}
		}
		
	}
}
class Rect {
	constructor(x,y,width,height,sheer = 0) {
		this.points =[];
		let vec1, vec2;
		for (let i =0; i < height; i++) {
			
			if (sheer >= 0) {

				vec1 = new Vec2(0+x, y+i);
				vec2 = new Vec2(0+x+width, y+i + sheer);
			} 	else if (sheer < 0) {
				 vec1 = new Vec2(0+x, y - i + height+1);
				vec2 = new Vec2(0+x+width,  y -i  + sheer + height);

			}
			
			let line = new Line(vec1, vec2);
			this.points = this.points.concat(line.points);
		}
		
	}
}
class Actor {
	constructor(shape,type,vel, z_index){
		this.shape = shape; this.type = type; this.vel = vel; this.z_index = z_index;
	}
}

class TextItem {
	constructor(x,y,width,height, text) {
		this.shape = new Rect (x,y,width,height);
		let full = text;
		let split = [];
		for (let i = 0; i < full.length; i++) {
			
			let line = Array.from(full.substring(i,i+width-2));
			console.log(full[i+width-1]);
			console.log(full[i+width+1]);
			split.push(line);
			full = full.slice(i+width-3);
		
			
		}
		this.text = split;
		this.pos = new Vec2(x+1,y+1);
	}
}
class State {
	constructor(scroll, dimensions, grid, actorList, bgList,textList) {
		this.scroll = scroll;
		this.width=dimensions[0];
		this.height = dimensions[1];
		this.grid = grid;
		this.actorList = actorList;
		this.bgList = bgList;
		this.textList = textList;
	}
	update() {
		let newGrid = build(makeBlank(...bounds),this.bgList);
		this.scroll.x -= dir.x; 
		this.scroll.y += dir.y; 
		if (this.scroll.x < 0) {
			this.scroll.x=0;
		}if (this.scroll.x + (this.width) > newGrid[0].length){
			this.scroll.x -=1;
		}
		if (this.scroll.y < 0) {
			this.scroll.y=0;
		}
		if ((this.scroll.y ) > this.grid.length ){
			this.scroll.y= this.grid.length;
		}
		// handle moving parts
		for (let actor of this.actorList) {
				for (let point of actor.shape.points){

					if (point.x >= this.width && actor.vel.x > 0) {
						point.x -= this.width;
					} else if (point.x <0 && actor.vel.x < 0) {
						point.x += this.width;
					}
					else {
						point.x += actor.vel.x;
					}
					// handle y movement
					if (point.y == newGrid.length -1 && actor.vel.y > 0) {point.y -= newGrid.length -1;} 
					else if (point.y == 0 && actor.vel.y <= 0){point.y = Math.round(point.y+  newGrid.length -1)}
						
					else {
						point.y += actor.vel.y;
					}
					if (!newGrid[point.y]) {
						if (actor.vel.y > 0){point.y -= newGrid.length -1;}
							else if (actor.vel.y < 0) {point.y = point.y + newGrid.length;}
					} 
					newGrid[Math.round(point.y)][Math.round(point.x)] = chars[actor.type];
				}
		}
		dir.x = 0; dir.y = 0;



		return new State(this.scroll, [this.width, this.height], newGrid, this.actorList,this.bgList,this.textList);
	}
}


function build(grid,bgList) {
	let gridCopy = grid;
	for (let item of bgList){
		for (let vector of item.shape.points){
			if (vector.x < 0) {vector.x=0;}
				else if (vector.x > gridCopy.length) {vector.x = gridCopy.length;}
			if (vector.y < 0) {vector.y=0;}
				else if (vector.y >= gridCopy[0].length) {vector.y = gridCopy[0].length -1;}	
			gridCopy[vector.y][vector.x] = item.type;
		}	
	}
	return gridCopy;

}
function bgPush(shape, type,z_index = 0) {
	bgList.push({shape:shape, type: type,z_index: z_index});
}
// main drawing function
function draw(state) {
	let winX =state.scroll.x, winY=state.scroll.y, heightV =state.height,widthV=state.width;
	let display = state.grid;
	let bgList = state.bgList;


	// draw text
	for( let item of state.textList) {

		for (let e of item.shape.points) {

			display[Math.round(e.y)][Math.round(e.x)] = "&nbsp;";
		}
		for(let r = 0; r < item.text.length; r++) {
			for (let c=0; c < item.text[r].length; c++) {
				display[r+item.pos.y][c+item.pos.x] = item.text[r][c];
			}
		}
	}

	// clip to viewport
	for (let row in display){
		display[row] = display[row].splice(winX,widthV);
	}
	display = display.splice(winY,heightV);

	let joinedGrid = [];
	for (let row of display) {
		joinedGrid.push(row.join(''));
	}
	displayer.innerHTML = joinedGrid.join('<br/>');

	mainState.update(dir);
}
let actorList = [];
const player = new Actor(new Rect(16,4,2,15),"player", new Vec2(2,1));
const obj2 = new Actor(new Rect(20,6,4,4,2),"#", new Vec2(0,1));


//clouds

actorList.push(new Actor(new Rect(28,3,24,4,-4),",", new Vec2(0.07,0)));
actorList.push(new Actor(new Rect(20,6,24,4,2),",", new Vec2(0.05,0)));

actorList.push(new Actor(new Rect(1,22,30,2,-4),",", new Vec2(0.03,0)));
actorList.push(new Actor(new Rect(5,28,30,2,-5),",", new Vec2(0.04,0)));
actorList.push(new Actor(new Rect(16,22,30,2,-2),",", new Vec2(0.05,0)));

actorList.push(new Actor(new Rect(1,7,14,3,3),",", new Vec2(0.07,0)));
actorList.push(new Actor(new Rect(15,7,14,3,-3),".", new Vec2(0.07,0)));
// rain
actorList.push(new Actor(new Rect(20,6,1,3,2),"|", new Vec2(0.06,1)));
actorList.push(new Actor(new Rect(5,2,1,3,2),"|", new Vec2(0.01,1)));
actorList.push(new Actor(new Rect(6,2,1,1,3),"|", new Vec2(0.06,2)));

actorList.push(new Actor(new Rect(6,2,1,1),".", new Vec2(0.5,1)));

actorList.push(new Actor(new Rect(18,8,1,1),".", new Vec2(0.5,1)));
actorList.push(new Actor(new Rect(9,15,1,3),"|", new Vec2(0,3)));

actorList.push(new Actor(new Rect(16,14,1,1,2),"|", new Vec2(0.01,1)));
actorList.push(new Actor(new Rect(20,2,1,3,2),"|", new Vec2(0.03,3)));

actorList.push(new Actor(new Rect(12,24,1,1,2),"|", new Vec2(0.01,2)));
actorList.push(new Actor(new Rect(28,16,1,2,2),"|", new Vec2(0.011,2)));

//car

// horizontal pane

actorList.push(new Actor(new Rect(0,0,30,1),"-", new Vec2(0,0)));
actorList.push(new Actor(new Rect(1,15,30,1),"_", new Vec2(0,0)));
actorList.push(new Actor(new Rect(1,16,30,1),"\\", new Vec2(0,0)));

actorList.push(new Actor(new Rect(1,29,30,1),"_", new Vec2(0,0)));
actorList.push(new Actor(new Rect(1,30,30,2),"\\", new Vec2(0,0)));
// vertical pane
actorList.push(new Actor(new Rect(0,1,1,32,2),"|", new Vec2(0,0)));

actorList.push(new Actor(new Rect(31,1,1,32,2),"|", new Vec2(0,0)));
actorList.push(new Actor(new Rect(1,1,1,32,2),"!", new Vec2(0,0)));
actorList.push(new Actor(new Rect(15,1,1,32,2),"!", new Vec2(0,0)));
actorList.push(new Actor(new Rect(16,2,1,32,2),"\\", new Vec2(0,0)));


let text1 = "oh, there i go again, getting all nostalgic"
const textOb1 = new TextItem(4,24,24,4,text1);
const textList = [];
textList.push(textOb1);
const bgList =[];
bgPush(new Rect(1,1,30,30), "@");
bgPush(new Rect(1,1,30,18,4), "#");
bgPush(new Rect(1,16,30,1,4), "!");
bgPush(new Rect(1,1,30,12,4), "@");
bgPush(new Rect(1,1,30,8,3), ".");

bgPush(new Rect(1,1,30,8), ".");

bgPush(new Rect(3,2,3,4),"^");
bgPush(new Rect(3,3,3,4),"|")

const dir = new Vec2(0,0);
const bounds = [32,64];
const view = [32,32];
const gridSize = makeBlank(...bounds);
const mainGrid = build(gridSize,bgList);
const mainState = new State(new Vec2(0,0), view, mainGrid, actorList, bgList,textList);

function getKeys(e){
	// 38 up 40 down 37 left 39 right
	if (e.keyCode == 38){
		dir.y=-1;
	}
	else if (e.keyCode == 40) {	
		dir.y=1;
	}
	else if (e.keyCode == 37) { 
		dir.x=1;
	}
	else if (e.keyCode == 39) {	
		dir.x=-1;
	}
}
document.body.addEventListener('keydown', getKeys);




//actually run the dang thing
let status = 0;
function main() {
	if (status == 0) {
		draw(mainState);
		status = 1
	} else if (status==1){
	draw(mainState.update());
	}
	else if (status ==2){}
}
setInterval(main,100);