
//********** DEFINICIONES *********************
  var isSmallDevice =  window.innerWidth < 840 ? true : false;


  
var path = d3.geoPath();

var padding = isSmallDevice ? 0.5 : 1;
var nodes, bubbles, bubblesStage,labels;
var isSmallDevice =  window.innerWidth < 840 ? true : false;
var height = isSmallDevice ? 568 : 800;
var width= isSmallDevice ?  window.innerWidth  : 850 ;

var insideheight = height * 0.7; 
insidewidth = isSmallDevice ? window.innerWidth : width * 0.7;

var anchomapa = isSmallDevice ? window.innerWidth : width - 200,
  altomapa = isSmallDevice ? window.innerHeight*0.6 : height - 40;



var distanceLimit = 70;
var estadoActivo;
  var tipos = [
    "AMBIENTE",
    "EDUCACIÓN",
    "INFRAESTRUCTURA COMUNITARIA",
    "INFRAESTRUCTURA URBANA",
    "SEGURIDAD Y TRÁNSITO",
      "OTROS"]

// para la linea de tiempo

var yTimeline = d3.scalePoint()
  .range([100, height - 150])
  .domain(d3.range(2013, 2020));

if (isSmallDevice) yTimeline.range([50, height-20])

var xTimeline = d3.scalePoint()
  .range([100, width - 300])
  .domain(tipos);

  if (isSmallDevice) xTimeline.range([100, width - 100])

      


var  sextos = {
    "INFRAESTRUCTURA COMUNITARIA": [insidewidth / 2, insideheight * 1 / 3],
    "SEGURIDAD Y TRÁNSITO": [insidewidth * 1 / 3, insideheight * 2.2 / 3],
    "INFRAESTRUCTURA URBANA": [insidewidth * 2 / 3, insideheight * 2.2 / 3],
    "AMBIENTE": [insidewidth * 1 / 4, insideheight * 3 / 3],
    "EDUCACIÓN": [insidewidth * 2 / 4, insideheight * 3 / 3],
    "OTROS": [insidewidth * 3 / 4, insideheight * 3 / 3]
  };







        var centroides = {
          "VILLA ADELINA": [insidewidth * 1/5, insideheight / 3 * 1],
          "MUNRO": [insidewidth * 2/5, insideheight / 3 * 1],
          "OLIVOS": [insidewidth * 3/5, insideheight / 3 * 1],
          "LA LUCILA": [insidewidth * 4/5, insideheight / 3 * 1],
          "CARAPACHAY": [insidewidth * 1 / 5, insideheight / 3 * 2],
          "FLORIDA OESTE": [insidewidth * 2 / 5, insideheight / 3 * 2],
          "FLORIDA ESTE": [insidewidth * 3 / 5, insideheight / 3 * 2],
          "VICENTE LÓPEZ": [insidewidth * 4 / 5, insideheight / 3 * 2],
          "VILLA MARTELLI": [insidewidth * 2 / 5, insideheight / 3 * 3]
}

var labelsOffset = {"barrios":{},
  "temas": {}}; // aca guardo la altura a la que van los titulos


    // limit how far away the mouse can be from finding a voronoi site
    const voronoiRadius = isSmallDevice ? width/40 : width / 10;
    
    
var colorScale = d3.scaleOrdinal()
  .range([
    "#8dd3c7",
    "#e9df30",
    "#ff6250",
    "#5fb3dd",
    "#fda362",
    "#b3de69",
    "#bebada",
    "#f9aad7",
    "#ffdb92"])
    .domain(tipos);
    
    var topRadScale = isSmallDevice ? 2 : 3;
    var lowRadScale = isSmallDevice ? 16 : 25;

var radiusScale = d3.scalePow()
    .range([topRadScale,lowRadScale]);


var radiusForce = d3.scaleLinear()
        .range([0.3, 1]);

var projection = d3.geoMercator();
    
    // create custom locale formatter from the given locale options
  var localeFormatter = d3.formatLocale({
    "decimal": ",",
    "thousands": ".",
    "grouping": [3],
    "currency": ["$", ""],
  });

  var numberFormat = localeFormatter.format("$,.0f");


// Define the div for the tooltip
let tooltip = d3.select("#tooltip");
                
                

var svg = d3.select("#stickyViz")
            .attr("height",height)
            .attr("width",width);


//********** LOADER *********************
            svg.append("text").attr("id","cargando").text("cargando....").attr("x", height / 2).attr("y", width / 2); // LOADER TRUCHO

//********** CARGA DE DATOS *********************

 var promises = [
    d3.json("data/vicentemap.topo.json"),
   d3.csv("data/lugaresVL.csv")
  ]

  Promise.all(promises).then(function(data){
    ready(data)});



//********** INICIO *********************
function ready (results){

  var mapTopoJson = results[0]; // acá esta el mapa
  var respuestas = results[1]; // acá las respuestas en csv

  radiusScale.domain(d3.extent(respuestas, function (d) { return +d.presupuesto; }))
  radiusForce.domain(radiusScale.domain())

  // --------- MAPA
  var mapa = topojson.feature(mapTopoJson, mapTopoJson.objects.collection);  
  var projection = d3.geoTransverseMercator()
                    .rotate([74 + 30 / 60, -38 - 50 / 60,-60])
                    .fitExtent([[20, 0], [anchomapa-50, altomapa]], mapa)

      path.projection(projection);

        

      svg.append("g")
          .attr("class", "states")
          .attr("id", "states")
          //.style("opacity",0)
          .selectAll("path")
          .data(mapa.features)
          .enter().append("path")
          .attr("class","paisVector")
          .attr("id", function (d) { return d.properties.name.toLowerCase().replace(/\s/g, '') })
          .attr("fill","rgba(0,0,0,0.1")
          .attr("d", path)
            ;
        
   //>>>>>>>> PREPARO LOS DATOS  >>>>>>>>>>>

    nodes = respuestas.map(function (d, i) {

    if (!d.longlat) d.longlat = "-34.554032,-58.481300"; // para los que tienen longlat vacios
    return {
      nombre: d.titulo,
      barrio: d.barrio,
      presupuesto: +d.presupuesto,//numberFormat(+d.presupuesto),
      radius: radiusScale(+d.presupuesto),
      descripcion: d.descripcion,
      tema: d.temaResumen,
      id: d.id,
      longlat: projection([Number(d.longlat.split(",")[1]), Number(d.longlat.split(",")[0])]),
      centroide: centroides[d.barrio],
      sextos: sextos[d.temaResumen],
      timeline: [xTimeline(d.temaResumen), yTimeline(+d.ano)],
      xPos: {},
      yPos: {}
    }
  });


  
  // --------- BUBBLES
     
                                 
          simulaNodos(nodes,"longlat","mapa");
          simulaNodos(nodes, "centroide", "barrios")
          simulaNodos(nodes, "sextos", "temas")
          simulaNodos(nodes, "timeline", "lineadetiempo")


  svg.append("g")
    .attr("id","axis")
    .attr("class", "axis axis--y")
    .style("opacity", 0)
    .attr("transform", "translate(" + 50 + ",0)")
    .call(d3.axisLeft(yTimeline))
    .select(".domain").remove();
  
  svg.selectAll(".tick line").attr("x2", width - (isSmallDevice? 60 : 300)).attr("stroke", "#ddd")
  if (!isSmallDevice) dibujaleyendas("mapa");

  dibujaLabels();

 }  // fin de Ready;

 
  function dibujaBubbles(nodes, estado) {

              d3.select("#states").transition().duration(1000).style("opacity", estado == "mapa"?1:0);
    
             


            if(!estadoActivo){
              bubblesStage = svg.append('g')
                .attr("id", "bubbles");
              
              bubbles = bubblesStage.selectAll('circle')
                .data(nodes)
                .enter()
                .append('circle');
              
              bubbles
                .attr("transform", function (d) {
                  return "translate(" + d.xPos[estado] + "," + d.yPos[estado] + ")"
                })
                .attr('class', 'circulos')
                .attr('id', (d) => d.id)
                .attr('fill', (d) => colorScale(d.tema))
                .transition().duration((d) => radiusForce(d.presupuesto) * 1000).delay((d) => (1-radiusForce(d.presupuesto)) * 1000).ease(d3.easeExpInOut)
                .attr('r', (d) => d.radius);


           

            }else {

              if(estadoActivo != "mapa"){
              d3.select("#labels").select("#" + estadoActivo).transition().duration(500).ease(d3.easeExpInOut)
                .style("opacity", 0);
              }

              d3.select("#labels").select("#" + estado).transition().delay(500).duration(500).ease(d3.easeExpInOut)
              .style("opacity",1);

              
              d3.select(".legendOrdinal").transition().duration(500)
                  .style("opacity", estado == "temas"?0:1);

              d3.select("#tooltip").transition().duration(200)
                .style("opacity", 0);

              d3.select(".axis").transition().duration(500)
                .style("opacity", estado == "lineadetiempo" ? 1 : 0);


                bubbles
                  .transition().duration((d) => 500 + radiusForce(d.presupuesto) * 1500).ease(d3.easeExpInOut)
                  .attr("transform", function (d) {
                    return "translate(" + d.xPos[estado] + "," + d.yPos[estado] + ")"
                  });
                }
                estadoActivo = estado;
                
                makeVoronoi(nodes,estado);
   }


function makeVoronoi(nodes, estado) {
      var voronoiDiagram = d3.voronoi().x(d => d.xPos[estado])
        .y(d => d.yPos[estado])
        .size([width, height])(nodes);
                          
      svg.on('mousemove', mouseMoveHandler);

      function mouseMoveHandler() {
        // get the current mouse position
        var [mx, my] = d3.mouse(this);

        // use the new diagram.find() function to find the voronoi site closest to
        // the mouse, limited by max distance defined by voronoiRadius
        var site = voronoiDiagram.find(mx, my, voronoiRadius);
        if (site) {
          highlight(site)}
          else{
          highlight("none")
          }
      }
  
}


function dibujaLabels() {

  labels = svg.append("g").attr("id","labels");
  
  
  labels.append("g").attr("id", "barrios")
    .style("opacity",0)
    .selectAll('text')
    .data(Object.keys(centroides))
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 0)
    .attr("x",d=>centroides[d][0])
    .attr("y", d => centroides[d][1] + labelsOffset["barrios"][d] * 0.8)
    .attr("class", "titulosBubbles")
    .text(function (d) { return d }).call(wrap, isSmallDevice? 10: 15)
    ;

  labels.append("g").attr("id", "temas")
    .style("opacity", 0)
    .selectAll('text')
    .data(Object.keys(sextos))
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 0)
    .attr("x", d => sextos[d][0])
    .attr("y", d => sextos[d][1] + labelsOffset["temas"][d])
    .attr("class", "titulosBubbles")
    .text(function (d) { return d }).call(wrap, 15)
    ;
}



function simulaNodos(nodes, centro, estado) {

var iteraciones = 270;

 
  if (estado == "barrios" || estado == "temas" ){

                    switch (estado) {     // GENERO LOS NEST DE LOS AGRUPADOS
                      case "barrios":
                        iteraciones = 230;

                        var nest = d3.nest()
                          .key(function (d) { return d.barrio; })
                          .key(function (d) { return d.tema; })
                          .key(function (d) { return d.id; })
                          .rollup(function (d) { return d3.sum(d, function (d) { return d.radius; }); })
                          .entries(nodes);
                        break;
                        
                      case "temas":
                        iteraciones = 0;
                        var nest = d3.nest()
                          .key(function (d) { return d.tema; })
                          .key(function (d) { return d.id; })
                          .rollup(function (d) { return d3.sum(d, function (d) { return d.radius; }); })
                          .entries(nodes).sort(function (a, b) { 
                            return d3.sum(b.values, d => d.value) - d3.sum(a.values, d => d.value);})
                        break;
                        
                     
                    }
                        
                    // GENERO LOS CIRCLE PACKING
                      
                        const root = d3.hierarchy({ values: nest }, function (d) { return d.values; })
                          .sum(function (d) { return d.value; })
                          .sort(function (a, b) { return b.value - a.value; });

                        d3.pack()
                          .radius(d => d.value)
                          .padding(1)
                          (root);
                    
                          // RELATIVIZO LAS POSICIONES DE LOS CHILDS DE LOS CIRCLE PACKS
                    switch (estado) {
                      case "barrios":
                        root.descendants().filter((d) => d.depth == 1)
                          .forEach((d) => {
                            labelsOffset["barrios"][d.data.key] = d.r;
                            d.xPos = centroides[d.data.key][0];
                            d.yPos = centroides[d.data.key][1];
                          });

                        root.descendants().filter((d) => d.depth == 2)
                          .forEach((d) => {
                            d.xPos = d.x - d.parent.x + d.parent.xPos;
                            d.yPos = d.y - d.parent.y + d.parent.yPos;
                          });
                      
                          root.descendants().filter((d) => d.depth == 3)
                          .forEach((d) => {
                            d.x = d.x - d.parent.x + d.parent.xPos;
                            d.y = d.y - d.parent.y + d.parent.yPos;
                          });
                        break;

                      case "temas":
                        root.descendants().filter((d) => d.depth == 1)
                          .forEach((d) => {
                            labelsOffset["temas"][d.data.key] = d.r;
                            d.xPos = sextos[d.data.key][0];
                            d.yPos = sextos[d.data.key][1];
                          });          
                        root.descendants().filter((d) => d.depth == 2)
                          .forEach((d) => {
                            d.x = d.x - d.parent.x + d.parent.xPos;
                            d.y = d.y - d.parent.y + d.parent.yPos;
                          });
                        break;
                      }
                  
                      // CARGO LA DATA DE LOS CIRCLE PACKING A LOS NODES

                        var posPacked = root.leaves().map(function (p) {
                          return [+p.data.key,[p.x,p.y]];
                        }).sort(function (a, b) { return a[0] - b[0]; });


                        nodes.forEach(element => {
                           element.x = posPacked[element.id-1][1][0];
                           element.y = posPacked[element.id-1][1][1];
                        });
            } else if (estado == "lineadetiempo"){

                  nodes.forEach(element => {
                    element.x = element.timeline[0];
                    element.y = element.timeline[1];
                  });
 
            }
          
          if (estado == "lineadetiempo"){
            var simulation = d3.forceSimulation(nodes)
              .force('charge', d3.forceManyBody().strength(1))
              .force('x', d3.forceX().x(function (d) {
                return d[centro][0]
              }).strength(isSmallDevice ? 1 : 0.6))
              .force('y', d3.forceY().y(function (d) {
                return d[centro][1];
              }).strength(5))
              .force('collision', d3.forceCollide().radius(function (d) {
                return d.radius + padding;
              }))
              .force('charge', d3.forceManyBody().strength(0.2).distanceMax(1))
              .force('charge2', d3.forceManyBody().strength(-0.5).distanceMin(1).distanceMax(2))
              .alphaDecay(0.1)
              .stop();
            
          }else{
              var simulation = d3.forceSimulation(nodes)
                .force('charge', d3.forceManyBody().strength(1))
                .force('x', d3.forceX().x(function (d) {
                  return d[centro][0]
                }).strength(isSmallDevice ? 2 : 1))
                .force('y', d3.forceY().y(function (d) {
                  return d[centro][1];
                }).strength(1))
                .force('collision', d3.forceCollide().radius(function (d) {
                  return d.radius + padding;
                }))
                .stop();
          }

          for (var i = 0; i < iteraciones; ++i) simulation.tick(); // evalua la simulacion
          
      
          nodes.forEach(element => {
            element.xPos[estado] = element.x;
            element.yPos[estado] = element.y;;
          });

   }





 // callback to highlight a point
  function highlight(d) {
          d3.selectAll('.circulos').classed('hovered', false);

          if(d!="none"){
          d3.select('[id="'+d.data.id+'"]').classed('hovered', true);

          tooltip.transition()
                .duration(50)
                .style("opacity", .9);
          tooltip.select("#title").html(d.data.nombre);
          tooltip.select("#descripcion").html(d.data.descripcion);
          tooltip.select("#info").html(d.data.presupuesto + '/ Barrio: ' + d.data.barrio);
          }else{
            tooltip.transition()
              .duration(50)
              .style("opacity", 0);
          }
  }


// ----------------------------------------------------

    d3.select("#cargando").remove();    
  var linearSize = d3.scaleLinear().domain([0,10]).range([10, 30]);



  /// LEYENDAS
function dibujaleyendas() {

      var leyenda = svg.append("g")
        .attr("class", "leyenda")

        .attr("transform", "translate(" + (width * 0.72) + ", 40)");

      leyenda.append("g").attr("class", "legendSize");

      var legendSize = d3.legendSize()
        .cells(4)
        .scale(radiusScale)
        .shape('circle')
        .shapePadding(40)
        .labelOffset(10)
        .title("Presupuesto")
        .orient('horizontal');

      svg.select(".legendSize")
        .call(legendSize);

      leyenda.append("g")
        .attr("transform", "translate(0, 100)")
        .attr("class", "legendOrdinal");


      var legendOrdinal = d3.legendColor()
        .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
        .shapePadding(5)
        .labelOffset(10)
        .title("Temas")
        .orient('vertical')
        .scale(colorScale);

      svg.select(".legendOrdinal")
        .call(legendOrdinal);

     

      //svg.selectAll("line").remove();



}


// callback for when the mouse moves across the overlay



  function trimArray(arr)
  {
      for(i=0;i<arr.length;i++)
      {
          arr[i] = arr[i].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
      }
      return arr;
  }

  function getDistance(point1, point2) {
    var xs = 0;
    var ys = 0;

    xs = point2[0] - point1[0];
    xs = xs * xs;

    ys = point2[1] - point1[1];
    ys = ys * ys;

    return Math.sqrt(xs + ys);
  }

  
function wrap(text, width) {
  text.each(function () {
    var text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 16,
      x = text.attr("x"),
      y = text.attr("y"),
      dy = 16,
      tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy);
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (line.join(" ").length > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy).text(word);
      }
    }
  });
}
