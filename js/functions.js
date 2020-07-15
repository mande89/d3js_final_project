const screenHeight = $(window).height();
const screenWidth = $(window).width();
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
						edges.push(objToInsert);
					}
				}
			//	console.log(edges);
			}
		}
	}

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
	console.log(characters);
});

//ipotesi: i vicini di un nodo sono i nodi con un arco in comune al nodo stesso
//insieme di nodi fissi: il 10% dei nodi con più legami

var drawNode = function(x, y, size){

}