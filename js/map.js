
//********** DEFINICIONES *********************
  var isSmallDevice =  window.innerWidth < 840 ? true : false;


  
var path = d3.geoPath();

var padding = isSmallDevice ? 0.5 : 1;
var nodes, bubbles, bubblesStage, labels, labelsBarrios, labelsTemas, labelsExtra, nestedBarrios;
var isSmallDevice =  window.innerWidth < 840 ? true : false;
var height = isSmallDevice ? 568 : 800;
var width= isSmallDevice ?  window.innerWidth  : 850 ;

var insideheight = height * 0.7; 
insidewidth = isSmallDevice ? window.innerWidth : width-30 ;

var anchomapa = isSmallDevice ? window.innerWidth : width -30,
  altomapa = isSmallDevice ? window.innerHeight*0.6 : height - 50;



var distanceLimit = 70;
var estadoActivo;
  var tipos = [
    "AMBIENTE",
    "EDUCACIÓN",
    "INFRAESTRUCTURA COMUNITARIA",
    "INFRAESTRUCTURA URBANA",
    "SEGURIDAD Y TRÁNSITO",
      "OTROS"];

// para la linea de tiempo

var yTimeline = d3.scalePoint()
  .range([height - 150, 120])
  .domain(d3.range(2013, 2020));

if (isSmallDevice) yTimeline.range([50, height-20])

var xTimeline = d3.scalePoint()
  .range([isSmallDevice ? 60 : 140, isSmallDevice ? insidewidth - 20 : insidewidth-140])
  .domain(tipos);

  if (isSmallDevice) xTimeline.range([60, width - 60])

      


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

   // PARA UBICAR EN LOS CENTROIDES GEOGRAFICOS
          var barriosTraduccion = {
    "Carapachay": "CARAPACHAY",
    "Florida": "FLORIDA ESTE",
    "Florida Oeste": "FLORIDA OESTE",
    "La Lucila": "LA LUCILA",
    "Munro": "MUNRO",
    "Olivos": "OLIVOS",
    "Vicente López": "VICENTE LÓPEZ",
    "Villa Adelina": "VILLA ADELINA",
    "Villa Martelli": "VILLA MARTELLI"
  }
  
//aca guardo los centroides geograficos
if (!isSmallDevice){ 
  var centroidesGeo = { 
    "CARAPACHAY": [177, 176],
    "FLORIDA ESTE": [494, 400],
    "FLORIDA OESTE": [274, 368],
    "LA LUCILA": [702, 111],
    "MUNRO": [274, 230],
    "OLIVOS": [542, 205],
    "VICENTE LÓPEZ": [669, 400],
    "VILLA ADELINA": [70, 155],
    "VILLA MARTELLI": [274, 485]
      }
}else{
  var centroidesGeo = {
        "CARAPACHAY":[85, 98],
        "FLORIDA ESTE":[216, 194],
        "FLORIDA OESTE":[125, 178],
        "LA LUCILA":[300, 70],
         "MUNRO": [125, 129],
        "OLIVOS":[236, 117],
          "VICENTE LÓPEZ": [288, 194],
        "VILLA ADELINA":[43, 60],
          "VILLA MARTELLI": [125, 255]
      }
};





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

  var numberFormat = localeFormatter.format("$,.0f"),
    numberFormatResume = localeFormatter.format("$,.2s");
  ;


// Define the div for the tooltip
let tooltip = d3.select("#tooltip");
                
var coloreaBarrios;

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

  radiusScale.domain(d3.extent(respuestas, function (d) { return +d.presupuesto; }));
  radiusForce.domain(radiusScale.domain());


  // --------- MAPA
  var mapa = topojson.feature(mapTopoJson, mapTopoJson.objects.collection);  
  var projection = d3.geoTransverseMercator()
                    .rotate([74 + 30 / 60, -38 - 50 / 60,-60])
                    .fitExtent([[20, 0], [anchomapa-15, altomapa]], mapa)

      path.projection(projection);

      //---carga de centroides geograficos desde el mapa
 /*  mapa.features.forEach(element => {
    centroidesGeo[barriosTraduccion[element.properties.name]] = path.centroid(element);
  }); */

 

      svg.append("g")
          .attr("class", "states")
          .attr("id", "states")
          .selectAll("path")
          .data(mapa.features)
          .enter().append("path")
          .attr("class","paisVector")
          .attr("id", function (d) { return d.properties.name.toLowerCase().replace(/\s/g, '') })
        .attr("fill","#e1e1e1")
          .attr("d", path)
            ;
        
   //>>>>>>>> PREPARO LOS DATOS  >>>>>>>>>>>

    nodes = respuestas.map(function (d, i) {

    if (!d.longlat) d.longlat = "-34.552000,-58.481300"; // para los que tienen longlat vacios
    
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
      centroideGeo: centroidesGeo[d.barrio],
      sextos: sextos[d.temaResumen],
      timeline: [xTimeline(d.temaResumen), yTimeline(+d.ano)],
      ano: +d.ano,
      xPos: {},
      yPos: {}
    }
  });

  nestedBarrios = d3.nest()
    .key(function (d) { return d.barrio; })
    .rollup(function (d) { return d3.sum(d, function (d) { return d.presupuesto; }); })
    .object(nodes);

  coloreaBarrios = d3.scaleLinear().domain(d3.extent(Object.values(nestedBarrios))).range(["#f1fee3","#7cbb42"]);   

  
  // --------- BUBBLES
     
          simulaNodos(nodes, "centroideGeo", "intro");                        
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
  
  svg.selectAll(".tick line").attr("x2", width - 160).attr("x1", 40).attr("stroke", "#ddd")
  if (!isSmallDevice) dibujaleyendas("mapa");

  dibujaLabels();

 }  // fin de Ready;

 
  function dibujaBubbles(nodes, estado) {
            console.log("Viene de:"+estadoActivo+"/ update:" + estado);

            // prendo o apago el mapa
            if(estado == "intro" || estado == "mapa"){
              d3.select("#states").transition().duration(1000).style("opacity", 1);  
            }else{
              d3.select("#states").transition().duration(1000).style("opacity", 0);
            }
            
    
            if(!estadoActivo){ //es la primera vez que arranca
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
                ;
                
              if (estado == "intro"){ 
                d3.selectAll(".paisVector").transition().duration(500).style("fill", function (d) {
                return coloreaBarrios(nestedBarrios[barriosTraduccion[d.properties.name]]);
                    });
                d3.select(".legendPresu").transition().duration(500)
                  .style("opacity", 1);
              }

   
            }else { // es update



              // baja la intensidad del nombre de los barrios
              labels.transition().duration(500).style("opacity", estado == "mapa" ? 0.4 : 1);

              
              if(estado == "intro"){
                d3.selectAll(".legendOrdinal, .legendSize, #tooltip, .axis").transition().duration(500)
                  .style("opacity", 0);

                d3.select(".legendPresu").transition().duration(500)
                  .style("opacity", 1);

                bubbles
                  .transition().duration((d) => 500 + radiusForce(d.presupuesto) * 1500).ease(d3.easeExpInOut)
                  .attr('r', 0);

                d3.selectAll(".paisVector").transition().duration(500).style("fill", function (d) {
                  return coloreaBarrios(nestedBarrios[barriosTraduccion[d.properties.name]]);
                });

              }else{
                
                d3.selectAll(".paisVector").transition().duration(500).style("fill", "#e1e1e1");

                d3.select(".legendPresu").transition().duration(500)
                  .style("opacity", 0);

                d3.select(".legendOrdinal").transition().duration(500)
                  .style("opacity", estado == "temas"?0:1);

              d3.select("#tooltip").transition().duration(200)
                .style("opacity", 0);

              d3.select(".axis").transition().duration(500)
                .style("opacity", estado == "lineadetiempo" ? 1 : 0);

              bubbles
                  .transition().duration((d) => 500 + radiusForce(d.presupuesto) * 1500).ease(d3.easeExpInOut)
                  .attr('r', (d) => d.radius)
                  .attr("transform", function (d) {
                    return "translate(" + d.xPos[estado] + "," + d.yPos[estado] + ")"
                  });
            
              }
            } //end if update vs create
            
            switch (estado) { // prende y apaga los labels extra
              case "intro":
                d3.select("#labels").select("#extra").transition().delay(500).duration(500).ease(d3.easeExpInOut).style("opacity", 1);
                break;
              default:
                d3.select("#labels").select("#extra").transition().delay(500).duration(500).ease(d3.easeExpInOut).style("opacity", 0);
                break;
            }
            
           switch (estado) { // prende y apaga los labels de barrios y temas
                  case "intro":
                  case "mapa":
                  case "barrios":
               d3.select("#labels").select("#barrios").transition().delay(500).duration(500).ease(d3.easeExpInOut).style("opacity", 1);
               d3.select("#labels").select("#temas").transition().delay(500).duration(500).ease(d3.easeExpInOut).style("opacity", 0);
               updateLabels(estado);
                    break;
                  case "temas":
               d3.select("#labels").select("#temas").transition().delay(500).duration(500).ease(d3.easeExpInOut).style("opacity", 1);
               d3.select("#labels").select("#barrios").transition().delay(500).duration(500).ease(d3.easeExpInOut).style("opacity", 0);
                     break;
                  default:
               d3.select("#labels").selectAll("#barrios, #temas").transition().delay(500).duration(500).ease(d3.easeExpInOut).style("opacity", 0);

                  break;
                }
   


                estadoActivo = estado;
                
                makeVoronoi(nodes,estado);

   } //end dibujaBubbles




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
        
          if (site && estado != "intro") {
          highlight(site)}
          else{
          highlight("none")
          }
        
      }
      
   
}


function dibujaLabels() {
  //aca guardo los centroides geograficos
  if (!isSmallDevice) {
    var labelsExtraContenido = {
      "Río de la Plata": [815, 300],
      "AV. Gral Paz": [450, 540],
      "San Isidro": [460, 35],
      "San Martín": [50, 368]
    }
  } else {
    var labelsExtraContenido = {
      //"Río de la Plata": [177, 176],
      "C.A.B.A": [200, 270],
      "San Isidro": [200, 20],
      "San Martín": [40, 180]
    }
  };



  labels = svg.append("g").attr("id","labels");
  
  labelsExtra = labels.append("g").attr("id", "extra")
    .selectAll('text')
    .data(Object.keys(labelsExtraContenido))
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 0)
    .attr("x", 0)
    .attr("y", 0)
    .attr("transform", d => "translate(" + labelsExtraContenido[d][0] + "," + labelsExtraContenido[d][1] + ")")
    .attr("class", "titulosBubblesExtra")
    .text(function (d) { return d }).call(wrap,isSmallDevice?6:10)
    ;
  
  labelsBarrios = labels.append("g").attr("id", "barrios")
    //.style("opacity",0)
    .selectAll('text')
    .data(Object.keys(centroides))
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 0)
    .attr("x", 0)
    .attr("y", 0)
    .attr("transform", d => "translate(" + centroidesGeo[d][0] + "," + centroidesGeo[d][1] +")")
    .attr("class", "titulosBubbles")
    .text(function (d) { return d }).call(wrap,10)
    ;

  labelsTemas = labels.append("g").attr("id", "temas")
    .style("opacity", 0)
    .selectAll('text')
    .data(Object.keys(sextos))
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 0)
    .attr("x",0)
    .attr("y", 0)
    .attr("transform", d => "translate(" + sextos[d][0] + "," + (sextos[d][1] + labelsOffset["temas"][d]) + ")")
    .attr("class", "titulosBubbles")
    .text(function (d) { return d }).call(wrap, 15)
    ;
}

function updateLabels(estado) {
  
  if(estado == "mapa"){
      labelsBarrios.transition().duration(500)
      .attr("transform", d => "translate(" + centroidesGeo[d][0] + "," + centroidesGeo[d][1] + ")");
    }else if(estado == "barrios"){
      labelsBarrios.transition().duration(500)
        .attr("transform", d => "translate(" + centroides[d][0] + "," + (centroides[d][1] + labelsOffset["barrios"][d] * 0.8 )+ ")");

    }
  

}


function simulaNodos(nodes, centro, estado) {

var iteraciones = 270;

 
  if (estado == "barrios" || estado == "temas" ){

                    switch (estado) {     // GENERO LOS NEST DE LOS AGRUPADOS
                      case "barrios":
                        iteraciones = 100;

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
            
          } else if (estado == "barrios"){
              var simulation = d3.forceSimulation(nodes)
                .force('charge', d3.forceManyBody().strength(d => -d.r/2).distanceMax(150))
                .force('x', d3.forceX().x(function (d) {
                  return d[centro][0];
                }).strength(0.1))
                .force('y', d3.forceY().y(function (d) {
                  return d[centro][1];
                }).strength(0.1))
                .force('collision', d3.forceCollide().radius(function (d) {
                  return d.radius + padding;
                }).strength(0.3))
                .alphaDecay(0.07)
                .stop();
              
            }else {
              var simulation = d3.forceSimulation(nodes)
                .force('charge', d3.forceManyBody().strength(1))
                .force('x', d3.forceX().x(function (d) {
                  return d[centro][0];
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
            tooltip.select("#info").html("<strong>"+ numberFormat(d.data.presupuesto) + '</strong> / Año: '+d.data.ano +' / Barrio: ' + d.data.barrio);
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
        .attr("transform", "translate(100, 10)");

      leyenda.append("g").attr("class", "legendSize")
      .attr("opacity",0);

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


  leyenda.append("g").attr("class", "legendPresu")
    .attr("opacity", 0);

  var legendPresu = d3.legendColor()
    .shapeWidth(40)
    .shapePadding(10)
    .orient('horizontal')
    .title("Presupuesto Total")
    .cells(5)
    .labelFormat(numberFormatResume)
    .scale(coloreaBarrios);

  svg.select(".legendPresu")
    .call(legendPresu);

  

      leyenda.append("g")
        .attr("class", "legendOrdinal")
        .attr("opacity", 0);


      var legendOrdinal = d3.legendColor()
        .shape("circle")
        .shapeRadius(6)
        .shapePadding(0)
        .labelWrap(120)
        .labelOffset(-10)
        .labelAlign("start")
        .title("Temas:")
        .orient('horizontal')
        .scale(colorScale);
      
      svg.select(".legendOrdinal")
        .call(legendOrdinal);

        var labelPos = 0;

  svg.select(".legendOrdinal").selectAll(".label").attr("transform", "translate(10, 4)")
  svg.select(".legendOrdinal").selectAll(".cell").each(function(d){
    var esto = d3.select(this);
    
     esto.attr("transform", "translate(" + labelPos + ", 0)");
    labelPos += esto.node().getBBox().width + 16;
    
  })

      //svg.selectAll("line").remove();



}


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
    var text = d3.select(this);
    var words = text.text().split(/\s+/).reverse();
    var word,
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
      var tocompare = line.join(" ").length;
      if (tocompare > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy).text(word);
      }
    }
  });
}
