const screenHeight = $(window).height();
const screenWidth = $(window).width();
const xCenter = screenWidth / 2;
const yCenter = screenHeight / 2;
const svg = d3.select('body').append("svg").attr("width", screenWidth).attr("height", screenHeight);

var characters = new Map();
var comicsArray = [];
var comicsMap = new Map();
var c2C = [];
var edges = []

var loaded = false

let loadingData = async function(){
	ch = await d3.csv("../data/characters.csv", d3.autoType);
	ch.forEach((x) => {
	//	if(!characters.has(x.characterID)){
		let obj = {
			characterID: x.characterID,
			name: x.name
		};
		characters.set(x.characterID, obj);
	//	}
	});

	console.log(ch.length);
	co = await d3.csv("../data/comics.csv", d3.autoType);
	co.forEach((x) => {
		let obj = {
			comicID: x.comicID,
			title: x.title,
			number: x.issueNumber,
			description: x.description
		};
		if((x.title.indexOf(')') - x.title.indexOf('(')) <= 5){
			obj.date = x.title.substring(x.title.indexOf('(')+1, x.title.indexOf(')'));
		}
		comicsArray.push(obj);
		comicsMap.set(x.comicID, obj);
	});


	console.log(co.length);
	ch2co = await d3.csv("../data/charactersToComics.csv", d3.autoType);
	//in questo modo ci assicuriamo di avere 
	ch2co = ch2co.sort((a, b) => {
		if(a.comicID <= b.comicID){
			return - 1;
		}else{
			return 1;
		}
	});
	let comicsMap2 = new Map();
	for(let i = 0; i < ch2co.length; i++){
		let obj0 = ch2co[i];
		if(!comicsMap2.has(obj0.comicID)){
			comicsMap2.set(obj0.comicID, obj0);
			let j = i;
			let goAhead = false;
			let appList = [];
			while((!goAhead)&&(j < ch2co.length)){
				appList.push(ch2co[j].characterID);
				if(((j+1) < ch2co.length)&&(ch2co[j].comicID !== ch2co[j+1].comicID)){
					goAhead = true;
				}else{
					j++;
				}
			}
			if(appList.length > 1){
				//dobbiamo creare tutti i vari accoppiamenti
				for (let h = 0; h < appList.length; h++){
					for(let k = h + 1; k < appList.length; k++){
						let objToInsert = {
							character1: appList[h],
							character2: appList[k]
						}
						let objToInsertInverse = {
							character1: appList[k],
							character2: appList[h]
						};
					//	if((!edges.includes(objToInsert))&&(!edges.includes(objToInsertInverse))){
							edges.push(objToInsert);
					//	}
					}
				}
			//	console.log(edges);
			}
		}
	}
/*	let edgesNoReplicas = [];
	for(let i = 0; i < edges.length; i++){
		let objToInsert = edges[i];
		let ObjToInsertInverse = {
			character1: edges[i].character2,
			character2: edges[i].character1
		};
		if((!edgesNoReplicas.includes(objToInsert))&&(!edgesNoReplicas.includes(ObjToInsertInverse))){
			edgesNoReplicas.push(objToInsert);
		}
	}*/
	let dataset = {
		comics: comicsArray,
		characters: ch,
		edges: edges
	}
	return new Promise((resolve, reject) => {
		resolve(dataset);
	});

}


loadingData().then((dataset) => {
	console.log(dataset);
	let characters = dataset.characters;
	let edges = dataset.edges;

	for(let i = 0; i < characters.length; i++){
		characters[i].size = 1;	
		for(let j = 0; j < edges.length; j++){
			if((edges[j].character1 === characters[i].characterID)||(edges[j].character2 === characters[i].characterID)){
				characters[i].size ++;
			}
		}
	}
	characters = characters.sort((a, b) => {
		if (a.size > b.size){
			return -1;
		}else{
			return +1;
		}
	});
	let fixedNodes = [];
	let fixedNodesMap = new Map();
	let flexibleNodes = [];
	for(let j = 0; j < 10; j++){
		console.log(characters[j]);
		let basic = ((Math.PI * 2)/10) * j;
		let obj = {
			characterDetails: characters[j],
			x: xCenter + 100 * Math.cos(basic),
			y: yCenter + 100 * Math.sin(basic)
		}
		fixedNodesMap.set(characters[j].characterID, obj);
		fixedNodes.push(obj);
	}
	let singleEdges = removeDuplicates(edges);
	console.log(singleEdges.length);
	let edgesFiltered = singleEdges.filter((x) => {
		return (fixedNodesMap.has(x.character1) && fixedNodesMap.has(x.character2));
	});
	
	let edgesNoFixedNodes = singleEdges.filter((x) => {
		return (!fixedNodesMap.has(x.character1)||(!fixedNodesMap.has(x.character2)));
	});

	let neighbors = createNeighbors(characters, edgesNoFixedNodes, fixedNodesMap);
	console.log(neighbors.length);
	console.log(neighbors);

	console.log(edgesNoFixedNodes.length);
	console.log(edgesFiltered);
	drawGraph(fixedNodesMap, edgesFiltered);
});

//ipotesi: i vicini di un nodo sono i nodi con un arco in comune al nodo stesso
//insieme di nodi fissi: il 10% dei nodi con più legami

var drawNode = function(node){
	svg.append('circle').style('stroke', 'gray').style('fill', 'black').attr('class', "class" + node.characterDetails.characterID.toString()).attr('r', 6).attr('cx', node.x).attr('cy', node.y).on('click', () => {
		d3.select('.class' + node.characterDetails.characterID.toString()).transition().duration(900).attr('r', 10);
		console.log(node.characterDetails);
	});
}

var drawLine = function(x1, y1, x2, y2){
	svg.append('line').style('stroke', 'lightgreen').style('stroke-width', 2).attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2);
}

var removeDuplicates = function(array){
	let mapApp = new Map();
	let edges = [];
	for(let i = 0; i < array.length; i++){
		let key = array[i].character1.toString() + "|" + array[i].character2.toString();
		let inverseKey = array[i].character2.toString() + "|" + array[i].character1.toString();
		if((!mapApp.has(key))&&(!mapApp.has(inverseKey))){
		//	console.log('da aggiungere');
			edges.push(array[i]);
			mapApp.set(key, array[i]);
		}
	}
//	console.log(edges);
	return(edges);
}

var createNeighbors = function(nodes, edges, fixedNodes){
	let neighbors = [];
	for(let i = 0; i < nodes.length; i++){
		let objToInsert = {
			node: nodes[i].characterID,
			neighbors: []
		}
		for(let j = 0; j < edges.length; j++){
			if((edges[j].character1 === nodes[i].characterID)&&(!fixedNodes.has(edges[j].character2))){
				objToInsert.neighbors.push(edges[j].character2);
			}else{
				if((edges[j].character2 === nodes[i].characterID)&&(!fixedNodes.has(edges[j].character1))){
					objToInsert.neighbors.push(edges[j].character1);
				}
			}
		}
		neighbors.push(objToInsert);
	}
	return (neighbors);
}

var drawGraph = function(nodes, edges){
	let characterMap = new Map();
//	console.log(nodes);
//	console.log(edges);
	for(let i = 0; i < edges.length; i++){
		let node1 = nodes.get(edges[i].character1);
		let node2 = nodes.get(edges[i].character2);
		drawLine(node1.x, node1.y, node2.x, node2.y);
	}

	nodes.forEach((x) => {
		drawNode(x);
	});
}