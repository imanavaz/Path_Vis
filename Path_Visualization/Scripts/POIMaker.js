
function makePOIMarkerFlag(valueCount, values) {

   //shape configurations
   var shapeWidth = 45;
   var shapeHeight = (valueCount * 10) + 13;

   var locationPointRadius = 4;
   var defaultStroke = 2;

   var flagWidth = 39;
   var flagHeight = (valueCount * 10);
   var flagParts = valueCount;

    //The SVG Container
    var svgContainer = d3.select("body").append("svg")
        .remove()
        .attr("width", shapeWidth)
        .attr("height", shapeHeight);

    //draw flag pole
    var line = svgContainer.append("line")
        .attr("stroke", "black")
        .attr("stroke-width", defaultStroke)
        .attr("x1", locationPointRadius)
        .attr("y1", 0)
        .attr("x2", locationPointRadius)
        .attr("y2", shapeHeight - locationPointRadius);

    //Draw the flag point
    var circle = svgContainer.append("circle")
        .attr("cx", locationPointRadius)
        .attr("cy", shapeHeight - locationPointRadius)
        .attr("r", locationPointRadius);

    //Draw the base flag
    for(var i = 0; i < flagParts; i++){
      var flagRect = svgContainer.append("rect")
          .attr("x", locationPointRadius)
          .attr("y", i * flagHeight / flagParts + defaultStroke / 2)
          .attr("width", flagWidth)
          .attr("height", flagHeight / flagParts)
          .attr("stroke", "black")
          .attr("fill", "none");
    }

    //fill flag parts
    for(var i = 0; i < flagParts; i++){
      var valueRect = svgContainer.append("rect")
          .attr("x", locationPointRadius + 1)
          .attr("y", i * flagHeight / flagParts + defaultStroke)
          .attr("width", (values[i] * flagWidth) / 100 - 2)
          .attr("height", flagHeight / flagParts - defaultStroke)
          .attr("stroke", "green")
          .attr("fill", "green");
    }

    return svgContainer;
}
