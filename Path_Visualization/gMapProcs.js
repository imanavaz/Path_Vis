var gMapBase;
var trajCanvasLayer;

function initMap() {
    var mapOptions = {
        zoom: 8,
        center: new google.maps.LatLng(-36.911568, 144.929646)
    };
    gMapBase = new google.maps.Map(document.getElementById('map-canvas'), 
        mapOptions);

    //map canvas layer
    trajCanvasLayer = new CanvasLayer({
        map: gMapBase,
        update: trajCanvasUpdate()
    })
}

google.maps.event.addDomListener(window, 'load', initialize);


//in case usign a canvas layer
function trajCanvasUpdate() {
    var scale = Math.pow(2, gMapBase.getZoom());
    var offset = projection.fromLatLngToPoint(
        trajCanvasLayer.getTopLeft());

    context.scale(scale, scale);
    context.traslate(-offset.x, -offset.y);
}


