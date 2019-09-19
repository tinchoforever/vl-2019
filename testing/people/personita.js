function personitasStart() {
var layout = d3_iconarray
                .layout()
                .width(6);

var data = d3.range(0,156);
var cantidad = d3.range(0, 7);

var selectos=[1,5,8,14,20,32,43];
var years = d3.range(2012,2019);
var cantidades=[156,31,20,11,8,5,3];

var grid = layout(data);
var dotRadius = 8;
    var width = isSmallDevice? 300 : 600, 
	height = 700, 
	margin = {top:20, bottom:20, left:20, right:20 };

var anchocolumna = (width - margin.left - margin.right)/7;


var arrayScalex = d3_iconarray.scale()
	.domain([0, layout.maxDimension(data.length) ])
	.range([0, 300])
    ;

    var arrayScaley = d3_iconarray.scale()
        .domain([0, layout.maxDimension(data.length)])
        .range([0, 550])
        ;

var svg = d3.select('#personitas')
		.append('svg')
			.attr('width',width)
            .attr('height',height)
		.append('g')
			.attr('transform','translate('+margin.left+','+margin.top+')');

var columna = svg.selectAll('g')
    .data(cantidad)
    .enter()
    .append('g')
    .attr('transform', function (d,i) {
        return 'translate(' + i*anchocolumna + ',0)'
    })
    ;

    var textos = columna.append("text")
    .attr("text-anchor","middle")
        textos.append("tspan")
            .attr("class", "anios")
            .text(d=>years[d]+"/"+(years[d]+1-2000))
            .attr("x",anchocolumna/2)
            .attr("opacity",0);
        
        textos.append("tspan")
            .attr("class", "cantidades")
            .text(d => "1 de "+ cantidades[d])
            .attr("x",anchocolumna / 2)
            .attr("dy", 20)
            .attr("opacity", 0);

    columna.selectAll('g')
	.data(grid)
		.enter()
    .append('g')
        .attr("class","personajeGroup")
        .attr('transform', function(d){ 
		        return 'translate('+arrayScalex(d.position.x)+','+ (30+arrayScaley(d.position.y))+')' 
	    })
	.append("use")

            .attr("href", "#persona")
            .attr("width", 20)
            .attr("height", 20)
            .attr("stroke-width", "0px")
            .attr("opacity",0)
            .attr("class", "personita")
            .attr("fill", "#aaa");
    
           //**************** BETA TESTING AREA

            //  setTimeout(function () {
            //      personitasStart();
            //  }, 1000)

   
       
   
                d3.selectAll(".personita").transition() // transicion personitas grises
                    .delay(function (d, i) { 
                        return d3.select(this.parentNode.parentNode).datum()*50 + d.data*4})
                    .duration(100)
                    .attr("opacity",1)

                d3.selectAll(".anios").transition() // transicion años
                    .delay(function (d, i) {
                        return i * 50
                    })
                    .duration(100)
                    .attr("opacity", 1)

                d3.selectAll(".cantidades").transition() // transicion años
                    .delay(function (d, i) {
                        return (i * 600)+500
                    })
                    .duration(300)
                    .attr("opacity", 1)


                       setTimeout(function () {
                                d3.selectAll(".personita").filter(function (e, r) {
                                    if (e.data < selectos[d3.select(this.parentNode.parentNode).datum()]) {
                                        return 1;
                                    }
                                    return 0;
                                }).transition()
                                    .delay(function (d, i) {
                                        return d3.select(this.parentNode.parentNode).datum() * 600 + d.data * 20
                                    })
                                    .attr("href", "#participante")
                                    .attr("fill", "#000");
                            }, 500)
                                      

       setTimeout(function () {
           d3.selectAll(".personita").filter(function (e, r) {
               if (e.data < selectos[d3.select(this.parentNode.parentNode).datum()]) {
                   return 1;
               }
               return 0;
           }).transition()
               .delay(function (d, i) {
                   return d3.select(this.parentNode.parentNode).datum() * 200 + d.data * 50
               })
               .attr("href", "#participante")
               .attr("fill", "#000");
       }, 4700)

            }


