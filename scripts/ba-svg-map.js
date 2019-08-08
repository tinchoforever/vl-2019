var path = d3.geoPath();
var mapa ; 
var padding = 1;
var mapPath;
var readyCb ;
var isSmallDevice =  window.innerWidth < 840 ? true : false;
var height = isSmallDevice ? 568 : 800;
var width= isSmallDevice ?  window.innerWidth * 1.25 : 800 ;
var distanceLimit = 50;


var colorScale = d3.scaleOrdinal()
  .domain(["Todas", "Algunas"])
  .range(['#0389d1', "#19c3e3","#cccccc" ]);

var allSomeScale = [];
  allSomeScale.push({nombre:'Todas',color:'#0389d1'});
  allSomeScale.push({nombre:'Algunas',color:'#19c3e3'});


var radiusScale = d3.scalePow()
    .domain([1, 1000])
    .range([3,10]);

var projection = d3.geoMercator();
    
var zoom = d3.zoom()
    .scaleExtent([1, 1000])
    .on("zoom", zoomed);

    
  function zoomed() {
    svg.attr("transform", d3.event.transform)
      .attr("scale", d3.event.scale); // updated for d3 v4
  }




// Define the div for the tooltip
let div = d3.select("#tooltip")
            .style("opacity",0)
            .style("left", width*0.6 + "px")
            .style("top", height * 0.6 + "px")
            ;

var svg = d3.select("svg#svg-map")
            .attr("height",height)
            .attr("width",width);
var mapSVG = svg;

var mapParent = d3.select(mapSVG.node().parentNode);


function ready (error, results){

    var mapTopoJson = results[0]; // acá esta el mapa
    var respuestas = results[1]; // acá las respuestas en csv

  var tiposDeLugar = getUnique(respuestas.map(function (d) {return d.TIPO}));

  var nest = d3.nest()
    .key(function (d) {
      return d.LATITUD + d.LONGITUD ;
    })
    .rollup(function (leaves) {

      // lista de lugares
      var lugares = leaves.map(function (d) {
            return {
              nombre: d.ESTABLECIMIENTO,
              barrio: d.BARRIO,
              airelibre: d.AIRELIBRE,
              cantidad: +d.CANTIDAD,
              tipo: d.TIPO,
              latlong: [+d.LONGITUD, +d.LATITUD],
          }
        });
     
     var lugaresUnique = getUnique(lugares);
     
     // lista de nombres únicos de cada lugar aparte del más frecuente
     var otrosnombres = getUnique(lugaresUnique.map(function (d) { return d.value.nombre }).filter(function (e) {
        return e != "";
      }));

      var airelibreStatus = lugaresUnique.map(function (e) { return e.value.airelibre; })


      if (airelibreStatus.indexOf("SI")>=0) {
          if (airelibreStatus.indexOf("NO ESPECIFICA") >= 0 || airelibreStatus.indexOf("DECISION DE LA ESCUELA") >= 0 || airelibreStatus.indexOf("NO") >= 0){
            airelibreStatus = "Algunas";
          }else{
            airelibreStatus = "Todas";
          }
      }else if (airelibreStatus.indexOf("NO") >= 0) {
          if (airelibreStatus.indexOf("NO ESPECIFICA") >= 0 || airelibreStatus.indexOf("DECISION DE LA ESCUELA") >= 0 ) {
            airelibreStatus = "No se sabe / ninguna";
          } else {
            airelibreStatus = "No se sabe / ninguna";
          }
      }else{
        airelibreStatus = "No se sabe / ninguna";

      }
    
      

      
      return {
        lugares: leaves.length,
        actividades: d3.sum(leaves, function (d) { return (d.CANTIDAD) }),
        nombre: lugaresUnique[0].value.nombre,
        barrio: lugaresUnique[0].value.barrio,
        latlong: lugaresUnique[0].value.latlong,
        tipo: lugaresUnique[0].value.tipo,
        airelibre: airelibreStatus,
        otrosNombres: otrosnombres.length>1? otrosnombres : 0
        };
    })
    .entries(respuestas)

    nest.sort(function (a, b) {
      return b.value.lugares - a.value.lugares;
    });



  // --------- MAPA

    mapa = topojson.feature(mapTopoJson, mapTopoJson.objects.collection);  

      
      projection.fitHeight(height * 0.8, mapa);

   mapPath = path.projection(projection);
        translate = [200,500];
        svg.attr("transform", "translate(" + translate + ")scale(" + 3.8 + ")"); 
        svg.append("g")
          .attr("class", "states")
          .selectAll("path")
          .data(mapa.features)
          .enter().append("path")
          .attr("class","paisVector")
          .attr("d", path)
          .attr("id",function(d){ return d.properties.name})
            ;
        
  // --------- BUBBLES

    var nodes = nest.map(function(d, i) {
        return {
          data: d,
          nombre: d.value.nombre,
          barrio: d.value.barrio,
          airelibre: d.value.airelibre,
          radius: radiusScale(d.value.actividades),
          actividades: +d.value.actividades,
          tipo: d.value.tipo,
          latlong: projection([d.value.latlong[0], d.value.latlong[1]]),
          id:i
        }
      });

  
      
        var nodos = svg.append('g').attr("id","bubbles")
          .datum(nodes)
          .selectAll('.nodes')
          .data(d => d)
          .enter().append('g')
          .attr('id',(d) =>d.id)
          .attr("transform",function(d){ 
            return "translate("+ d.latlong[0] + ","+ d.latlong[1] +")"});


      var simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(1))
        .force('x', d3.forceX().x(function(d) {
            return d.latlong[0]}).strength(1))
        .force('y', d3.forceY().y(function(d) {
            return d.latlong[1];}).strength(0.5))
        .force('collision', d3.forceCollide().radius(function(d) {
            return d.radius+padding;   }))
      // .on('tick', ticked);
       .stop();


      for (var i = 0; i < 270; ++i) simulation.tick(); // evalua la simulacion
         ticked(); //actualiza posiciones.


     let circles = nodos.append('circle')
        .attr('r', 3)
        .attr('class','circulos')
        //.attr('fill', (d) => colorScale(d.airelibre))
        .attr('fill', 'gray')
        ;

 const annotations = [
        {
          note: {
            label: "Jardin Ramon Carrillo",
            title: "Villa Soldati, 14 actividades",
            wrap: 150,
            align: "left"
          },
            connector: {
              end: "arrow", // 'dot' also available
              endScale: 1   
                     },
            x:d3.select('[id="37"]').data()[0].x+3,
          y: d3.select('[id="37"]').data()[0].y+3,
          dy: 50,
          dx: 50
        },
        {     

          note: {
            label: "Escuela Horacio Quiroga",
            title: "Barracas, 1 actividades",
            wrap: 150,
            align: "left"
          },
          connector: {
            end: "arrow", // 'dot' also available
            endScale: 1
          },
          x:d3.select('[id="249"]').data()[0].x+3,
          y: d3.select('[id="249"]').data()[0].y+3,
          dy: 50,
          dx: 50
        },
        {
          note: {
            label: "Comedor Leticia",
            title: "Barrio 31, 17 actividades",
            wrap: 150,
            align: "left"
          },
          connector: {
            end: "arrow", // 'dot' also available
            endScale: 1         
             },
          x:d3.select('[id="67"]').data()[0].x+3,
          y: d3.select('[id="67"]').data()[0].y+3,
          dy: 50,
          dx: 50
        }
        ].map(function(d){ d.color = "#e74c3c"; return d})

        const makeAnnotations = d3.annotation()
          .type(d3.annotationLabel)
          .annotations(annotations)


        var anotaciones = d3.select("#svg-map")
          .append("g")
          .attr("class", "annotation-group")
          .style("opacity",0)
          .call(makeAnnotations);

        d3.selectAll(".annotation.label").
          attr("transform",function(d){
            return d3.select(this).attr("transform")+ " scale(0.2)";
          });



var bboxsvg = svg.node().getBBox();
   vx = bboxsvg.x;    // container x co-ordinate
   vy = bboxsvg.y;    // container y co-ordinate
   vw = bboxsvg.width;  // container width
   vh = bboxsvg.height; // container height





  function ticked() {
    nodos.attr("transform", function(d){ 
    return "translate(" + d.x + "," + d.y +")"});
  }



  var linearSize = d3.scaleLinear().domain([0,10]).range([10, 30]);



  /// LEYENDAS

  var leyenda = svg.append("g")
    .attr("class", "leyenda")
    .attr("transform", "translate("+(width-320)+", 40)");

    leyenda.append("g").attr("class", "legendSize")
    .style("opacity", 0);

  var legendSize = d3.legendSize()
    .cells(4)
    .scale(radiusScale)
    .shape('circle')
    .shapePadding(40)
    .labelOffset(10)
    .labelFormat(d3.format("0"))
    .title("Cantidad de Actividades")
    .orient('horizontal')
        ;


    var svgLegendsSize = d3.select('#map-reference-size').append('svg').attr("height","50px");
  svgLegendsSize.call(legendSize);


  leyenda.append("g")
    .attr("transform", "translate(0, 80)")
    .attr("class", "legendOrdinal")
    .style("opacity",0);
  

  var legendOrdinal = d3.legendColor()
    .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
    .shapePadding(40)
    .labelOffset(10)
    .title("Actividades al Aire Libre")
    .orient('horizontal')
    .scale(colorScale);



  var allSomeLegends = d3.select('#mapa-referencias')
    .append('div').attr('class', 'row')
    .selectAll('div')
        .data(allSomeScale).enter();

   var innerRow = allSomeLegends.append("span");
   
  innerRow.append('div').attr('class','col-xs-1')
                  .append('p').attr('class','color').style('background-color', function (d) { return d.color; })
  
  innerRow.append('div').attr('class', 'col-xs-3')
                  .append('p').attr('class', 'mini').html(function (d) { return d.nombre; });





  function trimArray(arr)
  {
      for(i=0;i<arr.length;i++)
      {
          arr[i] = arr[i].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
      }
      return arr;
  }

  

  
  readyCb();

}  // fin de Ready;


function transicionaMapa(step) {
  switch (step) {
    case 0: // esto es cuando estamos en el inicio
      svg.selectAll('.circulos')
        .transition()
        .duration(700)
        .attr('fill', 'silver')
        .attr('r', 1.5);

        var translate = [200,500];
      d3.selectAll('#svg-map')
          .attr("transform", "translate(" + translate + ")scale(" + 3.8 + ")"); 
      setTimeout(function () { // apaga la leyenda de tamaño
        d3.selectAll('.legendSize')
          .transition()
          .duration(700)
          .style('opacity', 0);
      }, 500)
      mapParent.classed("zoomed", false);
    break;
    
    case 1: // esto es el mapa con los lugares 
         svg.selectAll('.circulos')
        .transition().delay(700)
        .duration(700)
        .attr('fill', 'gray')
        .attr('r', (d) => d.radius);

      svg.selectAll(".paisVector")
      .transition()
        .duration(700)
          .style("opacity",1);


      setTimeout(function () {
        d3.selectAll('.legendSize')
          .transition()
          .duration(700)
          .style('opacity', 1);

      }, 500)

      setTimeout(function () { // apaga la leyenda de aire libre
        d3.selectAll('.legendOrdinal')
          .transition()
          .duration(700)
          .style('opacity', 0);

      }, 500)
  var translate = [0,0];
      d3.selectAll('#svg-map')
     .transition()
        .duration(750)
        .attr("transform", "translate(" + translate + ")scale(" + 0.8 + ")");;    
    
    mapParent.classed("zoomed", false);
    break;

    case 2: // esto es el mapa con los lugares al aire libre
    mapParent.classed("zoomed", false);
    var translate = [0,0];
     d3.selectAll('#svg-map')
     .transition()
        .duration(750)
        .attr("transform", "translate(" + 1 + ")scale(" + 0.8 + ")");
      
      svg.selectAll('.circulos')
        .transition()
        .duration(700)
        .attr('fill', (d) => colorScale(d.airelibre));

      svg.selectAll(".paisVector")
      .transition()
        .duration(700)
          .style("opacity",0.5);

      setTimeout(function () {
        d3.selectAll('.legendOrdinal')
          .transition()
          .duration(700)
          .style('opacity', 1);

      }, 500)

          d3.selectAll('.annotation-group')
           .transition()
              .duration(250)
              .style("opacity", 0);
              mapParent.classed("zoomed", false);
    break;


     case 3:
    
      // d3.selectAll('.annotation-group')
      //  .transition()
      //     .duration(250)
      //     .style("opacity", 1);
      mapParent.classed("zoomed", false);
       d3.selectAll('#svg-map')
         .transition()
        .duration(750)
        .attr("transform", "translate(" + 1 + ")scale(" + 0.8 + ")");
    
      svg.selectAll('.circulos')
        .transition()
        .duration(700)
        .attr('opacity', 1)
        .attr('r', (d) => d.radius);;
      mapParent.classed("zoomed", false);

      break;



      case 4: //Barrio 31 -- ID 67
       
       mapParent.classed("zoomed", true);
       apagaOtrosCirculos(67,20); // (id, distancia)
       doZoomInPoint(67);
      break;
     
      case 5: // 21 - 24 zabaleta ID 249
      mapParent.classed("zoomed", true);
      apagaOtrosCirculos(249, 15);// (id, distancia)
      doZoomInPoint(249);


      break;
      
      case 6: // Fatima id 37
      mapParent.classed("zoomed", true);
      apagaOtrosCirculos(37, 15); // (id, distancia)
        doZoomInPoint(37);
      
      break;


      case 7: // esto es la transición final
      mapParent.classed("zoomed", false);
      svg.selectAll('.circulos')
        .transition()
        .duration(700)
        .attr('opacity', 1)
        .attr('r', (d) => d.radius);


         var translate = [0,0];
            d3.selectAll('#svg-map')
           .transition()
              .duration(750)
              .attr("transform", "translate(" + translate + ")scale(" + 0.8 + ")");;  
      break;
  
  
  }  
  

}


  function getUnique(arr) {
    var item = [], prev;
    var cant = 1;

    arr.sort();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] !== arr[i+1]) {
        item.push({value:arr[i], cant: cant});
        cant = 1;
      } else {
        cant++
      }
      prev = arr[i];
    }
    return item.sort(function (a, b) {
      return b.cant - a.cant;
    });
  }


  
  var initSVGMAP = function(ff){
    readyCb = ff;
    d3.queue()
    .defer(d3.json, "data/caba.topo.json")
    .defer(d3.csv, "data/lugares.csv")
    .awaitAll(ready);

  };
    


  function zoomTo(point, scale) {
    
    var x = point[0];
    var y = -point[1];
    svg.transition().duration(1000)
      .call(zoom.translateTo, 0, 0)


      // .call(zoom.scaleTo, 2)
   
    return zoom;
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

function doZoomInPoint(id){
    var latLon = d3.select('[id="'+ id +  '"]').data()[0].data.value.latlong;
    doZoomInLatLon(latLon);
       
}
function doZoomInLatLon(latLon) {
  // Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)))
  var p = projection(latLon)
  var bounds = [p,p];
  var
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale =  isSmallDevice ? 2 : 3,
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  var transform = d3.zoomIdentity
    .translate(translate[0], translate[1])
    .scale(scale);

  mapSVG.transition()
      .duration(750)
      .call(zoom.transform, transform);
}
function apagaOtrosCirculos(id,distance) {
  

  svg.selectAll('.circulos')
    .transition()
    .duration(700)
    .attr('r', (d) => d.radius * 0.5)
    .attr('opacity', function (d) {
      return getDistance([d.x, d.y], [d3.select('[id="'+id+'"]').data()[0].x, d3.select('[id="'+id+'"]').data()[0].y]) < distance ? 1 : 0.01;
    });

  
}