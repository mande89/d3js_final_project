
//0 = good , 1 = not defined, 2 = bad, 3 = neutral
var colorList = ['#0079ba', '#a39d9d', '#d32035', '#af7c2b']

var setupDatasetRelevance = function(edges, chID, charactersMap, size){
	console.log(edges);
//	let characterNeighbors = findNeighbors(edges, chID, charactersMap);
//	console.log(characterNeighbors);
//	console.log(characterNeighbors.size);
/*	let edgesFiltered = edges.filter((x) => {
		return ((x.character1 === chID)||(x.character2 === chID)||(characterNeighbors.has(x.character1)&&characterNeighbors.has(x.character2)));
	});*/
	console.log(edges);
	console.log(size);
	let edgesNoReplicas = getEdgesNoReplicasWithTimes(edges);
	console.log(edgesNoReplicas);
	let arrayCharacters = [];
	let characters = new Map(); 
	edges.forEach((x) => {
		if(!characters.has(x.character1)){
			let chApp = charactersMap.get(x.character1);
			chApp.value = 1;
			characters.set(x.character1, chApp);
		}else{
			let chApp = characters.get(x.character1);
			chApp.value++;
			characters.set(x.character1, chApp);
		}
		if(!characters.has(x.character2)){
			let chApp = charactersMap.get(x.character2);
			chApp.value = 1;
			characters.set(x.character2, charactersMap.get(x.character2));
		}else{
			let chApp = characters.get(x.character2);
			chApp.value++;
			characters.set(x.character2, chApp);
		}
	})
	characters.forEach((x) => {
		arrayCharacters.push(x);
	});

	let arraySize = arrayCharacters.length;
	switch (size){
		case 1: {
			arraySize = arraySize / 10;
			break;
		}
		case 2: {
			arraySize = arraySize / 6;
			break;
		}
		case 3: {
			arraySize = arraySize / 2;
			break;
		}
		default:{
			break; 
		}
	}

	arrayCharacters = arrayCharacters.sort((a, b) => {
		if(a.value > b.value){
			return -1;
		}else{
			return +1;
		}
	});
	console.log(arraySize);
	arrayCharacters = arrayCharacters.slice(0, arraySize);

	let arrayMapApp = new Map();
	arrayCharacters.forEach((x) => {
		arrayMapApp.set(x.characterID, x);
	});
	console.log(arrayMapApp);
	console.log(edgesNoReplicas);
	edgesNoReplicas = edgesNoReplicas.filter((x) => {
		return ((arrayMapApp.has(x.target))&&(arrayMapApp.has(x.source)));
	});

	let obj = {
		edges: edgesNoReplicas,
		characters: arrayCharacters
	}
	return obj;
}

var createGraph = function(data){
//	let color = d3.scaleOrdinal(d3.schemeCategory20);
	svg2.selectAll('*').remove();
//	let min = d3.min(data.characters, (x) => {return x.times});
	let rScaling = d3.scaleLinear().domain([d3.min(data.characters, (x) => {return x.value}), d3.max(data.characters, (x) => {return x.value})]).range([2, 15]);
	let eScaling = d3.scaleLinear().domain([d3.min(data.edges, (x) => {return x.times}), d3.max(data.edges, (x) => {return x.times})]).range([0.01, 0.4]);

	let simulation = d3.forceSimulation().force('link', d3.forceLink().id((x) => { return x.characterID; })).force('charge', d3.forceManyBody().distanceMax(screenHeight * 0.4).strength(-50)).force('center', d3.forceCenter(screenWidth / 2, screenWidth + (screenHeight * 0.5))).force('collision', d3.forceCollide((x) => {return Math.sqrt(x.value/60);}).iterations(300).strength(1));
	let edge = svg2.append("g").attr('class', 'edge').selectAll('line').data(data.edges).enter().append('line').attr('stroke-width', (x) => { return eScaling(x.times)}).attr('stroke', '#f1efe2');
	let node = svg2.append("g").attr('class', 'node').selectAll('g').data(data.characters).enter().append('g');
	//usare la funzione d3.scale;
	let nodeDraw = node.append('circle').attr('r', (x) => {return rScaling(x.value)}).attr('fill', (x) => {
		if(x.alignment !== undefined){
			if(x.alignment.toLowerCase() === 'good'){
				return colorList[0];
			}else if(x.alignment.toLowerCase() === 'bad'){
				return colorList[2];
			}else{
				return colorList[3];
			}
		}else{
			return colorList[1];
		}
	}).on('click', (x) => {
		console.log(x);
		$('#heroName').text(x.name);
		((x.gender !== undefined)&&(x.gender !== "")) ? $('#heroGender').text(x.gender) : $('#heroGender').text('N/A');
		((x.alignment !== undefined)&&(x.alignment !== "")) ? $('#heroAlignment').text(x.alignment) : $('#heroAlignment').text('N/A');
		$('#heroTimes').text(x.value);

	});

//	let desc = node.append('text').text((x) => { return x.name }).attr('x', 6).attr('y', 3);
//	node.append('title').text((x) => {return x.name});
	let numberIteration = 0;
	let change = function(){
	//	console.log(numberIteration);
		if(numberIteration === 10){
			simulation.stop();
		}
		numberIteration++;
		edge.attr('x1', (x) => {return x.source.x;}).attr('y1', (x) => {return x.source.y;}).attr('x2', (x) => {return x.target.x;}).attr('y2', (x) => {return x.target.y;});
		node.attr('transform', (x) => {
			return ("translate(" + x.x + "," + x.y + ")");
		});
	}

	simulation.nodes(data.characters).on('tick', change);
	simulation.force('link').links(data.edges);

	


}