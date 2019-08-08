var initBubbles = function(){
    

    var isSmallDevice =  window.innerWidth < 840 ? true : false;


    var width= isSmallDevice ? 320 : 1000 ;
    var height= window.innerHeight;
    
    var vWidth = width, anchoMaximo = vWidth*0.9; // defino el ancho maximo que puede tener la dataviz
    var vHeight = height; 
    var paddingPack = isSmallDevice ? 0.5 : 2; // padding entre bubbles
    var padding = isSmallDevice ? 20 : 10; // padding entre grupos de bubbles
    var altoSvg = [];
     var radiusScale = d3.scaleSqrt()
            .range([2, 15]);

            if(isSmallDevice) radiusScale.range([0.1,8]);

    var colorScale = d3.scaleOrdinal().range(["#8dd3c7",
            "#e9df30",
            "#bebada",
            "#ff6250",
            "#5fb3dd",
            "#fda362",
            "#b3de69",
            "#f9aad7",
            "#ffdb92"]);

    
        

    // Prepare our physical space
    var g = d3.select('#disciplinas').attr('width', vWidth).attr('height', vHeight)
    .style("display","block")
    .style("margin", "auto")
    .select('g') ;

       d3.queue()
            .defer(d3.csv, "data/disciplinas.csv")
            .awaitAll(ready);


    function ready(error, eventos) {

            // arma la escala de radios
            radiusScale.domain([0, d3.max(eventos[0], function (d) {return d.cantidad;})]);
            
            
            // carga la data en "nodes"
            var nodes = eventos[0].map(function (d, i) {
                return {
                    name: d.establecimiento,
                    barrio: d.barrio,
                    value: +d.cantidad,
                    comuna: d.comuna,
                    id: i,
                    tipo: d.disciplinaResumen

                }
            });

           
            var vLayout = d3.pack().size([vWidth, vHeight])
                    .radius(d => radiusScale(d.value))
                    .padding(paddingPack);


            // hago el primer circle pack

            var vRoot = d3.hierarchy(prepareData(nodes, "tipo")).sum(function (d) { return d.value; });

            vLayout(vRoot); 
    
            var rows = [0,0,0,0], row; // x, y, ytemp, temporal para altura de titulos;

            // tomo los padres los ordeno por tamaño y les cambio la ubicación para que esten ordenaditos en fila

            var ordenantes = vRoot.descendants().filter((d) => d.depth == 1).sort(function (x, y) {
                                                return d3.descending(x.r, y.r);});

            // aca genera los renglones y columnas basandose en el ancho. para TIPOS
            
            var ancho =  window.innerWidth>anchoMaximo? anchoMaximo: window.innerWidth;

             ordenantes.forEach((d, i) => {
                    switch (i) {
                        case 0: //es el primer grupo
                            d.tipoPosX = d.tipoPosY = d.r + padding;
                            rows = [d.tipoPosX, d.tipoPosY, d.tipoPosY + d.r +padding];
                            d.row = row = 1;
                            d.rowValue = rows[3] = d.r + padding;
                            break;
                        default: //el resto de los grupos
                            if (rows[0] + ordenantes[i-1].r + padding + d.r*2 <  ancho){ //entra dentro del ancho
                                d.tipoPosX = rows[0] + ordenantes[i - 1].r + padding + d.r ;
                                rows[0] = d.tipoPosX;
                                d.tipoPosY = rows[1];
                                d.row = row;
                                d.rowValue = rows[3];
                            }else{ //no entra en el ancho, hace un nuevo row.
                                d.tipoPosX = d.r + padding;
                                rows[0] = d.tipoPosX;
                                d.tipoPosY = rows[1] = rows[2] + d.r + padding*6;
                                rows[2]= rows[2]+ d.r*2 + padding*6;
                                d.row = row++; // guardo el numero de linea
                                d.rowValue = rows[3] = d.r + padding; // guardo la altura de la linea 
                            }
                        break;
                    }
               
                });

                // ajusta la altura del svg al máximo que va a tener el circle pack
                var disciplinasRowHeight = rows[2] + rows[3] ;
                altoSvg['tipo'] = isSmallDevice ? vHeight : disciplinasRowHeight + 400;
                d3.select('#disciplinas').attr("height", altoSvg['tipo']); 

                
                // actualizo las posiciones de las bubbles con las de sus parents
            vRoot.descendants().filter((d) => d.depth == 2)
                    .forEach((d, i) => {
                            d.tipoPosX = d.x - d.parent.x + d.parent.tipoPosX;
                            d.tipoPosY = d.y - d.parent.y + d.parent.tipoPosY;
                            ;
                        });

            drawViz(vRoot);


            // hago el segundo circle pack

            var vRoot = d3.hierarchy(prepareData(nodes, "comuna")).sort(function (x, y) {
                        return d3.ascending(x.r, y.r);
                })
                .sum(function (d) { return d.value; });
            vLayout(vRoot); 



        // tomo los padres los ordeno por tamaño y les cambio la ubicación para que esten ordenaditos en fila
        var ordenantes = vRoot.descendants().filter((d) => d.depth == 1).sort(function (x, y) {
            return d3.ascending(x.data.name, y.data.name);
        });

        // aca genera los renglones y columnas basandose en el ancho. para COMUNAS
        rows = [0, 0, 0, 0], row; //x, y, ytemp, temporal para altura de titulos;

        ordenantes.forEach((d, i) => {
            switch (i) {
                case 0: //primer caso
                    d.comunaPosX = d.comunaPosY = d.r * 0.8 + padding;
                    rows = [d.comunaPosX, d.comunaPosY, d.comunaPosY + d.r * 0.8 + padding];
                    d.row = row = 1;
                    d.rowValue = rows[3] = d.r * 0.8 + padding;
                    break;
                default://todos los demas
                    if (rows[0] + ordenantes[i - 1].r * 0.8 + padding + d.r * 0.8 * 2 < ancho) {
                        d.comunaPosX = rows[0] + ordenantes[i - 1].r * 0.8 + padding + d.r * 0.8;
                        rows[0] = d.comunaPosX;
                        d.comunaPosY = rows[1];
                        d.row = row;
                        d.rowValue = rows[3];
                    } else { // bajo un renglon
                        d.comunaPosX = d.r * 0.8 + padding; // vuelve al comienzo
                        rows[0] = d.comunaPosX;
                        d.comunaPosY = rows[1] = rows[2] + d.r * 0.8 + padding * 4;
                        rows[2] = rows[2] + d.r * 0.8 * 2 + padding * 2;
                        row++;
                        d.row = row; // guardo el numero de linea
                        d.rowValue = d.r * 0.8 + padding; // guardo la altura de la linea 
                        rows[3] = d.rowValue;
                    }
                    break;

            }

        });
       
        

        var averiguaAltos = d3.nest()
            .key(function (d) {
                return d.comunaPosY;
            })
            .rollup(function (leaves) {
                return {
                    maxRadius: d3.max(leaves, function (d) { return +d.r }),
                    todes: leaves.map(function (d) { return d.r })
                };
            })
            .entries(ordenantes);

        console.log(averiguaAltos)
        var temp = [0, 0, 0, 0, 0];

        var altoTotal;

        ordenantes.forEach((d, i) => {
            switch (d.row) {
                case 1:
                    temp[0] = d.rowValue * 2;
                    break
                case 2:
                    d.rowValue = averiguaAltos[d.row - 1].value.maxRadius * 0.5 + padding;
                    d.comunaPosY = temp[0] + d.rowValue * 2;
                    temp[1] = d.comunaPosY;
                    altoTotal = d.comunaPosY + d.rowValue;
                    break;
                case 3:
                    d.rowValue = averiguaAltos[d.row - 1].value.maxRadius * 0.8 + padding;
                    d.comunaPosY = temp[1] + d.rowValue * 2
                    temp[2] = d.comunaPosY;
                    altoTotal = d.comunaPosY + d.rowValue;
                    break;
                case 4:
                    d.rowValue = averiguaAltos[d.row - 1].value.maxRadius * 0.8 + padding;
                    d.comunaPosY = temp[2] + d.rowValue * 2;
                    temp[3] = d.comunaPosY;
                    altoTotal = d.comunaPosY + d.rowValue;
                    break;
                case 5:
                    d.rowValue = averiguaAltos[d.row - 1].value.maxRadius * 0.8 + padding;
                    d.comunaPosY = temp[3] + d.rowValue * 2;
                    altoTotal = d.comunaPosY + d.rowValue;
                    break;


            }

            
        });
        // ajusta la altura del svg al máximo que va a tener el circle pack
        altoSvg['comuna'] = isSmallDevice ? altoTotal + 115 : altoTotal + 300;
            
                // actualizo las posiciones de las bubbles con las de sus parents

         var bubbles = d3.selectAll(".hijes");

             bubbles.data().forEach(element => {
                var newData = vRoot.descendants().filter((e) => e.data.id == element.data.id)[0];
                element.x = (newData.x - newData.parent.parent.x + newData.parent.parent.comunaPosX);
                element.y = (newData.y - newData.parent.parent.y + newData.parent.parent.comunaPosY);
                element.joinAround = [newData.parent.parent.comunaPosX, newData.parent.parent.comunaPosY];
            });


                    // aqui hace la simulacion para agrupar los circle packs de Comunas entre si.

            var dataSim = bubbles.data();

            var simulation = d3.forceSimulation(dataSim)
                .force('charge', d3.forceManyBody().strength(function (d) { return -d.r }).distanceMax(150))
                .force('x', d3.forceX().x(function (d, i) {
                    return d.joinAround[0]
                }).strength(0.1))
                .force('y', d3.forceY().y(function (d) {
                    return d.joinAround[1];
                }).strength(0.1))
                .force('collision', d3.forceCollide().radius(function (d) { return d.r + 1; }).strength(1))
                .alphaDecay(0.07)
                .on('end', actualiza)
                ;

                function actualiza() {
                    bubbles.data().forEach(element => {
                            element.comunaPosX = element.x;
                            element.comunaPosY = element.y;
                        });
    
                }
              
            window.bubblesToDisciplinas = function(){
                 update(vRoot,"tipo")
                
            }
            window.bubblesToComunas = function(){
                update(vRoot, "comuna")
                
            }

       } // END READY

    function drawViz(vRoot) {
               
        // genera los groups con la posicion
       var categoriasGroups = g.selectAll('g')
            .data(vRoot.descendants().filter((d)=>d.depth == 2))
            .enter().append('g')
            .attr("class", "hijes")
            .attr("transform", function (d, i) {
                return "translate(" + d.tipoPosX + "," + d.tipoPosY + ")"
            });
     

            // dibuja los bubles
           categoriasGroups
                    .append("circle")
                    .style("fill", function (d, i) { 
                        return colorScale(d.data.tipo); 
                    })
                    .attr('r', function (d) { return d.r; });

            
            
            var categoriesTags = [];
            // dibuja los titulos de Tipo
           g.append("g").attr("id", "titulostipo").attr('class','titulos').selectAll('g')
            .data(vRoot.descendants().filter((d) => d.depth == 1))
            .enter().append('g')
            .attr("id", (d) => d.data.name)
            .attr("transform", function (d, i) {
                return "translate(" + d.tipoPosX + "," + d.tipoPosY + ")"
            })
             .append("text")
               .text(function (d, i) {
                   
                    categoriesTags.push({
                                        nombre: d.data.name.toProperCase(),
                                        color: colorScale(i)
                                    })
                   return d.data.name.toProperCase();
               })
               .style("text-anchor", "middle")
               .attr("y", (d) => d.rowValue)
               .call(wrap, isSmallDevice ? 60 : 100);

            var bubblesLegends = d3.select('#bubbles-references').selectAll('div')
                .data(categoriesTags).enter();

             var innerRow = bubblesLegends.append('div')
                          .attr('class','row');
           innerRow.append('div').attr('class','col-xs-10')
                       .append('p').attr('class','mini').html(function(d){return d.nombre;});
            innerRow.append('div').attr('class','col-xs-2')
                       .append('p').attr('class','color').style('background-color', function (d) { return d.color; })

            
    }

  

    function update(datos, state) {


            var notState = "comuna"
           if(state=="comuna"){
            notState="tipo";
              // transiciona los bubbles
              d3.selectAll(".hijes")
                   .transition().duration(1000)
                   .attr("transform", function (d, i) {
                       return "translate(" + d.comunaPosX + "," + d.comunaPosY + ")"
                   });

               d3.select("#titulostipo").transition().duration(100) // oculta los otros titulos
                   .style("opacity", 0);
            

            }else{
                 // transiciona los bubbles
                d3.selectAll(".hijes")
                   .transition().duration(1000)
                   .attr("transform", function (d, i) {
                       return "translate(" + d.tipoPosX + "," + d.tipoPosY + ")"
                   });
                d3.select("#tituloscomuna").transition().duration(100)  // oculta los otros titulos
                   .style("opacity", 0);

            }
        
            d3.select('#disciplinas').attr("height", altoSvg[state]); 
        
        // fabrica los titulos de comuna solo si no existen
        if(!d3.select("#tituloscomuna")._groups[0][0]){
        g.append("g").attr("id", "tituloscomuna").attr('class','titulos').selectAll('g')
            .data(datos.descendants().filter((d) => d.depth == 1))
            .enter().append('g')
            .attr("id", (d) => d.data.name)
            .attr("transform", function (d, i) {
                return "translate(" + d.comunaPosX + "," + d.comunaPosY + ")"
            })
            .append("text")
            .text(function (d, i) {
                return d.data.name;
            })
            .style("text-anchor", "middle")
            .style("opacity", 0)
            .attr("y",(d)=>d.rowValue)
            .call(wrap, 60)
            .transition().duration(500).delay(500)
            .style("opacity", 1);
        };
        
        d3.select("#titulos"+notState).style("opacity", 0);

        d3.select("#titulos"+state).transition().duration(400).delay(500) // prende los titulos correctos
            .style("opacity", 1);
    }


      function prepareData(datos, state) { // Aca preparo la data y la nesteo con respecto al "state" (tipo, comuna, etc)

            if (state != "comuna") {
                var nestedNodes = d3.nest()
                    .key(function (d) {
                        return d[state];
                    })
                    .rollup(function (leaves) {
                        return {
                            lugares: leaves.length,
                            actividades: d3.sum(leaves, function (d) { return (+d.value) }),
                            todas: leaves
                        };
                    })
                    .entries(datos)
                var childrens = nestedNodes.map(function (p) {
                    return {
                        "name": p.key, "children": p.value.todas.sort(function (x, y) {
                            return d3.descending(x.value, y.value);
                        })
                    }
                })


            } else {
                var nestedNodes = d3.nest()
                    .key(function (d) {
                        return d[state];
                    })
                    .key(function (d) {
                        return d.tipo;
                    })
                    .rollup(function (leaves) {
                        return {
                            lugares: leaves.length,
                            actividades: d3.sum(leaves, function (d) { return (+d.value) }),
                            todas: leaves
                        };
                    })
                    .entries(datos)

                var childrens = nestedNodes.map(function (e) {
                    return {
                        "name": e.key, "children": e.values.map(function (p) {
                            return {
                                "name": p.key, "children": p.value.todas.sort(function (x, y) {
                                    return d3.descending(x.value, y.value);
                                })
                            }
                        })
                    }


                })

            }


            var data = {
                "name": "A1",
                "children": childrens
            }
            return data;
        }


}

// funciones extra

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