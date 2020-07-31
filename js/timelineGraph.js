
var setupDatasetTimelineTree = function(edges, chID, charactersMap){
  
  let edgesFilteredCharacter = filterEdgesCharacter(edges, chID);
  let dateMap = new Map();
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
        let objToInsert = {
          characterID: arrayCharacters[j],
          times: occ
        };
        newArrayCharacters.push(objToInsert);
        occ = 1;
      }
    }
    dateMapArray[i] = createSingleNode(newArrayCharacters, charactersMap, dateMapArray[i].date);
  }
  return (dateMapArray);
}

var partition = (data) => {
  let root = d3.hierarchy(data).sum((x) => {return x.value});
  return d3.partition().size([2 * Math.PI, root.height + 1])(root);
}

var arcToShow = function(x) {
  return (x.y1 <= 3 && x.y0 >= 1 && x.x1 > x.x0);
}

var labelToShow = function(x) {
  return ((x.y1 <= 3 && x.y0 >= 1 && (x.y1 - x.y0) * (x.x1 - x.x0) > 0.08)&&(x.depth !== 2));
}

var labelAlignment = function(x, r) {
  let xLab = (x.x0 + x.x1) / 2 * 180 / Math.PI;
  let yLab = (x.y0 + x.y1) / 2 * r;
  return "rotate(" + (xLab - 90) + ") translate(" + yLab + ",0) rotate(" + ((xLab <= 180) ? 0 : 180) + ")";
}

var createCircle = function(data){

	svg.selectAll('#timelineCircle').remove();
	
  let character = data.character;

  let color = '#fffff0';

	let width = screenWidth * 0.8;
	let r = width / 8;
	let arc = d3.arc().startAngle( (x) => {return x.x0;}).endAngle((x) => {return x.x1;}).padAngle((x) => {return d3.min([(x.x1 - x.x0)/2, 0.005]);}).padRadius(r).innerRadius((x) => {return x.y0 * r;}).outerRadius((x) =>{return d3.max([x.y0 * (r/2), (x.y1 * r) -1]);});
  
  let root = partition(data);

  root.each((x) => {x.current = x});

  const g = svg.append("g").attr("transform", "translate(" + (width / 2) + "," + (width / 2) + ")").attr('id', 'timelineCircle');

  const path = g.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
    .attr('fill', (x) => {
        while(x.depth > 2){
          x = x.parent
        }
        if(x.depth === 1){
          return color;
        }else{
          return x.data.color  
        }
      })
    .attr('fill-opacity', (x) => {
      let node = x;
      while(node.depth > 3){
        node = node.parent;
      }
      if(arcToShow(x.current)){
        if(x.children){
          return  0.8;
        }else{
          return  0.6;
        }
      }else{
        return 0;
      }
    })    
    .attr("d", (x) => {
      return arc(x.current);
    });

  let filter = path.filter((x) => {return x.children;}).style("cursor", "pointer");

  path.append("title").text((x) => {
    let string = x.ancestors().map((singleCharac) => {return singleCharac.data.name}).reverse();
    string.push(x.value);
    let description;
    switch(string.length){
      case 3: {
        description = string[0] + " in " + string[1] + " has iteracted with other characters " + string [2] + " times.";
        break;
      }
      case 4: {
        description = string[0] + " in " + string[1] + " has iteracted with " + string[2] + " characters " + string[3] + " times.";
        break;
      }
      case 5:{
        description = string [0] + " in " + string[1] + " has iteracted with " + string[3] + " " + string[2] + " characters " + string[4] + " times."; 
        break;
      }
      case 6:{
        description = string[0] + " in " + string[1] + " has iteracted with " + string[4] + " " + string[5] + " times.";
        break;
      }
      default:{
        description = "";
      }
    }
    return (description);
  });

  let label = g.append("g").attr("pointer-events", "none").attr("text-anchor", "middle").attr('class', 'label')
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text").attr("dy", "0.10em").attr("fill-opacity", (x) => {return +labelToShow(x.current);}).attr("transform", (x) => {return labelAlignment(x.current, r);}).text((x) => {
      if(x.depth !== 2){
        if(x.data.name.length > 13){
          return (x.data.name.substring(0, 10) + "...");
        }else{
          return (x.data.name);
        }  
      }else{
        return "";
      }
    });

  const parent = g.append("circle").datum(root).attr("r", r).attr("fill", "none").attr("pointer-events", "all");

  let iteract = function(p) {
    parent.datum(p.parent || root);
    root.each((x) => x.target = {
      x0: Math.max(0, Math.min(1, (x.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (x.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, x.y0 - p.depth),
      y1: Math.max(0, x.y1 - p.depth)
    });

    let t = g.transition().duration(950);

    path.transition(t)
      .tween("data", (x) => {
        let fun = d3.interpolate(x.current, x.target);
        return ((app) => x.current = fun(app));
      })
    .filter(function(x) {
      return + this.getAttribute("fill-opacity") || arcToShow(x.target);
    })
    .attr("fill-opacity", (x) => {
        let node = x;
        while(node.depth > 3){
          node = node.parent;
        }
        if(arcToShow(x.target)){
          if(x.children){
            if((node.data.opacity !== undefined)&&(node.depth === 3)){
              return node.data.opacity;
            }else{
              return 1
            }
          }else{
            if((node.data.opacity !== undefined)&&(node.depth === 3)){
              return node.data.opacity - 0.2;
            }else{
              return 0.2;
            }
          }
        }else{
          return 0;
        }
      })
      .attrTween("d",(x) => {return function(){return arc(x.current);}});

    label.filter(function(x) {
        return +this.getAttribute("fill-opacity") || labelToShow(x.target);
      }).transition(t)
        .attr("fill-opacity",(x) => {return +labelToShow(x.target);})
        .attrTween("transform",(x) => {return function(){return labelAlignment(x.current, r);}});
  }

  filter.on("click", iteract);
  parent.on('click', iteract);
  
}

var createChart = function(data, character){

  svg3.selectAll('*').remove();

  let newData = [];
  let year = d3.min(data, (x) => {return x.name});
  let maxYear = d3.max(data, (x) => {return x.name});
  let i = 0;
  let color = colorList[1];
  if(character.alignment !== undefined){
    switch(character.alignment.toLowerCase()){
      case 'good': {
        color = colorList[0];
        break;
      }
      case 'bad': {
        color = colorList[2];
        break;
      }
      case 'neutral': {
        color = colorList[3];
        break;
      }
      default: {
        break;
      }
    }
  }
  
  while(year <= maxYear){
    if(data[i].name === year){
      let obj = {
        name: new Date(data[i].name, 0, 1),
        length: data[i].length
      };
      newData.push(obj);
      i++;
    }else{
      let obj = {
        name: new Date(year, 0, 1),
        length: 0
      };
      newData.push(obj);
    }
    year++;
  }

  let maxValue = d3.max(newData, (x) => {return x.length});

  let width = screenWidth * 0.7;
  let height = screenWidth * 0.7;
  svg3.append('g').attr('transform', 'translate(' + (screenWidth + screenWidth * 0.15) + "," + (screenWidth * 0.15) + ')');
  let xFun = d3.scaleTime().domain(d3.extent(newData, (x) => {return x.name;})).range([screenWidth + screenWidth * 0.15, screenWidth + screenWidth * 0.15 + width]);
  svg3.append('g').attr('class', 'chartAxis').attr('transform', 'translate(0,' + height + ')').call(d3.axisBottom(xFun));

  let yFun = d3.scaleLinear().domain([0, maxValue]).range([height, screenWidth * 0.1]);
  svg3.append('g').attr('class', 'chartAxis').attr('transform', 'translate(' + (screenWidth + screenWidth*0.15) + ', 0)').call(d3.axisLeft(yFun));

  svg3.append('path').datum(newData).attr('class', 'chartLine').style('stroke', color).attr('d', d3.line().x((x) => {return xFun(x.name);}).y((x) => {return yFun(x.length)}));
  svg3.selectAll('dot').data(newData).enter().append('circle').attr('class', 'point').style('fill', color).attr('r', 3).attr('cx', (x) => {return xFun(x.name);}).attr('cy', (x) => {return yFun(x.length)}).append('svg:title').text((x) => {return ("In " + x.name.getFullYear() + " " + character.name + " has interacted with " + x.length + " unique characters.")})

}