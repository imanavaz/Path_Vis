var map;
function initMap() {
    var mapOptions = {
        zoom: 8,
        center: new google.maps.LatLng(-36.911568, 144.929646)
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), 
        mapOptions);
}

google.maps.event.addDomListener(window, 'load', initialize);