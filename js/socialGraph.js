
//0 = good , 1 = not defined, 2 = bad
var colorList = ['#00bfff', '#d3d3d3', '#dc143c']

var setupDatasetRelevance = function(edges, chID, charactersMap){
	console.log(edges);
//	let characterNeighbors = findNeighbors(edges, chID, charactersMap);
//	console.log(characterNeighbors);
//	console.log(characterNeighbors.size);
/*	let edgesFiltered = edges.filter((x) => {
		return ((x.character1 === chID)||(x.character2 === chID)||(characterNeighbors.has(x.character1)&&characterNeighbors.has(x.character2)));
	});*/
	console.log(edges);
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
	let obj = {
		edges: edgesNoReplicas,
		characters: arrayCharacters
	}
	return obj;
}

var createGraph = function(data){
//	let color = d3.scaleOrdinal(d3.schemeCategory20);
	svg2.selectAll('*').remove();
	let simulation = d3.forceSimulation().force('link', d3.forceLink().id((x) => { return x.characterID; })).force('charge', d3.forceManyBody()).force('center', d3.forceCenter(screenWidth / 2, screenWidth + (screenHeight * 0.5)));
	let edge = svg2.append("g").attr('class', 'edge').selectAll('line').data(data.edges).enter().append('line').attr('stroke-width', (x) => { return Math.sqrt(x.times/5000)}).attr('stroke', 'white');
	let node = svg2.append("g").attr('class', 'node').selectAll('g').data(data.characters).enter().append('g');
	//usare la funzione d3.scale;
	let nodeDraw = node.append('circle').attr('r', (x) => {return Math.sqrt(x.value/60);}).attr('fill', (x) => {
		if(x.alignment !== undefined){
			if(x.alignment.toLowerCase() === 'good'){
				return colorList[0];
			}else{
				return colorList[2];
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
		console.log('change');
		edge.attr('x1', (x) => {return x.source.x;}).attr('y1', (x) => {return x.source.y;}).attr('x2', (x) => {return x.target.x;}).attr('y2', (x) => {return x.target.y;});
		node.attr('transform', (x) => {
			return ("translate(" + x.x + "," + x.y + ")");
		});
	}

	simulation.nodes(data.characters).on('tick', change);
	simulation.force('link').links(data.edges);

	


}