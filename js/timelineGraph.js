var setupDatasetTimelineTree = function(edges, chID, charactersMap){
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
    
  //  console.log(newArrayCharacters);
  //  console.log(charactersMap);
    dateMapArray[i] = createSingleNode(newArrayCharacters, charactersMap, dateMapArray[i].date);
  }
  return (dateMapArray);
}

var partition = (data) => {
  console.log(data);
  const root = d3.hierarchy(data).sum((x) => {return x.value});
  return d3.partition().size([2 * Math.PI, root.height + 1])(root);
}

var createCircle = function(data){
	svg.selectAll('#timelineCircle').remove();
	
  let character = data.character;
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

  color = 'white';

	let format = d3.format(",d");
	let width = screenWidth * 0.8;
	let r = width / 8;
	let arc = d3.arc().startAngle( (x) => {return x.x0;}).endAngle((x) => {return x.x1;}).padAngle((x) => {return d3.min([(x.x1 - x.x0)/2, 0.005]);}).padRadius(r).innerRadius((x) => {return x.y0 * r;}).outerRadius((x) =>{return d3.max([x.y0 * (r/2), (x.y1 * r) -1]);});
  
  let root = partition(data);

  root.each((x) => {x.current = x});
  console.log(root);


  //per centrare il cerchio al centro del box
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
      if(arcVisible(x.current)){
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

  path.filter(d => d.children)
      .style("cursor", "pointer")
      .on("click", clicked);

  path.append("title")
      .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

  const label = g.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .attr('class', 'label')
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
      .attr("dy", "0.15em")
      .attr("fill-opacity", d => +labelVisible(d.current))
      .attr("transform", d => labelTransform(d.current))
      .text(d => d.data.name);

  const parent = g.append("circle")
      .datum(root)
      .attr("r", r)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked);

//funzione di clicking, una volta cliccato su un punto si prende il nodo e il suo genitore
  function clicked(p) {
    parent.datum(p.parent || root);

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    let t = g.transition().duration(950);

    // Transition the data on all arcs, even the ones that aren’t visible,
    // so that if this transition is interrupted, entering arcs will start
    // the next transition from the desired position.
    //da vedere bene come funziona questa interpolazione
    path.transition(t)
        .tween("data", d => {
          let i = d3.interpolate(d.current, d.target);
          return t => d.current = i(t);
        })
      .filter(function(d) {
        return + this.getAttribute("fill-opacity") || arcVisible(d.target);
      })
      .attr("fill-opacity", (x) => {
          let node = x;
          while(node.depth > 3){
            node = node.parent;
          }
        //  console.log(node);
          
          if(arcVisible(x.target)){
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
        .attrTween("d", d => () => arc(d.current));

    label.filter(function(d) {
        return +this.getAttribute("fill-opacity") || labelVisible(d.target);
      }).transition(t)
        .attr("fill-opacity", d => +labelVisible(d.target))
        .attrTween("transform", d => () => labelTransform(d.current));
  }
  
  //per vedere se un arco è visibile o meno
  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

//per vedere se l'etichetta è visibile o meno
  function labelVisible(d) {
    return (d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.08);
  }

//per ruotare le label
  function labelTransform(d) {
    let x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    let y = (d.y0 + d.y1) / 2 * r;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x <= 180 ? 0 : 180})`;
  }
}

var createChart = function(data, character){
  svg3.selectAll('*').remove();
  svg3.append('div').attr('class', 'tooltip').style('opacity', 0);

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
  console.log(newData);
  let maxValue = d3.max(newData, (x) => {return x.length});

  let width = screenWidth * 0.7;
  let height = screenWidth * 0.7;
  svg3.append('g').attr('transform', 'translate(' + (screenWidth + screenWidth * 0.15) + "," + (screenWidth * 0.15) + ')');
  let xFun = d3.scaleTime().domain(d3.extent(newData, (x) => {return x.name;})).range([screenWidth + screenWidth * 0.15, screenWidth + screenWidth * 0.15 + width]);
  svg3.append('g').attr('class', 'chartAxis').attr('transform', 'translate(0,' + height + ')').call(d3.axisBottom(xFun));

  let yFun = d3.scaleLinear().domain([0, maxValue]).range([height, screenWidth * 0.1]);
  svg3.append('g').attr('class', 'chartAxis').attr('transform', 'translate(' + (screenWidth + screenWidth*0.15) + ', 0)').call(d3.axisLeft(yFun));


  let box = svg3.append('div').attr('class', 'tooltip').style('opacity', 0);
  svg3.append('path').datum(newData).attr('class', 'chartLine').style('stroke', color).attr('d', d3.line().x((x) => {return xFun(x.name);}).y((x) => {return yFun(x.length)}));
  svg3.selectAll('dot').data(newData).enter().append('circle').attr('class', 'point').style('fill', color).attr('r', 3).attr('cx', (x) => {return xFun(x.name);}).attr('cy', (x) => {return yFun(x.length)}).append('svg:title').text((x) => {return ("During " + x.name.getFullYear() + " " + character.name + " has interacted with " + x.length + " unique characters.")})/*.on('mouseover', (event) => {
    box.transition().duration(300).style('opacity', 0.6);
    box.html("<p>During " + event.name.getFullYear() + " " + event.length + " relations.").style('left', (d3.event.pageX) + "px</p>").style('top', (d3.event.pageY - 20) + "px");
  });*/



}