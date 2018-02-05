let parameters = {
    modulationAmplitude: 1,
    duration: 40,
    modulationLowFrequency: 10,
    modulationHighFrequency: 20,
    lowFrequency: 10,
    highFrequency: 10*2,
    volume: 0.3,
    cellBlocked: 'square',
    cellTwoOppositeOpennings: 'triangle',
    cellOther: 'sine',
    moveVertical: 'square',
    moveHPositive: 'triangle',
    moveHNegative: 'sine',
    version: 'normal'
}

var gui = new dat.GUI();

gui.add(parameters, 'modulationAmplitude', 1, 500, 1);
gui.add(parameters, 'duration', 1, 500, 1);
gui.add(parameters, 'modulationLowFrequency', 1, 500, 10);
gui.add(parameters, 'modulationHighFrequency', 1, 500, 10);
gui.add(parameters, 'lowFrequency', 0.1, 100, 10);
gui.add(parameters, 'highFrequency', 0.1, 100, 10);
gui.add(parameters, 'volume', 0, 1);
gui.add(parameters, 'cellBlocked', ['square', 'triangle', 'sine']);
gui.add(parameters, 'cellTwoOppositeOpennings', ['square', 'triangle', 'sine']);
gui.add(parameters, 'cellOther', ['square', 'triangle', 'sine']);
gui.add(parameters, 'moveVertical', ['square', 'triangle', 'sine']);
gui.add(parameters, 'moveHPositive', ['square', 'triangle', 'sine']);
gui.add(parameters, 'moveHNegative', ['square', 'triangle', 'sine']);
gui.add(parameters, 'version', ['normal', 'bug']);


var audioContext = new (window.AudioContext || window.webkitAudioContext)();

var gainNode = audioContext.createGain();
gainNode.connect(audioContext.destination);
gainNode.gain.value = 0.1;

var canvas = document.getElementById('canvas');
paper.setup(canvas);

let path = new paper.Path();
path.strokeWidth = 1;
path.strokeColor = 'black';

let nCells = 100;
let grid = [];

for(let i=0 ; i<nCells ; i++) {
	grid.push([]);
	for(let j=0 ; j<nCells ; j++) {
		grid[i].push(0);
	}
}

let gridSize = Math.min(paper.view.size.width, paper.view.size.height);
let cellSize = gridSize / nCells;

const CELL_FILLED = 0;
const CELL_BLOCKED = 1;
const CELL_HAS_ONLY_TWO_OPPOSITE_OPENNINGS = 2;
const CELL_OPENNED = 3;
const CELL_NEW = 4;

function cellToPoint(cell) {
	// return new paper.Point(paper.view.center.x-cell.x*cellSize-gridSize/2, paper.view.center.y-cell.y*cellSize-gridSize/2);
	return paper.view.center.add(cell.multiply(cellSize).subtract(gridSize/2));
}

function randomCell() {
	return new paper.Point(1+Math.floor(Math.random()*(nCells-1)), 1+Math.floor(Math.random()*(nCells-1)));
}

let currentCell = randomCell();
// let currentCell = new paper.Point(nCells-2, 1);

function goToCell(cell, state) {
    let delta = currentCell.subtract(cell)

    let f = Math.abs(delta.x) > 0 ? cell.x / nCells : cell.y / nCells;
    let frequency = parameters.lowFrequency + f * (parameters.highFrequency - parameters.lowFrequency);
    let type = state == CELL_BLOCKED ? parameters.cellBlocked :
                state == CELL_HAS_ONLY_TWO_OPPOSITE_OPENNINGS ? parameters.cellTwoOppositeOpennings : parameters.cellOther;

    let modulationF =  Math.abs(delta.y) > 0 ? cell.x / nCells : cell.y / nCells;
    let modualtionFrequency = parameters.modulationLowFrequency + f * (parameters.modulationHighFrequency - parameters.modulationLowFrequency);
    let modulationType = Math.abs(delta.y) > 0 ? parameters.moveVertical :
                            delta.x > 0 ? parameters.moveHPositive : parameters.moveHNegative;

    let modulationAmplitude = parameters.modulationAmplitude;
    let duration = parameters.duration;

    generateSound(frequency, type, modualtionFrequency, modulationType, modulationAmplitude, duration);
	path.add(cellToPoint(cell));
	grid[cell.x][cell.y] = 1;
	currentCell = cell;
}

goToCell(currentCell, CELL_NEW);

neighbours = [new paper.Point(-1, 0), new paper.Point(0, -1), new paper.Point(1, 0), new paper.Point(0, 1) ]
			  // new paper.Point(-1, -1), new paper.Point(1, -1), new paper.Point(-1, 1), new paper.Point(1, 1)]

function outsideGrid(cell) {
	return cell.x <= 0 || cell.x >= nCells - 1 || cell.y <= 0 || cell.y >= nCells - 1;
}
function computeCellState(cell) {
	if(outsideGrid(cell) || grid[cell.x][cell.y] > 0) {
		return { state: CELL_FILLED, nBlocks: -1 };
	}
	let blockedNeighbours = [];
    for(let n of neighbours) {
    	let neighbour = cell.add(n);
    	if(outsideGrid(neighbour) || grid[neighbour.x][neighbour.y] > 0) {
    		blockedNeighbours.push(n);
    		if(blockedNeighbours.length >= 3) {
    			return { state: CELL_BLOCKED, nBlocks: blockedNeighbours.length };
			}
    	}
    }
    if(blockedNeighbours.length == 2) {
    	if(blockedNeighbours[0].x == blockedNeighbours[1].x || blockedNeighbours[0].y == blockedNeighbours[1].y) {
    		return { state: CELL_HAS_ONLY_TWO_OPPOSITE_OPENNINGS, nBlocks: blockedNeighbours.length };
    	}
    }
    return { state: CELL_OPENNED, nBlocks: blockedNeighbours.length };
}

function sortByNBlocks(a) {
	return a.sort(function(x, y) {
	  return x.nBlocks - y.nBlocks;
	});
}

function getLowerValue(m) {
	let sortedMap = getSortedMap(m);
	return
}

paper.view.onFrame = function(event) {
	let possibleNeighbours = [];
	let neighboursWithTwoOppositeOpennings = [];

    for(let n of neighbours){
    	let neighbour = currentCell.add(n);
    	let cellState = computeCellState(neighbour)
    	if(cellState.state == CELL_BLOCKED) {
    		possibleNeighbours = [{cell: neighbour, nBlocks: cellState.nBlocks}];
    		break;
    	} else if (cellState.state == CELL_OPENNED) {
    		possibleNeighbours.push({cell: neighbour, nBlocks: cellState.nBlocks});
    	} else if (cellState.state == CELL_HAS_ONLY_TWO_OPPOSITE_OPENNINGS) {
    		neighboursWithTwoOppositeOpennings.push({cell: neighbour, nBlocks: cellState.nBlocks});
    	}
    	// if cellFilled or cellHasOnlyTwoOppositeOpenning don't put neighbour in possibleNeighbour since we can't go there
    }

    // the fact that there is an absolute priority for blocked cells changes the moves

    let n = Math.random();
    let X = 1 / n;
    let x = parameters.version == 'normal' ? Math.floor(Math.log2(X)) : 0;
    
    if(possibleNeighbours.length > 0) {
    	possibleNeighbours = sortByNBlocks(possibleNeighbours);
        if(parameters.version == 'normal') {
            let randomIndex = Math.floor(Math.random() * possibleNeighbours.length);
            goToCell(possibleNeighbours[randomIndex].cell);
        } else {
            cell = possibleNeighbours[Math.min(x, possibleNeighbours.length-1)]
            goToCell(cell.cell, cell.state);
        }	
    } else if(neighboursWithTwoOppositeOpennings.length > 0){
    	neighboursWithTwoOppositeOpennings = sortByNBlocks(neighboursWithTwoOppositeOpennings);
        cell = neighboursWithTwoOppositeOpennings[Math.min(x, neighboursWithTwoOppositeOpennings.length-1)]
        goToCell(cell.cell, cell.state);
    	// let randomIndex = Math.floor(Math.random() * neighboursWithTwoOppositeOpennings.length);
    	// goToCell(neighboursWithTwoOppositeOpennings[randomIndex].cell);
    } else {
    	do {
    		currentCell = randomCell();
    	} while(grid[currentCell.x][currentCell.y] > 0);
    	path = new paper.Path();
		path.strokeWidth = 1;
		path.strokeColor = 'black';
    	goToCell(currentCell, CELL_NEW);
    }
}

// --- sound --- //

function triangle(t) {
    let v = Math.floor( (t / Math.PI) + 0.5 )
    return ( 2 / Math.PI ) * ( t - Math.PI * v ) * Math.pow(-1, v)
}

function square(t) {
    return Math.sign(Math.sin(t))
}

function waouw(soundwave, bufferSize, frequency, type, modualtionFrequency, modulationType, modulationAmplitude, volume, duration) {

    let sfunction = type == 'sine' ? Math.sin : type == 'triangle' ? triangle : type == 'square' ? square : Math.sin
    let mfunction = modulationType == 'sine' ? Math.sin : modulationType == 'triangle' ? triangle : modulationType == 'square' ? square : Math.sin

    for (var i = 0 ; i < bufferSize ; i++) {
        let modulation = modulationAmplitude * mfunction(2 * Math.PI * modualtionFrequency * i / bufferSize);
        soundwave[i] += volume * sfunction(2 * Math.PI * frequency * i / bufferSize + 1000 * modulation);
    }
}

function generateSound(frequency, type, modualtionFrequency, modulationType, modulationAmplitude, duration) {


    var bufferSize = 1 * audioContext.sampleRate * duration / 1000,
        soundBuffer = null,
        output = null;


    soundBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    output = soundBuffer.getChannelData(0);
    for (var i = 0 ; i < bufferSize ; i++) {
        output[i] = 0;
    }

    // frequency, type, modualtionFrequency, modulationType, volume
    waouw(output, bufferSize, frequency, type, modualtionFrequency, modulationType, modulationAmplitude, parameters.volume, duration);


    let sound = audioContext.createBufferSource();
    sound.buffer = soundBuffer;
    sound.loop = false;

    sound.connect(gainNode);
    sound.start();
}

