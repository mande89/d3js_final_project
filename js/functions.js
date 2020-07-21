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

//problema nella generazione dello spring embedder, il problema è che secondo me il disegno di un grafo non è il modo più adatto, la timeline potremmo disegnarla in modo circolare

let loadingData = async function(){

	charactersAligmentsMap = new Map();

	chInfo = await d3.csv("../data/marvel_characters_info.csv", d3.autoType);
	chInfo.forEach((x) => {
		if(x.Publisher === 'Marvel Comics'){
			let obj = {
				name: x.Name,
				alignment: x.Alignment,
				gender: x.Gender
			};
			let res = obj.name.replace(/\,/g, '');
		 	res = res.replace(/-/g, '');
		 	res = res.replace(/_/g, '');
		 	res = res.replace(/ /g, '');
		 	res = res.split("(");
		 	res = res[0].toLowerCase();
			charactersAligmentsMap.set(res, obj);
		}
	})
	console.log(charactersAligmentsMap);
	console.log('charactersALignemnt.length = ' + charactersAligmentsMap.size);
	
	//così raffiniamo i valori dell'allineamento, adesso si deve raffinare l'allineamento
	let mk = await d3.csv("../data/marvel-wikia-data.csv");
	mk.forEach((x) => {

		let res = x.name.replace(/\,/g, '');
	 	res = res.replace(/-/g, '');
	 	res = res.replace(/_/g, '');
	 	res = res.replace(/ /g, '');
	 	res = res.split("(");
	 	res = res[0].toLowerCase();
	 	if(!charactersAligmentsMap.has(res)){
	 		let objToInsert = {
	 			name: x.name,
	 			alignment: (x.ALIGN.split(" "))[0],
	 			gender: (x.SEX.split(" "))[0]
	 		};
	 		charactersAligmentsMap.set(res, objToInsert);
	 	}
	});
	console.log('charactersALignemnt2.length = ' + charactersAligmentsMap.size);

	let counter = 0;
	ch = await d3.csv("../data/characters.csv", d3.autoType);
	ch.forEach((x) => {
	//	if(!characters.has(x.characterID)){

		let obj = {
			characterID: x.characterID,
			name: x.name
		};
		let res = obj.name.replace(/\,/g, '');
	 	res = res.replace(/-/g, '');
	 	res = res.replace(/_/g, '');
	 	res = res.replace(/ /g, '');
	 	res = res.split("(");
	 	res = res[0].toLowerCase();
		if(charactersAligmentsMap.has(res)){
			counter++;
			let info = charactersAligmentsMap.get(res);
			obj.gender = info.gender;
			obj.alignment = info.alignment; 
		}
		characters.set(x.characterID, obj);
	//	}
	});
	console.log('charactersALignemntAdded = ' + counter);
	console.log(characters);
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
			try{
				obj.date = parseInt(x.title.substring(x.title.indexOf('(')+1, x.title.indexOf(')')));
			}catch(e){
				obj.date = null;
			}
			
		}
		comicsArray.push(obj);
		comicsMap.set(x.comicID, obj);
	});
	co = co.sort((a, b) => {
		if((a.date !== null)&&(b.date !== null)){
			if(a.date < b.date){
				return -1;
			}else{
				return +1;
			}
		}else{
			if(a.date === null){
				return +1;
			}else{
				return -1;
			}
		}
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
				appList.push(ch2co[j]);
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
							character1: appList[h].characterID,
							character2: appList[k].characterID,
							comic: appList[k].comicID,
							l: 1,
							k1: 1,
							k2: 1
						}
					/*	let objToInsertInverse = {
							character1: appList[k].characterID,
							character2: appList[h].characterID
						};*/
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
	
	let dateMapArray = setupDatasetTimeline(edges);

//	console.log(dateMap);
	console.log(dateMapArray);

	let dataset = {
		comics: comicsArray,
		characters: ch,
		edges: edges 
	}
	return new Promise((resolve, reject) => {
		resolve(dataset);
	});

}

var setupDatasetTimeline = function(edges){
	let chID = 1011490;
	let edgesFilteredCharacter = filterEdgesCharacter(edges, chID);
	let dateMap = new Map();
	console.log(edgesFilteredCharacter.length);
	for(let i = 0; i < edgesFilteredCharacter.length; i++){
		let singleEdge = edgesFilteredCharacter[i];
		let comic = comicsMap.get(singleEdge.comic);
		if((comic.date !== null)&&(comic.date !== undefined)&&(comic.date.toString().length === 4)){
			if(dateMap.has(comic.date)){
				let objToInsert = dateMap.get(comic.date);
				if(singleEdge.character1 === chID){
					objToInsert.characters.push(singleEdge.character2);
				}else{
					objToInsert.characters.push(singleEdge.character1);
				}
				dateMap.set(comic.date, objToInsert);
			}else{
				let objToInsert = {
					date: comic.date
				}
				if(singleEdge.character1 === chID){
					objToInsert.characters = [singleEdge.character2];
				}else{
					objToInsert.characters = [singleEdge.character1];
				}
				dateMap.set(comic.date, objToInsert);
			}
		}
	}
	let dateMapArray = [];
	dateMap.forEach((v, key) => {
		let obj = {
			date: key,
			value: v
		};
		dateMapArray.push(obj);
	});
	dateMapArray = dateMapArray.sort((a, b) => {
		if(a.date < b.date){
			return -1;
		}else{
			return +1;
		}
	});
	for(let i = 0; i < dateMapArray.length; i++){
		let characters = dateMapArray[i];
		let arrayCharacters = characters.value.characters.sort((a, b) => {
			if(a < b){
				return -1;
			}else{
				return +1;
			}
		});
		let occ = 1;
		let newArrayCharacters = [];
		for(let j = 0; j < arrayCharacters.length; j++){
			if(arrayCharacters[j] === arrayCharacters[j+1]){
				occ++;
			}else{
				//vuol dire che il successivo elemento è diverso e quindi dobbiamo salvarlo
				let objToInsert = {
					characterID: arrayCharacters[j],
					times: occ
				};
				newArrayCharacters.push(objToInsert);
				occ = 1;
			}
		}
		dateMapArray[i] = {
			date: characters.date,
			characters: newArrayCharacters
		}
	}
	return (dateMapArray);
}

var filterEdgesCharacter = function(edges, characterID){
	edges = edges.filter((x) => {
		return((x.character1 === characterID)||(x.character2 === characterID));
	});
	return(edges);
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
	for(let j = 0; j < 100; j++){
	//	console.log(characters[j]);
		let basic = ((Math.PI * 2)/10) * j;
		let obj = {
			characterDetails: characters[j],
			x: xCenter + 50 * Math.cos(basic),
			y: yCenter + 50 * Math.sin(basic)
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

//	let neighbors = createNeighbors(characters, edgesNoFixedNodes, fixedNodesMap);
//	console.log(neighbors.length);
//	console.log(neighbors);

	console.log(edgesNoFixedNodes.length);
	console.log(edgesFiltered);

	let top200 = characters.slice(0 , 100);

	let nodesCoords = setRandomPosition(top200);


	drawGraph(nodesCoords, edgesFiltered).then((ok) => {
		let nodesList = [];

		nodesCoords.forEach((x) => {
			nodesList.push(x);
		});

	/*	for(let iter = 0; iter < 5; iter++){
			console.log(iter);
			var start = new Date().getTime();
		    var end = start;
		   	while(end < start + 10000) {
		    	end = new Date().getTime();
		  	}
		  	console.log('go ahead');
		  	svg.selectAll('*').remove();
		  	nodesList = springEmbedder(nodesList, nodesCoords, edgesFiltered);
		  	for(let i = 0; i < nodesList.length; i++){
		  		let newCoord = {
		  			x: nodesList[i].x,
		  			y: nodesList[i].y,
		  			characterDetails: nodesList[i].characterDetails
		  		};
		  		nodesCoords.set(nodesList[i].characterDetails.characterID, newCoord);
		  	}
		  	drawGraph(nodesCoords, edgesFiltered).then((ok2) => {
		  		console.log('drawed');
		  	});
		}*/
	});
//	drawGraph(fixedNodesMap, edgesFiltered);
	
	

});

//ipotesi: i vicini di un nodo sono i nodi con un arco in comune al nodo stesso
//insieme di nodi fissi: il 10% dei nodi con più legami

var drawNode = function(node){
	node.firstTime = false;
	svg.append('circle').style('stroke', 'red').style('fill', 'red').attr('class', "class" + node.characterDetails.characterID.toString()).attr('r', node.characterDetails.size / 500).attr('cx', node.x).attr('cy', node.y).on('click', () => {
		node.firstTime = ! node.firstTime;
		if(node.firstTime){
			d3.select('.class' + node.characterDetails.characterID.toString()).transition().duration(900).attr('r', node.characterDetails.size / 250);
			svg.selectAll('.classLine' + node.characterDetails.characterID.toString()).transition().duration(400).style('stroke-width', 20).style('stroke', 'red');
			
		}else{
			d3.select('.class' + node.characterDetails.characterID.toString()).transition().duration(900).attr('r', node.characterDetails.size / 500);
			svg.selectAll('.classLine' + node.characterDetails.characterID.toString()).transition().duration(400).style('stroke-width', 20).style('stroke', 'lightgreen');
		
		}
		console.log(node.characterDetails);
	});
}

var drawLine = function(x1, y1, x2, y2, ch1, ch2){
	svg.append('line').style('stroke', 'lightgreen').style('stroke-width', 0.1).attr('class', "classLine" + ch1.toString()).attr('class', "classLine" + ch2.toString()).attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2);
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
//	console.log(nodes);
//	console.log(edges);
	console.log('draw graph');
	return new Promise((resolve, reject) => {
		for(let i = 0; i < edges.length; i++){
			let node1 = nodes.get(edges[i].character1);
			let node2 = nodes.get(edges[i].character2);
			drawLine(node1.x, node1.y, node2.x, node2.y, node1.characterDetails.characterID, node2.characterDetails.characterID);
		}

		nodes.forEach((x) => {
			drawNode(x);
		});
		resolve('ok');
	});
	
}

var setRandomPosition = function(nodes){
	let nodesCoords = new Map();
	for(let i = 0; i < nodes.length; i++){
		let coords = appFunctionCalcRandom();
		let objToInsert = {
			x: coords.x,
			y: coords.y,
			characterDetails: nodes[i]
		};
		nodesCoords.set(nodes[i].characterID, objToInsert);
	}
	return (nodesCoords);

}

var appFunctionCalcRandom = function(){
	let minX = Math.ceil(0);
	let minY = Math.ceil(0);

	let maxX = Math.floor(screenWidth);
	let maxY = Math.floor(screenHeight);

	let randX = Math.floor(Math.random() * (maxX - minX +1)) + minX;
	let randY = Math.floor(Math.random() * (maxY - minY +1)) + minY;

	let obj = {
		x: randX,
		y: randY
	};
	return(obj);
}

var springEmbedder = function(nodesList, nodesMap, edges){
	for(let j = 0; j < nodesList.length; j++){
		let sF = springForce(nodesList[j], nodesMap, edges);
		nodesList[j].x = nodesList[j].x + Math.abs(sF.x);
		nodesList[j].y = nodesList[j].y + Math.abs(sF.y);
	}
	return (nodesList);
}

var springForce = function(node, nodes, edges){

	//nodes è la mappa dei nodi con le relative coordinate
	//node è un nodo con le proprie coordinate anche

	let edgesFiltered = edges.filter((x) => {
		return ((x.character1 === node.characterDetails.characterID)||(x.character2 === node.characterDetails.characterID));
	});

	//calcoliamo la forza relativa all'asse x:
	let forceX = forceY = 0;
	let fnX = fnY = 0;
	let gnX = gnY = 0;
	for(let i = 0; i < edgesFiltered.length; i++){
		let edge = edgesFiltered[i];
		let u;
		if(edge.character1 === node.characterDetails.characterID){
			//significa che il nodo è nella parte sinistra dell'arco
			u = nodes.get(edge.character2);
		}else{
			//significa che il nodo è nella parte destra dell'arco
			u = nodes.get(edge.character1);
		}
		let dist = calcDist(u, node);
		fnX = fnX + edge.k1 * (dist - edge.l) * ((u.x - node.x)/(dist));
		gnX = gnX + (edge.k2 / (dist * dist))*((node.x - u.x)/(dist));
		fnY = fnY + edge.k1 * (dist - edge.l) * ((u.y - node.y)/(dist));
		gnY = gnY + (edge.k2 / (dist * dist))*((node.y - u.y)/(dist));
	
	}
	forceX = fnX + gnX;
	forceY = fnY + gnY;
	forceV = {
		x: forceX,
		y: forceY
	};
	return(forceV);

}

var calcDist = function(p1, p2){
	return (Math.sqrt((p2.x - p1.x)*(p2.x - p1.x)+(p2.y - p1.y)*(p2.y - p1.y)));
}