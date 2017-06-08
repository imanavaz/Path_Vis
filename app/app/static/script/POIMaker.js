
function createMarker (){

}



function makePOIMarkerFlag(valueCount, values, maxScale, markerImageURL) {

    //shape configurations
    var locationPointRadius = 4;
    var defaultStroke = 2;

    var flagWidth = 39;
    var flagHeight = (valueCount * 10);
    var flagParts = valueCount;

    var shapeWidth = 45;

    var markerImageSize = 20;

    var shapeHeight = flagHeight + 2 + markerImageSize; // 13; XXXXXX 13 was for the flag pole and line

    //The SVG Container
    var svgContainer = d3.select("body").append("svg")
        .remove()
        .attr("xmlns", "https://www.w3.org/2000/svg")
        .attr("xmlns:xlink", "https://www.w3.org/1999/xlink")
        .attr("width", shapeWidth)
        .attr("height", shapeHeight + flagWidth); //flag width for image marker

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

    //add marker logo
    //svgContainer.append("svg:image")
    //  .attr(":xlink:href",markerImageURL)
    //   .attr("x", locationPointRadius)
    //  .attr("y",shapeHeight)
    //  .attr("width", flagWidth)
    //  .attr("height", flagWidth); //make it a square


    d3.xml(markerImageURL).mimeType("image/svg+xml").get(function(error, xml) {
        if (error) throw error;

        var svgInside = xml.getElementsByTagName("svg")[0];

        svgInside.setAttribute("x", "0");
        svgInside.setAttribute("y", flagHeight + 2);
        svgInside.setAttribute("width", markerImageSize);
        svgInside.setAttribute("height", markerImageSize);
        //svgInside.setAttribute("viewBox", "0 0 "+ markerImageSize + " " + markerImageSize);
        //svgInside.setAttribute("style", "enable-background:new "+"0 0 "+ markerImageSize + " " + markerImageSize+";");

        svgContainer.node().appendChild(xml.documentElement);
    });




    //svgContainer.node().appendChild(fetchXML(markerImageURL,function(newSVGDoc){
    //import it into the current DOM
    //    var n = document.importNode(newSVGDoc.documentElement,true);
    //    document.documentElement.appendChild(n);
    //}));




    //console.log(svgContainer.node().outerHTML);

    return svgContainer;
}

function fetchXML(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function(evt) {
        //Do not explicitly handle errors, those should be
        //visible via console output in the browser.
        if (xhr.readyState === 4) {
            callback(xhr.responseXML);
        }
    };
    xhr.send(null);
};



function getColor(n) {
    var colors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
    return colors[n % colors.length];
}
