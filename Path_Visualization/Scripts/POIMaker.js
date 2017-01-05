function makePOIMarkerFlag(valueCount, values, maxScale) {

    //shape configurations
    var shapeWidth = 45;
    var shapeHeight = (valueCount * 10) + 2;// 13; XXXXXX 13 was for the flag pole and line

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
    //var line = svgContainer.append("line")
    //    .attr("stroke", "black")
    //    .attr("stroke-width", defaultStroke)
    //    .attr("x1", locationPointRadius)
    //    .attr("y1", 0)
    //    .attr("x2", locationPointRadius)
    //    .attr("y2", shapeHeight - locationPointRadius);

    //Draw the flag point
    //var circle = svgContainer.append("circle")
    //    .attr("cx", locationPointRadius)
    //    .attr("cy", shapeHeight - locationPointRadius)
    //    .attr("r", locationPointRadius);

    //Draw the base flag
    for (var i = 0; i < flagParts; i++) {
        var flagRect = svgContainer.append("rect")
            .attr("x", locationPointRadius)
            .attr("y", i * flagHeight / flagParts + defaultStroke / 2)
            .attr("width", flagWidth)
            .attr("height", flagHeight / flagParts)
            .attr("stroke", "black")
            .attr("fill", "none");
    }

    //fill flag parts
    for (var i = 0; i < flagParts; i++) {
        var valueRect = svgContainer.append("rect")
            .attr("x", locationPointRadius + defaultStroke / 2)
            .attr("y", i * flagHeight / flagParts + defaultStroke)
            .attr("width", (values[i] * flagWidth) / maxScale - defaultStroke)
            .attr("height", flagHeight / flagParts - defaultStroke)
            .attr("stroke", getColor(i))
            .attr("fill", getColor(i));
    }

    return svgContainer;
}

function getColor(n) {
    var colors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
    return colors[n % colors.length];
}
