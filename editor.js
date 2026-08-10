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
//superstructure divs
let metadataDIV = document.getElementById("metadata")
let rulesetDIV = document.getElementById("ruleset")

//substructure divs
let cellTypesDIV = document.getElementById("cellTypes")
let transformationsDIV = document.getElementById("transformations")
let kernelDIV = document.getElementById("kernel")

//divs that need to be filled after partial verification
let cellNamesDIV = document.getElementById("cellNames")
let colorsDIV = document.getElementById("colors")
let aToBDIV = document.getElementById("a->b")
let nieghborsNeededDIV = document.getElementById("nieghborsNeeded")
let neigborTypesTrackedDIV = document.getElementById("neigborTypesTracked")
let gridDIV = document.getElementById("grid")

//link to attatch file to.
let downloadLink = document.getElementById("download")

//button to generate link
let generationButton = document.getElementById("generateFile")

//error spot.
let errMSG = document.getElementById("errorMSG")

//hide ruleset until metadata is verified.
rulesetDIV.style.display = "none"
//hide link and button until other stuff is verified
downloadLink.style.display = "none"
generationButton.style.display = "none"

/**
	the values to serialize
*/
let jsonName = ""
let jsonBoardDimensions = [NaN, NaN]
let jsonCellSize = NaN
let jsonCellNames = []
let jsonCellColors = []
let jsonTransformations = []
let jsonNieghborsNeeded = []
let jsonNeigborTypesTracked = []
let jsonKernelDimensions = [NaN, NaN]
let jsonKernelGrid = []
let jsonKernelCenter = [NaN, NaN]

//runs all validations for metadata.
//if it passes it reveals ruleset
function validateMetadata(){
	try{
		validateName()
		jsonBoardDimensions[0] = validateSingleNum("boardXDim", "board width")
		jsonBoardDimensions[1] = validateSingleNum("boardYDim", "board height")
		jsonCellSize = validateSingleNum("cellSize", "cell size")
		validateTypeCount()
		validateTypeNames()
		validateTypeColors()
	}catch(err){
		errMSG.innerText = err.message		
		console.log(err.cause + " " + err.lineNumber)
		generationButton.style.display = "none"
		downloadLink.style.display = "none"
		return false
	}
	errMSG.innerText = ""
	rulesetDIV.removeAttribute("style")
	return true
}

metadataDIV.addEventListener("change", validateMetadata)

//validation for name
function validateName(){
	let name = document.getElementById("name")
	if (!(name.value)){
		throw new Error("You must input a name for your Automata.")
	}
	if(String(name.value).endsWith("\\")){
		throw new SyntaxError("Automata name cannot end with an excape character, aka \"\\\".")
	}
	jsonName = name.value
}

//validate type count and create cell name entries if valid.
function validateTypeCount(){
	
	let typesCount = document.getElementById("typeCount")
	validateSingleNum("typeCount", "type count")
	if (document.getElementsByName("cellNames").length != Number.parseInt(typesCount.value)){
		let tempStr0 = ""
		let tempStr1 = ""
		for (let i=0; i < Number.parseInt(typesCount.value); i++){
			tempStr0 += "<label for=\"cellName"+ i +"\" title=\"The name for one of your cell types! ("+(i+1)+")\">Cell type "+(i+1)+":</label><input id=\"cellName"+ i +"\" type=\"text\" name=\"cellNames\" required minlength=\"2\" maxlength = \"256\" size=\"26\"><br>"
			
			tempStr1 += "<label for=\"cellColor"+ i +"\" title=\"The color for one of your cell types! ("+(i+1)+")\">Cell color "+(i+1)+":</label><input id=\"cellColor"+ i +"\" type=\"color\" name=\"cellColors\" required><br>"
			
		}
		//not risky in this context.
		cellNamesDIV.innerHTML = tempStr0
		colorsDIV.innerHTML = tempStr1
	}
	
}

//validates the names of the types.
function validateTypeNames(){
	let names =	document.getElementsByName("cellNames")
	if (names.length = 0){
		return
	}
	let compString = []
	for(let i=0; i < Number.parseInt(names.length); i++){
		if (!(names[i].value)){
			throw new Error("You must input a name for cell type " + (i+1) + ".")
		}
		if(String(names[i].value).endsWith("\\")){
			throw new SyntaxError("Cell names cannot end with an excape character, aka \"\\\".")
		}
		compString.push(names[i].value)
	}
	for(let i = 0; i<Number.parseInt(compString.length); i++){
		if(compString.lastIndexOf(compString[i]) != i){
			throw new Error("You must input a unique name for cell type " + (compString.lastIndexOf(compString[i])) + ".")
		}
	}
	jsonCellNames = compString
}

//makes sure there are unique colors for every type.
function validateTypeColors(){
	let colors = document.getElementsByName("cellColors")
	if (colors.length = 0){
		return
	}
	let compString = []
	for(let i=0; i < Number.parseInt(colors.length); i++){
		compString.push(colors[i].value)
	}
	for(let i = 0; i<Number.parseInt(compString.length); i++){
		if(compString.lastIndexOf(compString[i]) != i){
			throw new Error("You must input a unique color for cell type " + (compString.lastIndexOf(compString[i])) + ".")
		}
	}
	jsonCellColors = compString
}

function validateRuleset(){
	try{
		validateTransNum()
		getAToB()
		validateNeighborsNeeded()
		validateNeigborTypesTracked()
		jsonKernelDimensions[0] = validateSingleNum("kernelXDim", "kernel width")
		jsonKernelDimensions[1] = validateSingleNum("kernelYDim", "kernel height")
		generateKernel()
		setFocalMaxima()
		jsonKernelCenter[0] = validateKernelNum("kernelXCent", "Kernel focal X")
		jsonKernelCenter[1] = validateKernelNum("kernelYCent", "Kernel focal Y")
	}catch(err){
		errMSG.innerText = err.message		
		console.log(err.cause + " "  + err.lineNumber)
		generationButton.style.display = "none"
		downloadLink.style.display = "none"
		return false
	}
	errMSG.innerText = ""
	if(generationButton.hasAttribute("style")){
		generationButton.removeAttribute("style")
	}
	return true
}

function getAToB(){
	jsonTransformations = []
	for (let i = 0; i< document.getElementsByName("aCells").length; i++){
		jsonTransformations[i] = [document.getElementById("a"+i).value,document.getElementById("b"+i).value]
	}
}

rulesetDIV.addEventListener("change", validateRuleset)
cellTypesDIV.addEventListener("change", validateRuleset)

//dropdown options.
let selection 
//validates the number of transformations generates transformations text stuff.
function validateTransNum(){
	let transNum = document.getElementById("numTransformations")
	
	validateSingleNum("numTransformations", "transformation count")

	let names =	document.getElementsByName("cellNames")
    selection = ""
	for (let i = 0; i < names.length; i++){
		selection += "<option value=\"" + names[i].value + "\">"+ names[i].value + "</option>"
	}
/**
	creates a0 to a(i) and b0 to b(i) dropdowns for a->b selection.
*/
	if (document.getElementsByName("aCells").length != Number.parseInt(transNum.value)){
		generateTransformationOptions(transNum)
	}else if(document.getElementsByName("aCells")[0].innerHTML != selection){
		for(let i = 0; i < document.getElementsByName("aCells").length; i++){
			document.getElementsByName("aCells")[i].innerHTML = selection
			document.getElementsByName("bCells")[i].innerHTML = selection
		}
	}
}

//pulled out of validateTransNum for debugging
function generateTransformationOptions(transNum){
	let aToBStr = ""
	let neighNeedStr = ""
	let neighTrackStr = ""
	for (let i=0; i < Number.parseInt(transNum.value); i++){
		//create two drop down elements for selection
		aToBStr += "<label for=\"a"+ i +"\" title=\"The cell to transform! ("+(i+1)+")\">Cell transforming "+(i+1)+":</label><select required id=\"a"+ i +"\" name=\"aCells\">"
		aToBStr += selection
		aToBStr += "</select> <b>-></b> "
		aToBStr += "<label for=\"b"+ i +"\" title=\"The transformation outcome! ("+(i+1)+")\">Transformed cell "+(i+1)+":</label><select required id=\"b"+ i +"\" name=\"bCells\">"
		aToBStr += selection
		aToBStr += "</select><br>"			
		
		neighNeedStr += "<label for=\"nieghborsNeeded"+ i +"\" title=\"Neighbors needed for transformation "+(i+1)+" to occur, accepts multiple, spaced integer values OR a single -1 to specify that this transformation should always happen regardless of neighbor count.\">Neighbors needed "+(i+1)+":</label><textarea id=\"nieghborsNeeded"+ i +"\" name=\"nieghborsNeeded\" required></textarea><br>"
		
		neighTrackStr += "<label for=\"neigborTypesTracked"+ i +"\" title=\"Neighbors types to be tracked for transformation "+(i+1)+" to occur, accepts multiple or a single cell type name.\">Types to track "+(i+1)+":</label><textarea id=\"neigborTypesTracked"+ i +"\" name=\"neigborTypesTracked\" required></textarea><br>"
	}
	//not risky in this context.
	aToBDIV.innerHTML = aToBStr
	nieghborsNeededDIV.innerHTML = neighNeedStr
	neigborTypesTrackedDIV.innerHTML = neighTrackStr
}

function validateNeighborsNeeded(){
	let neighNeed = document.getElementsByName("nieghborsNeeded")
	for (let i = 0; i < Number.parseInt(document.getElementById("numTransformations").value); i++){
		if(!neighNeed[i].value){
			throw new Error("Neighbors needed " + (i+1) + " must have an input.")
		}
		let list = regexNumbers(neighNeed[i])
		if(list.length == 0){
			throw new Error("No integer values found in Neighbors needed "+(i+1)+"!")
		}
		for(let i=0;i<list.length; i++){
			if(Number.parseInt(list[i]) < -1){
				throw new Error("Values below -1 not supported, overly negative value found in Neighbors needed " + (i+1)+"!")
			}
		}
	}
	jsonNieghborsNeeded = []
	//made sure everything was valid first.
	for (let i = 0; i < Number.parseInt(document.getElementById("numTransformations").value); i++){
		jsonNieghborsNeeded[i] = regexNumbers(document.getElementById("nieghborsNeeded" + i))
	}
}

/**
	Returns an array of integers from a parsed string.
	Supports multiline and global.
	params:
		parseable = the string to search for numbers in.
*/
function regexNumbers(parseable){
	const pattern = /-?(\d)+/gm
	let res = (parseable.value).matchAll(pattern)
	let arr = []
	res.forEach((v, i)=>arr[i] = v[0])
	return arr
}

function validateNeigborTypesTracked(){
	let neighTrack = document.getElementsByName("neigborTypesTracked")
	for (let i = 0; i < Number.parseInt(document.getElementById("numTransformations").value); i++){
		if(!neighTrack[i].value){
			throw new Error("Types to track " + (i+1) + " must have an input.")
		}
		let list = regexStr(document.getElementsByName("cellNames"), neighTrack[i])
		if(!list){
			throw new Error("No previously defined names found in Types to track "+(i+1)+"!")
		}
	}	
	//made sure everything was valid first.
	for (let i = 0; i < Number.parseInt(document.getElementById("numTransformations").value); i++){
		jsonNeigborTypesTracked[i] = regexStr(document.getElementsByName("cellNames"), document.getElementById("neigborTypesTracked" + i))
	}
}

/**
	given an array of words, searches for them using regex.
	parameters:
		list = the list of text inputs to search for.
		parseable = the textarea to search for words in.
*/
function regexStr(list, parseable){
	let regStr = ""
	for(let i = 0; i<list.length; i++){
		regStr +="("
		regStr += list[i].value
		regStr +=")"
		if(i != list.length-1){
			regStr += "|"
		}
	}
	const pattern = new RegExp(regStr, "gm")
	let res = (parseable.value).matchAll(pattern)
	let arr = []
	res.forEach((v, i)=>arr[i] = v[0])
	return arr
}

/**
	validates a single number.
	params:
		elementName = the element on document to search for.
		replySubStr = the modification to the error messages.
*/
function validateSingleNum(elementName, replySubStr){
	if (Number.isNaN(document.getElementById(elementName).valueAsNumber)){
		throw new Error("You must input a " + replySubStr)
	}
	if (!Number.isInteger(document.getElementById(elementName).valueAsNumber)){
		throw new RangeError("You must input an integer "+ replySubStr)
	}
	return document.getElementById(elementName).valueAsNumber
}
/**
	validates a single number.
	params:
		elementName = the element on document to search for.
		replySubStr = the modification to the error messages.
*/
function validateKernelNum(elementName, replySubStr){
	if (Number.isNaN(document.getElementById(elementName).valueAsNumber)){
		throw new Error("You must input a " + replySubStr)
	}if (!Number.isInteger(document.getElementById(elementName).valueAsNumber)){
		throw new RangeError("You must input an integer "+ replySubStr)
	}
	return document.getElementById(elementName).valueAsNumber
}

function setFocalMaxima(){
	let focX = document.getElementById("kernelXCent")
	let focY = document.getElementById("kernelYCent")
	let kernWidth = document.getElementById("kernelXDim").valueAsNumber - 1
	let kernHeight = document.getElementById("kernelYDim").valueAsNumber - 1
	focX.setAttribute("max", kernWidth)
	focY.setAttribute("max", kernHeight)
}

let grid = []
let canvas
function generateKernel(){
	if(!(document.getElementById("kernelGrid"))){
		gridDIV.innerHTML = "<i>Draw your kernel!</i><br><canvas id=\"kernelGrid\">"
		document.getElementById("kernelGrid").addEventListener("click", toggleCell)
		document.getElementById("kernelGrid").addEventListener("mousemove", drawBoard)
		document.getElementById("kernelGrid").addEventListener("mouseleave", drawBoard)
		
	}
	canvas = document.getElementById("kernelGrid")	
	let kernWidth = document.getElementById("kernelXDim").value
	let kernHeight = document.getElementById("kernelYDim").value
	if(canvas.width == kernWidth * 10 && canvas.height == kernHeight * 10){
		return;
	}
	canvas.setAttribute("width", kernWidth * 10)
	canvas.setAttribute("height", kernHeight * 10)
	grid = new Array(kernWidth * kernHeight)
	grid.fill(1)
	drawBoard()
}

/**
	draws the entire board in one go.
*/
function drawBoard(){
	let ctx = canvas.getContext("2d")
	for(let i_width = 0; i_width < canvas.width/10; i_width++){
		for(let i_height = 0; i_height < canvas.height/10; i_height++){
			ctx.fillStyle = cellColors[getCell(i_width, i_height)];
			ctx.fillRect(i_width* 10, i_height* 10, 10,10);
		}
	}
	jsonKernelGrid = grid
}

/**
	gets a cell at a certain location.
	Params:
		x = the x location of the cell
		y = the y location of the cell
*/
function getCell(x, y){
	return grid[y * canvas.width/10 + x];
}

/**
	Draws a highlight of the current cell being hovered over on the board.
*/
cellNames = [1,2]
cellColors = ["#000000","#ffffff"]
function toggleCell(e){
	setCell(Math.floor(e.offsetX / 10), Math.floor(e.offsetY / 10), (getCell(Math.floor(e.offsetX / 10), Math.floor(e.offsetY / 10)) + 1)%cellNames.length)
	drawBoard()
}

/**
	sets a cell at a certain location.
	Params:
		x = the x location of the cell
		y = the y location of the cell
		value = the value to set the cell to, 0 by default.
*/
function setCell(x, y, value = 0){
	grid[y * canvas.width/10 + x] = value;
} 

let currentExport
let exportURL
function generateJson(){
	console.log(jsonNieghborsNeeded)
	console.log(jsonNeigborTypesTracked)
	currentExport = new File([
	'{\
	"automataName" :' + JSON.stringify(jsonName) + ',\
	"boardDimensions" : ' + JSON.stringify(jsonBoardDimensions) + ',\
	"cellSize" : ' + JSON.stringify(jsonCellSize) + ',\
	"cellNames" : ' + JSON.stringify(jsonCellNames) + ',\
	"cellColors": ' + JSON.stringify(jsonCellColors) +',\
	"rules":{\
		"transformations" : {\
			"a->b" : ' + JSON.stringify(jsonTransformations) + ',\
			"nieghborsNeeded" : ' + JSON.stringify(jsonNieghborsNeeded) + ',\
			"neigborTypesTracked" : ' + JSON.stringify(jsonNeigborTypesTracked) + '\
		},\
		"kernel" : {\
			"dimensions" : ' + JSON.stringify(jsonKernelDimensions) + ',\
			"grid" : ' + JSON.stringify(jsonKernelGrid) + ',\
			"center" : ' + JSON.stringify(jsonKernelCenter) + '\
		}\
	}\
}'], "ruleset_" + jsonName + "_" + Date.now() + ".json", {type: "application/json"})
	exportURL = URL.createObjectURL(currentExport)
	downloadLink.setAttribute("href", exportURL)
	downloadLink.removeAttribute("style")
	alert("Ruleset generated!\nPlease download your work!")
}

generationButton.addEventListener("click", generateJson)