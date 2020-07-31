const screenHeight = $(window).height();
const screenWidth = $(window).width()/2;
const xCenter = screenWidth / 2;
const yCenter = screenHeight / 2;

//0 = good , 1 = not defined, 2 = bad, 3 = neutral
const colorList = ['#49a4e0', '#d7d6da', '#e04949', '#ada5c3']


//default values on reload
$('#graphSize').val(1);
$('#charactersInput').val('Captain America');

const svg = d3.select('#timelineGraph').attr("height", screenWidth).attr("width", screenWidth);
const svg2 = d3.select('#socialGraph').attr("viewBox", [0, screenWidth, screenWidth, screenHeight]);
const svg3 = d3.select('#lineChart').attr("viewBox", [screenWidth, 0, screenWidth, screenWidth]);

d3.select('#info').attr("width", screenWidth + "px");
d3.select('#stats').attr("width", screenWidth + "px");


var characters = new Map();
var comicsArray = [];
var comicsMap = new Map();
var c2C = [];
var edges = [];
var charactersAligmentsMap = new Map();
var ch2co;

var loaded = false

let loadingData = async function(){

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

	let counter = 0;
	ch = await d3.csv("../data/characters.csv", d3.autoType);
	ch.forEach((x) => {
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

	});

	let charactersString = [];
	characters.forEach((x) => {
		charactersString.push(x.name);
	});

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

	ch2co = await d3.csv("../data/charactersToComics.csv", d3.autoType);
	ch2co = ch2co.sort((a, b) => {
		if(a.comicID <= b.comicID){
			return - 1;
		}else{
			return 1;
		}
	});
	
	edges = createEdges(ch2co);

	$('#graphSize').change(((x) => {
		let graphSize = parseInt($('#graphSize').val());
		
		let chID = getID(characters, $('#charactersInput').val());
		let edgesSingularCharacter = createEdgesComics(ch2co, chID);
		let graph = setupDatasetRelevance(edgesSingularCharacter, chID, characters, graphSize);
		createGraph(graph);
	}))

	$('#charactersInput').autocomplete({
		source: charactersString
	});
	$('#ok').on('click', function(event){
		event.preventDefault();
		console.log($('#charactersInput').val());
		let graphSize = parseInt($('#graphSize').val());
		
		let chID = getID(characters, $('#charactersInput').val());
		let edgesSingularCharacter = createEdgesComics(ch2co, chID);
		let graph = setupDatasetRelevance(edgesSingularCharacter, chID, characters, graphSize);

		let dateMapArray = setupDatasetTimelineTree(edges, chID, characters);
		createChart(dateMapArray, characters.get(chID));
		createGraph(graph);
		let obj = {
			name: characters.get(chID).name,
			children: dateMapArray,
			character: characters.get(chID)
		};
		
		createCircle(obj);
	});

	let chID = getID(characters, $('#charactersInput').val());

	let dateMapArray = setupDatasetTimelineTree(edges, chID, characters);
	let edgesSingularCharacter = createEdgesComics(ch2co, chID);
	let graph = setupDatasetRelevance(edgesSingularCharacter, chID, characters, 1);
	let obj = {
		name: characters.get(chID).name,
		children: dateMapArray,
		character: characters.get(chID)
	}
	createChart(dateMapArray, characters.get(chID));
	createGraph(graph);
	createCircle(obj);
/*
	let dataset = {
		comics: comicsArray,
		characters: ch,
		edges: edges 
	}*/
	return new Promise((resolve, reject) => {
		resolve('loaded');
	});

}

var getID = function(characters, ID){
	let id;
	characters.forEach((x) => {
		if(x.name === ID){
			id = x.characterID;
		}
	})
	return id;
}


loadingData().then((value) => {

});
