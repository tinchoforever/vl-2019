
//********** DEFINICIONES *********************
  var isSmallDevice =  window.innerWidth < 840 ? true : false;


  
var path = d3.geoPath();

var padding = 1;
var nodes, bubbles;
var isSmallDevice =  window.innerWidth < 840 ? true : false;
var height = isSmallDevice ? 568 : 800;
var width= isSmallDevice ?  window.innerWidth * 1.25 : 800 ;

var insideheight = height * 0.7; insidewidth = width * 0.7;
var distanceLimit = 70;
var estadoActivo;
  var tipos = [
    "AMBIENTE",
    "EDUCACIÓN",
    "INFRAESTRUCTURA COMUNITARIA",
    "INFRAESTRUCTURA URBANA",
    "SEGURIDAD Y TRÁNSITO",
      "OTROS"]

  var sextos = {
      "AMBIENTE":                     [insideheight * 1 / 3, insidewidth * 1 / 3],
      "EDUCACIÓN":                    [insideheight * 2 / 3, insidewidth * 1 / 3],
      "INFRAESTRUCTURA COMUNITARIA":  [insideheight,         insidewidth * 1 / 3],
      "INFRAESTRUCTURA URBANA":       [insideheight * 1 / 3, insidewidth * 2 / 3],
      "SEGURIDAD Y TRÁNSITO":         [insideheight * 2 / 3, insidewidth * 2 / 3],
      "OTROS":                        [insideheight,         insidewidth * 2 / 3]
        };
      


    // limit how far away the mouse can be from finding a voronoi site
    const voronoiRadius = width / 10;
    
    
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
    
var radiusScale = d3.scalePow()
    .range([3,25]);

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
let tooltip = d3.select("#tooltip")
                .style("opacity",0)
                .style("left", width*0.75 + "px")
                .style("top", height * 0.75 + "px")
                ;

var svg = d3.select("#stickyViz")
            .attr("height",height)
            .attr("width",width);


//********** LOADER *********************
            svg.append("text").attr("id","cargando").text("cargando....").attr("x", height / 2).attr("y", width / 2); // LOADER TRUCHO

//********** CARGA DE DATOS *********************

 var promises = [
    d3.json("map/vicentemap.topo.json"),
   d3.csv("map/lugaresVL.csv")
  ]

  Promise.all(promises).then(function(data){
    ready(data)});

  // d3.queue()
//     .defer(d3.json, "vicentemap.topo.json")
//     .defer(d3.csv, "lugaresVL.csv")
//     .awaitAll(ready);
            


//********** INICIO *********************
function ready (results){

  var mapTopoJson = results[0]; // acá esta el mapa
  var respuestas = results[1]; // acá las respuestas en csv

  radiusScale.domain(d3.extent(respuestas, function (d) { return +d.presupuesto; }))
  radiusForce.domain(radiusScale.domain())

  // --------- MAPA
  var centroides={};
  var mapa = topojson.feature(mapTopoJson, mapTopoJson.objects.collection);  
  var projection = d3.geoTransverseMercator()
                    .rotate([74 + 30 / 60, -38 - 50 / 60])
                    .fitExtent([[20, 20], [width-200, height-50]], mapa)

      path.projection(projection);

         var centroides = {
           "VILLA ADELINA":[ insidewidth / 4 * 1,insideheight/3*1],
           "MUNRO": [insidewidth / 4 * 2, insideheight / 3 * 1],
           "OLIVOS": [insidewidth / 4 * 3, insideheight / 3 * 1],
           "LA LUCILA": [insidewidth, insideheight / 3 * 1],
            "CARAPACHAY": [insidewidth / 4 * 1, insideheight / 3 * 2],
            "FLORIDA OESTE": [insidewidth / 4 * 2, insideheight / 3 * 2],
            "FLORIDA ESTE": [insidewidth / 4 * 3, insideheight / 3 * 2],
            "VICENTE LÓPEZ": [insidewidth, insideheight / 3 * 2],
            "VILLA MARTELLI": [insidewidth / 4 * 2, insideheight / 3 * 3]
           }


     
      // PARA UBICAR EN LOS CENTROIDES GEOGRAFICOS
  //         var barriosTraduccion = {
  //   "Carapachay": "CARAPACHAY",
  //   "Florida": "FLORIDA ESTE",
  //   "Florida Oeste": "FLORIDA OESTE",
  //   "La Lucila": "LA LUCILA",
  //   "Munro": "MUNRO",
  //   "Olivos": "OLIVOS",
  //   "Vicente López": "VICENTE LÓPEZ",
  //   "Villa Adelina": "VILLA ADELINA",
  //   "Villa Martelli": "VILLA MARTELLI"
  // }

  //         mapa.features.forEach(element => {
  //           centroides[barriosTraduccion[element.properties.name]] = path.centroid(element);
  //         });



      svg.append("g")
          .attr("class", "states")
          .attr("id", "states")
          .style("opacity",0)
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
      categoria: d.temaResumen,
      id: d.id,
      longlat: projection([Number(d.longlat.split(",")[1]), Number(d.longlat.split(",")[0])]),
      centroide: centroides[d.barrio],
      sextos: sextos[d.temaResumen],
      xPos: {},
      yPos: {}
    }
  });

 
    
  
  // --------- BUBBLES
     
                                 
          simulaNodos(nodes,"longlat","mapa");
          simulaNodos(nodes, "centroide", "barrios")
          simulaNodos(nodes, "sextos", "temas")

          

    
  
  // ----------------------------------------------------
  // Add in Voronoi interaction
  // ----------------------------------------------------

  // create a voronoi diagram based on the *ALREADY SIMULATED* data
  const voronoiDiagram = d3.voronoi()
                            .x(d => d.x)
                            .y(d => d.y)
                            .size([width, height])(nodes);



      svg.on('mousemove', mouseMoveHandler);

        // callback for when the mouse moves across the overlay
        function mouseMoveHandler() {
            // get the current mouse position
            const [mx, my] = d3.mouse(this);

            // use the new diagram.find() function to find the voronoi site closest to
            // the mouse, limited by max distance defined by voronoiRadius
            const site = voronoiDiagram.find(mx, my, voronoiRadius);
            if(site) highlight(site)
        }


        dibujaleyendas("mapa");
  

 }  // fin de Ready;

 
  function dibujaBubbles(nodes, estado) {
            // nodes.forEach(element => {
            //   element.x = element.xPos[estado];
            //   element.y = element.yPos[estado];
            // });
            
              d3.select("#states").transition().duration(1000).style("opacity", estado == "mapa"?1:0);
            

            if(!estadoActivo){
              bubbles = svg.append('g')
                .attr("id", "bubbles")
                .selectAll('circle')
                .data(nodes)
                .enter()
                .append('circle');
              
              bubbles
                .attr("transform", function (d) {
                  return "translate(" + d.xPos[estado] + "," + d.yPos[estado] + ")"
                })
                .attr('class', 'circulos')
                .attr('id', (d) => d.id)
                .attr('fill', (d) => colorScale(d.categoria))
                .transition().duration((d) => radiusForce(d.presupuesto) * 1000).delay((d) => (1-radiusForce(d.presupuesto)) * 1000).ease(d3.easeExpInOut)
                .attr('r', (d) => d.radius);
            }else {
              console.log("update");
                bubbles
                  .transition().duration((d) => 500 + radiusForce(d.presupuesto) * 2000).ease(d3.easeExpInOut)
                  .attr("transform", function (d) {
                    return "translate(" + d.xPos[estado] + "," + d.yPos[estado] + ")"
                  });
                }
                estadoActivo = estado;
   }

function simulaNodos(nodes, centro, estado) {
          
          var simulation = d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(1))
            .force('x', d3.forceX().x(function (d) {
              return d[centro][0]
            }).strength(1))
            .force('y', d3.forceY().y(function (d) {
              return d[centro][1];
            }).strength(1))
            .force('collision', d3.forceCollide().radius(function (d) {
              return d.radius + padding;
            }))
            //  .on('tick', ticked);
            .stop();


          for (var i = 0; i < 270; ++i) simulation.tick(); // evalua la simulacion

          nodes.forEach(element => {
            element.xPos[estado] = element.x;
            element.yPos[estado] = element.y;;
          });

   }





 // callback to highlight a point
  function highlight(d) {
    // no point to highlight - hide the circle and clear the text
          d3.selectAll('.circulos').classed('hovered', false);
          d3.select('[id="'+d.data.id+'"]').classed('hovered', true);

          tooltip.transition()
                .duration(50)
                .style("opacity", .9);
          tooltip.select("#title").html(d.data.nombre);
          tooltip.select("#descripcion").html(d.data.descripcion);
          tooltip.select("#info").html(d.data.presupuesto + '/ Barrio: ' + d.data.barrio);

              // HIGHLIGTS barrio -- no estan bien los barrios!
        /*      d3.selectAll('.paisVector').filter(function (e) {
                return e.properties.name.toLowerCase().replace(/\s/g, '') == d.data.barrio.toLowerCase().replace(/\s/g, '')? 0:1;
              }).transition()
              .duration(50)
              .style("opacity", .3);
              d3.select('[id="' + d.data.barrio.toLowerCase().replace(/\s/g, '') + '"]').style("opacity", 1); */
  }


// ----------------------------------------------------


  // function ticked(what) {
  //         what.attr("transform", function(d){ 
  //           return "translate(" + d.x + "," + d.y +")"});
  // }


    d3.select("#cargando").remove();    


  var linearSize = d3.scaleLinear().domain([0,10]).range([10, 30]);



  /// LEYENDAS
function dibujaleyendas(state) {
 
  switch (state) {
    case "mapa":
      var leyenda = svg.append("g")
        .attr("class", "leyenda")

        .attr("transform", "translate(" + (width * 0.75) + ", 40)");

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
      
      break;
  
    default:
      break;
  }

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

  



