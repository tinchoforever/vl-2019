var initBaFechas = function(){



    var isSmallDevice =  window.innerWidth < 740 ? true : false;
    var height = window.innerHeight-100;
    var width= isSmallDevice ? 225 : 700;
    var vWidth = width;
    var vHeight = height; 

    // Define margins
    var margin = {top: 50, right: 150, bottom: 100, left: 0};
    
    
    

var meses = {"Enero":1,
            "Febrero":2,
            "Marzo":3,
            "Abril":4,
            "Mayo":5,
            "Junio":6,
            "Julio":7,
            "Agosto":8,
            "Septiembre":9,
            "Octubre":10,
            "Noviembre":11,
            "Diciembre":12};

var dias = {"lunes":1,
            "martes":2,
            "miercoles":3,
            "jueves":4,
            "viernes":5,
            "sabado":6,
            "domingo":7};

var tipos = ["Centro Cultural","Museo","Biblioteca","Teatro","Bar/Confitería/Restaurant","Espacio/Galería/Sala","Otros"]


    var y = d3.scalePoint()
        .range([margin.top,vHeight-margin.bottom*0.5]);

    if(isSmallDevice) y.range([margin.top,vHeight-margin.bottom]);  

     var x = d3.scalePoint()
        .range([120,vWidth*0.6])
        .domain(tipos);

      if(isSmallDevice) x.range([50,vWidth/1.5]);   

     var radiusScale = d3.scaleSqrt()
            .range([3,18])
     ;

     if(isSmallDevice) radiusScale.range([2, 8]);    


     var radiusForce = d3.scaleSqrt()
            .range([0.3, 1]); 


    var colorea = d3.scaleOrdinal().range(["#e76056","#f3a32d","#fcda59","#2ebc98","#99c25f","#19c3e3","#0389d1","#3e4f5e","#9d6db6","#f562a2" ])
    .domain(tipos);
    

    // Prepare our physical space
    var g = d3.select('#fechas')
          .select('g') ;

       d3.queue()
            .defer(d3.csv, "data/meses.csv")
            .awaitAll(ready);


    function ready(error, eventos) {
            
                  y.domain(Object.keys(meses));

                 var nestedNodes = d3.nest()
                    .key(function (d) { return d.mes;})
                      .sortKeys(function(a,b) { return meses[a] - meses[b]; })
                    .key(function (d) { return d.latitud; })
                    .rollup(function (leaves) {
                        return {
                            lugares: leaves.length,
                            actividades: d3.sum(leaves, function (d) { return (+d.cantidad) }),
                            tipo: leaves.map((d)=>d.establecimientoTipo),
                            nombre: leaves.map((d)=>d.nombre)
                        };
                    })
                    .entries(eventos[0])

                    flattenDatos = [];

                      nestedNodes.forEach(function(parentMes){


                          parentMes.values.forEach(function(d){
                            var tipo = d.value.tipo.filter(function(e){return e!=""})[0];
                            if (tipos.indexOf(tipo)<0) tipo = "Otros";
                              flattenDatos.push(
                                {'mes':parentMes.key,
                                'nombre':d.value.nombre.filter(function(e){return e!=""}).join(","),
                                'tipo':tipo,
                                'cantidad': d.value.actividades,
                                'x': x(tipo),
                                'y': y(parentMes.key)
                              });
                          })
                      })

                      console.log(flattenDatos);



             // arma la escala de radios
            radiusScale.domain([1, d3.max(flattenDatos, function (d) {return d.cantidad;})]);
            radiusForce.domain([1, d3.max(flattenDatos, function (d) {return d.cantidad;})]);

            
            g.append("g")
                        .attr("class", "axis axis--y")
                        .attr("transform", "translate(" +(20+vWidth/1.2) + ",0)")
                        .call(d3.axisRight(y))                        
                        .select(".domain").remove();

                        g.selectAll("line").remove();


                        

             var cell = g.append("g")
                        .attr("class", "cells")
                      .selectAll("g").data(flattenDatos).enter().append("g");       

            var circles =  cell.append("circle")
                        .attr("r",(d)=>(radiusScale(d.cantidad)))
                        .attr("cx", (d)=>d.x)
                        .attr("cy", (d)=>d.y)
                        .style("fill",function(d) { return colorea(d.tipo); })
                        ;  

            cell.append("title")
                        .text(function(d) { return d.nombre + "," + d.tipo; });
            
          var radiusPadding = 1;


            
             
            var simulation = d3.forceSimulation(flattenDatos)
               .force('x', d3.forceX().x((d)=>(x(d.tipo))).strength((d)=>(radiusForce(d.cantidad))))
               .force('charge', d3.forceManyBody().strength(0.2).distanceMax(1))
              .force('charge2', d3.forceManyBody().strength(-0.5).distanceMin(1).distanceMax(2))
               .force('y', d3.forceY().y(function (d) { return y(d.mes);}).strength(4))
               .force('collision', d3.forceCollide().radius(function (d) { return radiusScale(d.cantidad) + radiusPadding; }).strength(1))
               .alphaDecay(0.1)

               .on("tick",actualiza)
                //.on('end', actualiza)
                ;

                function actualiza() {
                    
                   circles
                        .attr("cy", function(d) { return d.y; })
                        .attr("cx", function(d) { return d.x; })
                  
                }
                

    


             


       } // END READY



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
  
    function wrap(text, width) {
            text.each(function () {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 15, // ems
                    y = text.attr("y"),
                    dy = 1,
                    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy )
                while (word = words.pop()) {
                    line.push(word)
                    tspan.text(line.join(" "))
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop()
                        tspan.text(line.join(" "))
                        line = [word]
                        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}`).text(word)
                    }
                }
            })
        }

    String.prototype.toProperCase = function () {
            return this.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
        };