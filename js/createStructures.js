var createEdges = function(ch2co){
	let edges = [];
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
	return edges;
}

var findNeighbors = function(edges, id, characters){
	let mapNeighbors = new Map();
	edges.forEach((x) => {
		if(x.character1 === id){
			if(!mapNeighbors.has(x.character2)){
				mapNeighbors.set(x.character2, characters.get(x.character2));
			}
		}else if(x.character2 === id){
			if(!mapNeighbors.has(x.character1)){
				mapNeighbors.set(x.character1, characters.get(x.character1));
			}
		}
	});
	return mapNeighbors;
}


var getEdgesNoReplicasWithTimes = function(edges){
	let mapEdges = new Map();
	for(let i = 0; i < edges.length; i++){
		let key = edges[i].character1.toString() + "" + edges[i].character2.toString();
		let inverseKey = edges[i].character2.toString() + "" + edges[i].character1.toString();
		if(mapEdges.has(key)||mapEdges.has(inverseKey)){
			if(mapEdges.has(key)){
				let obj = mapEdges.get(key);
				obj.times++;
				mapEdges.set(key, obj);
			}else{
				let obj = mapEdges.get(inverseKey);
				obj.times++;
				mapEdges.set(inverseKey, obj);
			}
		}else{
			//da aggiungere
			let obj = {
				target: edges[i].character1,
				source: edges[i].character2,
				times: 1 
			};
			mapEdges.set(key, obj);
		}
	}
	let arrayEdges = [];
	mapEdges.forEach((x) => {
		arrayEdges.push(x);
	});
	return (arrayEdges);
}


var createEdgesComics = function(ch2co, chID){
	let mapComics = new Map();
	console.log(ch2co.length);
	let ch2coSingleCharacter = ch2co.filter((x) => {
		if((x.characterID === chID)&&(!mapComics.has(x.comicID))){
			mapComics.set(x.comicID, x);	
		}
		return (x.characterID === chID);
	});
	let ch2coFiltered = ch2co.filter((x) => {
		return(mapComics.has(x.comicID));
	})
	console.log(ch2coFiltered);
	let edges = createEdges(ch2coFiltered);
	console.log(edges);
	return edges;

}

var createSingleNode = function(newArrayCharacters, charactersMap, date){
	let goodMale = [];
	let goodFemale = [];
	let badMale = [];
	let badFemale = [];
	let notDefined = [];
	for(let k = 0; k < newArrayCharacters.length; k++){
	//	console.log(newArrayCharacters[k].characterID);

		let character = charactersMap.get(newArrayCharacters[k].characterID);
		let obj = {
			value: newArrayCharacters[k].times,
			name: character.name
		};
	//	console.log(character);
		if(character.alignment !== undefined){
			switch(character.alignment.toLowerCase()){
				case "good": 
					switch(character.gender.toLowerCase()){
						case "male": 
							goodMale.push(obj);
							break;
						case "female": 
							goodFemale.push(obj);
							break;
					}
					break;
				case "bad": 
					switch(character.gender.toLowerCase()){
						case "male": 
							badMale.push(obj);
							break;
						case "female": 
							badFemale.push(obj);
							break
					}
					break;
			}
		}else{
			notDefined.push(obj);
		}
		

	}
	let node = {
		name: date,
		length: newArrayCharacters.length,
		children: [{
			name: "Good",
			children: [{
				name: "Male",
				children: goodMale
			},{
				name: "Female",
				children: goodFemale
			}]
		},{
			name: "Bad",
			children: [{
				name: "Male",
				children: badMale
			},{
				name: "Female",
				children: badFemale
			}]
		},{
			name: "NotDefined",
			children: [{
				name: "Not Defined",
				children: notDefined
			}]
		}]
	};
	return node;
}

var filterEdgesCharacter = function(edges, characterID){
	edges = edges.filter((x) => {
		return((x.character1 === characterID)||(x.character2 === characterID));
	});
	return(edges);
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