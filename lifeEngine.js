/**
	Open source JS based engine for cellular life, written with notepad++
    Copyright (C) 2026  Austin Charles Hunt

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

//user can specify their own JSON to have as a ruleset.
let JFileInput = document.getElementById("JInput")
//I can't load a file from the local user drive because, web security reasons, so I put the entire JSON file inside a variable :)
let defaultRules = '{\
	"automataName" : "Conway\'s game of life + ghosts",\
	"boardDimensions" : [150, 100],\
	"cellSize" : 5,\
	"cellNames" : ["dead", "alive", "ghost"],\
	"cellColors": ["#333333","#CCCCCC", "#676767"],\
	"rules":{\
		"transformations" : {\
			"a->b" : [\
				["dead", "alive"],\
				["ghost", "alive"],\
				["alive", "alive"],\
				["alive", "ghost"],\
				["ghost", "dead"]\
			],\
			"nieghborsNeeded" : [\
				[3],\
				[3],\
				[2, 3],\
				[-1],\
				[-1]\
			],\
			"neigborTypesTracked" : [\
				["alive"],\
				["alive"],\
				["alive"],\
				["alive"],\
				["alive"]\
			]\
		},\
		"kernel" : {\
			"dimensions" : [3, 3],\
			"grid" : [1, 1, 1,\
					  1, 0, 1,\
					  1 ,1 ,1],\
			"center" : [1,1]\
		}\
	}\
}'

JFileInput.addEventListener("change", loadCustom)
document.getElementById("loadDefault").addEventListener("click", loadDefault)

const board = document.getElementById("Board").getContext("2d")

//lynchpin that prevents user from running while there's nothing under the hood.

//Finally, the necessary variables for the engine to work.
//grid stuff.
let grid
let nextGrid
let resetGrid
let width
let height
let cellSize
//actual rules
let cellNames
let cellColors
let aToB
let neighborsNeeded
let neighborsTypes
let kernelGrid
let kernelCenter
let kernelDimensions

/**
	hides loaders after ruleset is established, shows simulation controls.
*/
function hideLoaders(){
	document.getElementById("Loaders").style.display = "none"
	document.getElementById("Controls").style.display = "block"
}

/**
	prepares the board and grids for first execution.
*/
function prepBoard(){	
	grid = createGrid()
	nextGrid = createGrid()
	resetGrid = createGrid()
	document.getElementById("Board").height = height * cellSize
	document.getElementById("Board").width = width * cellSize
	randomizeBoard();
	drawBoard();
}

/**
	wraps cell values to ensure grabbing a real cell.
*/
function getWrappedCell(x, y){
	return grid[wrapCellCoord(y,height) * width + wrapCellCoord(x, width)];
}

/**
	wraps a coordinate in a direction.
	Params:
		coord = x, y, or z or any other coordinate to wrap.
		dimension = the size of the axis to wrap around.
*/
function wrapCellCoord(coord, dimension){
	return ((coord+dimension) % dimension);
}

/**
	gets a particular cell from any grid.
	params:
		x = the x location of the cell
		y = the y location of the cell
		grid = the array to grab a cell from.
		f_width = width of the grid to grab a cell from.
*/
function getAnyCell(x, y, grid, f_width){
	return grid[y * f_width + x];
}

/**
	sets a cell at a certain location.
	Params:
		x = the x location of the cell
		y = the y location of the cell
		value = the value to set the cell to, 0 by default.
*/
function setAnyCell(x, y, value = 0){
	grid[y * width + x] = value;
}

/**
	counts neighbors of a specified type within the range of a kernel.
	Params:
		x = cell x position to get neighbors of.
		y = cell y position to get neighbors of.
		kern_cent_x = 'center' x position of the kernel.
		kern_cent_y = 'center' y position of the kernel.
		kernel = the kernel to search with, true means "count this cell in calculation", false means "exclude this cell from calculation."
		value = the type of cell to count, counts 0 by default.
*/
function countNeighbors(x, y, value = 0, kern_cent_x, kern_cent_y, kernel, kern_width){
	if(!kern_cent_x){
		return countNeighborsSimple(x, y, value)
	}
	let m_number = 0
	for (let f_x = 0; f_x < kern_width; f_x++){
		for (let f_y = 0; f_y < kern_width; f_y++){
			if(getAnyCell(f_y , f_x, kernel, kern_width) == true && getWrappedCell(x - kern_cent_x + f_x, y - kern_cent_y + f_y) == value){
			m_number+=1
			}
		}
	}
	return m_number
}

/**
	sub in known values for search kernel.
*/
function countNeighborsSimple(x, y, value){
	return countNeighbors(x, y, value, kernelCenter[0], kernelCenter[1], kernelGrid, kernelDimensions[0]);
}

/**
	it copies the contents of nextGrid into grid
*/
function swapGrids(){
	grid = JSON.parse(JSON.stringify(nextGrid))
}

/**
	it copies the contents of grid into resetGrid
*/
function saveGrid(){
	resetGrid = JSON.parse(JSON.stringify(grid))
}

/**
	it copies the contents of resetGrid into grid 
*/
function loadGrid(){
	grid = JSON.parse(JSON.stringify(resetGrid))
}

let osCanvas 
/**
	draws the entire board in one go.
*/
function drawBoard(){
	osCanvas= new OffscreenCanvas(width*cellSize, height*cellSize)
	let ctx = osCanvas.getContext("2d")
	for(let i_width = 0; i_width < width; i_width++){
		for(let i_height = 0; i_height < height; i_height++){
			ctx.fillStyle = cellColors[getCell(i_width, i_height)];
			ctx.fillRect(i_width* cellSize, i_height* cellSize, cellSize,cellSize);
		}
	}
	board.drawImage(osCanvas,0,0)
}

/**
	gets a cell at a certain location.
	Params:
		x = the x location of the cell
		y = the y location of the cell
*/
function getCell(x, y){
	return grid[y * width + x];
}

/**
	Lies. Creates a 1d array that can be accessed like a 2d grid via the getCell function.
	Params: 
		f_width = the width of the grid
		f_height = the height of the grid
*/
function createGrid(f_width=width, f_height=height) {
    let arr = new Array(f_height*f_width)
    for (let i = 0; i < f_height*f_width; i++) {
		arr[i] = 0;
    }
    return arr;
}

/**
	the loading function.
	Params:
		input = text, expected to be a very specifically formatted JSON, Validation does not occur here.
*/
function load(input){
	let ruleset = JSON.parse(input)
	console.log(ruleset)
	cellNames = ruleset["cellNames"]
	cellColors = ruleset["cellColors"]
	aToB = ruleset["rules"]["transformations"]["a->b"]
	neighborsNeeded = ruleset["rules"]["transformations"]["nieghborsNeeded"]
	neighborsTypes = ruleset["rules"]["transformations"]["neigborTypesTracked"]
	kernelGrid = ruleset["rules"]["kernel"]["grid"]
	kernelCenter = ruleset["rules"]["kernel"]["center"]
	kernelDimensions = ruleset["rules"]["kernel"]["dimensions"]
	width = ruleset["boardDimensions"][0]
	height = ruleset["boardDimensions"][1]
	cellSize = ruleset["cellSize"]
	alert(ruleset["automataName"] + " has been loaded.")
	hideLoaders()
	//Prepare the board!
	prepBoard()
}

/**
	superfunction to load, uses defaultRules, made explicitly to avoid shoving events into load, which it does not handle.
*/
function loadDefault(){
	load(defaultRules)
}

/**
	attempts to load a JSON file provided by the user, and tries to provide helpful error messages.
*/
async function loadCustom(){
	let ruleset
	if('files' in JFileInput && JFileInput.files[0].type == "application/json"){
		ruleset = await JFileInput.files[0].text()
	}else{
		alert("Not a JSON file!")
		return
	}
	try{
		load(ruleset)
	}catch(err){
		alert("Something in your JSON was not valid!" + "\n" + err.text)
	}
}

/**
	Progresses the simulation 1 state.
*/
function step(){
	//for every cell in order from the front, order of cells should not matter.
	for(let loc = 0; loc < width*height; loc++){
		// There will always be a default of 0, so even if the rules don't handle something, a valid state will always be chosen.
		let nextCell = grid[loc];
		//for every cell type in order from the front
		cellTypeLoop : for(let cellNameLoc = 0; cellNameLoc < cellNames.length; cellNameLoc++){
			//for every transformation rule in order from the front.
			for(let tfLoc = 0; tfLoc < aToB.length; tfLoc++){
				//if the cellname and cell location don't match
				//or 
				//the cell name and the transformation start don't match
				if(cellNameLoc != grid[loc] || cellNames[cellNameLoc] != aToB[tfLoc][0]){
					//skip to next iteration.
					continue;
				}
				//otherwise, if it's a 'for all cases' rule
				//(-1 is a for all cases rule.)
				if(neighborsNeeded[tfLoc][0] == -1){
					//transform.
					nextCell = cellNames.findIndex((name) => {return name == aToB[tfLoc][1]});
					continue;
				}
				//otherwise
				//count the neigbors
				let neighbors = 0;
				//count all neighbor types we need to track.
				neighborsTypes[tfLoc].forEach((e, i, a)=> (neighbors += countNeighbors( loc % width, Math.floor(loc / width), cellNames.findIndex((name)=>{return name == e}))))
				//if we have the right amount of neigbors
				if(neighborsNeeded[tfLoc].find((needed)=>{return needed == neighbors})){
					//transform.
					nextCell = cellNames.findIndex((name)=>{return name == aToB[tfLoc][1]});
					continue cellTypeLoop;
				}
			}
		}
		//set the cell location.
		nextGrid[loc] = nextCell;
	}
	//update the current grid.
	swapGrids();
}

/**
	uses JavaScript's random to generate a random board of all cell types. JavaScript's Math.random should be roughly uniform and I've seen that. I might want to make my own random function sometime in the future that I can seed for testing purpouses.
*/
function randomizeBoard(){
	let max = cellNames.length
	for(let i = 0; i < grid.length; i++){
		grid[i] = Math.floor(Math.random()*max)
	}
}

let loop
let times // future stuff.

function loopStep(){
    let time = performance.now()
	if (times>0){
		times -= 1
	}
	step()
	drawBoard()
	//should be a safe amount for any browser to run the thing.
	time = Math.ceil((performance.now() - time) * 2)
	if(times != 0){
		loop = setTimeout(loopStep, time)
	}
}

//event listener attatchments.
//could maybe extract some of these into their own functions?
document.getElementById("Random").addEventListener("click", ()=>{randomizeBoard(); drawBoard()})
document.getElementById("Start").addEventListener("click", ()=>{clearInterval(loop); times = -1; loopStep()})
document.getElementById("Stop").addEventListener("click", ()=>{clearInterval(loop), drawBoard()})
document.getElementById("Reset").addEventListener("click", ()=>{grid = createGrid(); drawBoard()})
document.getElementById("Save").addEventListener("click", ()=>saveGrid())
document.getElementById("Load").addEventListener("click", ()=>{loadGrid(); drawBoard()})
document.getElementById("Sort").addEventListener("click", ()=>{grid.sort(), drawBoard()})
document.getElementById("Step").addEventListener("click", ()=>{step(); drawBoard()})