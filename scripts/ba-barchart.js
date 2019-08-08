var publicosChart;
var columns =  ['x','PrimerInfancia', 'Niños','Jovenes', 'Adultos', 'AudltosMayores','Público'];
var types = ['8-11','12-15','16-19','20-23'];




var activeDataset = ['value',100,1200, 2300,5500,50,1556];
var initDataset  = ['value',0,0,0,0,0,0];
var chartColors = ['#0389d1', "#19c3e3","#a6a4a4 " ,"#f3a32d"];

var colors = {}

types.map(function(m,i){
    colors[m] = chartColors[i];
})


var publicoTotalChart, emptyPublicoChart, publicosData, secondPublicoChart;

var initBarChartPublico = function(){


d3.csv('data/publicos.csv',function(data){

    publicosData = data;
        
        //first chart total
        var publicosDataNest = d3.nest()
            .key(function(d) {
              return d['Publico Objetivo'];
            }).rollup(function(leaves){
                return d3.sum(leaves, function(d){
                    return d.Cantidad;
                });
        }).entries(publicosData);


        var publicosColumns = publicosDataNest.map(function(d){
            return d.key;
        });
        publicoTotalChart =  publicosDataNest.map(function(d){
                return { publico: d.key, '8-11': d.value};
            });
        
        emptyPublicoChart = publicosDataNest.map(function(d){
                return { publico: d.key, '8-11':0};
            });

        // //second chart


        var groupsTime = [];
        groupsTime.push({
            label:'8-11',
            bot:8,
            top:11,
        });

        groupsTime.push({
            label:'12-15',
            bot:12,
            top:15,
        });

        groupsTime.push({
            label:'16-19',
            bot:16,
            top:19,
        });

        groupsTime.push({
            label:'20-23',
            bot:20,
            top:23,
        });

  
        var getGroupLabel = function(h){
            var group = {};
            for (var i = 0; i < groupsTime.length; i++) {
                var g = groupsTime[i];
                var hh = parseInt(h);
                if (hh >= g.bot && hh <= g.top ){
                    group = g;
                    break;
                }
            }
            return group;
        }
       secondPublicoChart = d3.nest()
            .key(function(d) {
              return d['Publico Objetivo'];
            }).entries(publicosData)
            .map(function(m){

                var entires = d3.nest()
                    .key(function(d) {
                      return getGroupLabel(d['HoraInicio']).label;
                    }).rollup(function(leaves){
                        return d3.sum(leaves, function(d){
                            return d.Cantidad;
                        });
                }).entries(m.values).map(function(d){
                    return { hour: d.key, item : d.value};
                });

               var r = { publico: m.key};
               entires.map(function(z){
                r[z.hour] = z.item;
               });
               return r;
            });
        console.log(secondPublicoChart)









        publicosChart = c3.generate({
        bindto:'#publicoChart',

        data: {
            type: 'bar',
            keys: {
                  value:  types,
                  x:'publico'
            },
            colors: colors,
            json: publicoTotalChart,
            groups:  [ types],
            names: {
                '8-11': 'Actividades'
            },

        },
         legend: {
            // position : 'right',
        },
      padding: {
                left: 180,
                right:0,
                bottom:40,
            },
            margin:{
                left:20
            },
        size: {
            height: 400,
        },
        transition: {
            duration: 1500       
        },
        axis: {
            x: {

               type: 'category'
            },
            y: {
              show:false,
              max:5000,
              tick: {
                  fit: true,
                  count:3
              }
          },
        rotated: true
        }
    });
    
})
  
}

var showMoreColums = function(){
    types.map(function(t){
        publicosChart.legend.hide(t);    
    })

    
    publicosChart.legend.show('8-11');    
    
    

    publicosChart.load({
        json: publicoTotalChart,
            keys: {
              value: types,
              x:'publico'
        },
        names: {
                '8-11': 'Actividades'
            },
    });
}


var originalMoreColums = function(){
    publicosChart.load({
        json: emptyPublicoChart,
        keys: {
              value: types,
              x:'publico'
        }

    });
};


var startSecondChart = function(){
    types.map(function(t){
        publicosChart.legend.show(t);    
    })

    
    

    publicosChart.load({
        json: secondPublicoChart,
        keys: {
              value: types,
              x:'publico'
        },
        names: {
                '8-11': '8-11'
            },
    });
};


var updateSecondChart = function(){
    publicosChart.load({
        json: secondPublicoChart,
        keys: {
              value: types,
              x:'publico'
        },
        names: {
                '8-11': '8-11'
            },
    });
};


