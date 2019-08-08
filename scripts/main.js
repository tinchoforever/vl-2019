var eventBus = [];
eventBus["stepMap0"] = function(){
  transicionaMapa(0);
}
eventBus["stepMap1"] = function(){
  transicionaMapa(1);
}
eventBus["stepMap2"] = function(){
  transicionaMapa(2);
}
eventBus["stepMap3"] = function(){
  transicionaMapa(3);
}
eventBus["stepMap4"] = function(){
  transicionaMapa(4);
}
eventBus["stepMap5"] = function(){
  transicionaMapa(5);
}
eventBus["stepMap6"] = function(){
  transicionaMapa(6);
}
eventBus["stepMap7"] = function(){
  transicionaMapa(7);
  $('#scroll2 .scroll__graphic').show();
}

eventBus["stepBubbles2"] = function(){
  bubblesToComunas();
}
eventBus["stepBubbles1"] = function(){
  bubblesToDisciplinas();
}

eventBus["stepBubbles0"] = function(){
  bubblesToDisciplinas();
}


eventBus["stepPublico1"] = function(){
  showMoreColums();
}
eventBus["stepPublico2"] = function(){
  showMoreColums();
}

eventBus["stepPublico3"] = function(){
  originalMoreColums();
  startSecondChart();
}

eventBus["stepPublico4"] = function(){
  updateSecondChart();
}

eventBus["stepPublico5"] = function(){
  updateSecondChart();
}




function init(selector) {
  // using d3 for convenience
  var container = d3.select(selector);
  var graphic = container.select(".scroll__graphic");
  var text = container.select(".scroll__text");
  var step = text.selectAll(".step");

  // initialize the scrollama
  var scroller = scrollama();

  // scrollama event handlers
  function handleStepEnter(response) {
    // response = { element, direction, index }

    // add color to current step only
    step.classed("is-active", function(d, i) {
      return i === response.index;
    });

    var fn = eventBus[response.element.dataset.step];
    console.log( response.element.dataset.step)
    if(typeof fn === 'function') {
        fn();
    }else{
      console.log('no result for', response.element.dataset.step);
    }
  }

  function handleContainerEnter(response) {
  
      
  }

  function handleContainerExit(response) {
    

      
  }



  // 1. force a resize on load to ensure proper dimensions are sent to scrollama
  // generic window resize listener event
  function handleResize() {
    // 1. update height of step elements
      var stepHeight = Math.floor(window.innerHeight * 0.75);
      step.style('height', stepHeight + 'px');




      // 2. update width/height of graphic element
      var bodyWidth = d3.select('body').node().offsetWidth;

      graphic
        .style('width', bodyWidth + 'px')
        .style('height', window.innerHeight + 'px');

      var chartMargin = 32;
      var textWidth = text.node().offsetWidth;
      var chartWidth = graphic.node().offsetWidth - textWidth - chartMargin;
      var chart = d3.select('svg#svg-map')
      chart
        .style('width', chartWidth + 'px')
        .style('height', Math.floor(window.innerHeight) + 'px');

      scroller.resize()
  }

  // 2. setup the scroller passing options
  // this will also initialize trigger observations
  // 3. bind scrollama event handlers (this can be chained like below)
  scroller
    .setup({
      container: selector,
      graphic: selector+ " .scroll__graphic",
      text: selector+ " .scroll__text",
      step: selector+ " .scroll__text .step"
    })
    .onStepEnter(handleStepEnter)
    .onContainerEnter(handleContainerEnter)
    .onContainerExit(handleContainerExit);

  // setup resize event
  window.addEventListener("resize." + selector.substr(1), handleResize);
  handleResize();
}

// kick things off
var readyMap = function(){
  $('.cargando').hide();
  $('.start').show();
  $('#disciplinasScroll').show();
  $('#timelineScroll').show();
  $('#secondTimelineScroll').show();
  $('#publicosScroll').show();


}
  $('#disciplinasScroll').hide();
  $('#timelineScroll').hide();
  $('#secondTimelineScroll').hide();
  $('#publicosScroll').hide();

initSVGMAP(readyMap);
initBubbles();
initBarChartPublico();
initBaFechas();
init("#scroll");
init("#disciplinasScroll");
init("#timelineScroll");




(function setupStickyfill() {
    d3.selectAll(".sticky").each(function() {
      Stickyfill.add(this);
    });
  })();
