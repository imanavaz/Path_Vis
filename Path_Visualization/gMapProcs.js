//Map works
function initMap() {
    var directionsDisplay = new google.maps.DirectionsRenderer;
    var directionsService = new google.maps.DirectionsService;
    var gMapBase = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 8,
        center: { lat: -37.811106, lng: 144.962160 }
    });
    directionsDisplay.setMap(gMapBase);

    var trajectoryList = document.getElementById("trajectory-list");
    trajectoryList.addEventListener("change", function () {
        processData(trajectoryList, directionsService,directionsDisplay);
    });

    var modeList = document.getElementById("mode");
    modeList.addEventListener("change", function () {
        processData(trajectoryList, directionsService, directionsDisplay);
    });
}


function processData(trajectoryList, directionsService, directionsDisplay) {
    var trajectoryFile = 'http://localhost:26648/Data/trajectory_photos.csv';
    var locations = [];
    
    d3.csv(trajectoryFile, function (data) {
        data.forEach(function (d) {
            if (d.Trajectory_ID == trajectoryList.value)
                locations.push(d);
        });
        if (locations.length > 0)
            calculateAndDisplayRoute(directionsService, directionsDisplay, locations);
        else
            alert("No trajectories found!");
    });
}


function calculateAndDisplayRoute(directionsService, directionsDisplay, locations) {
    var waypts = [];
    //var checkboxArray = document.getElementById('waypoints');
    for (var i = 1; i < locations.length-1; i++) {
        waypts.push({
            location: locations[i].Latitude + ',' + locations[i].Longitude,
            stopover: true
        });
    }

    directionsService.route({
        origin: locations[0].Latitude + ',' + locations[0].Longitude,
        destination: locations[locations.length - 1].Latitude + ',' + locations[locations.length - 1].Longitude,
        waypoints: waypts,
        optimizeWaypoints: false,
        travelMode: document.getElementById('mode').value,
    }, function (response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
            var route = response.routes[0];

            var summaryPanel = document.getElementById('directions-panel');
            summaryPanel.innerHTML = '<br/>';
            // For each route, display summary information.
            for (var i = 0; i < locations.length; i++) {
                var routeSegment = numberToAlphabetConverter(i);//i + 1;
                summaryPanel.innerHTML += '<a href="' + locations[i].URL + '" target="_blank">' + 'Photo at Marker ' + routeSegment + '</a>';
                summaryPanel.innerHTML += '<br/><br/>';
            }
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}


//Convert Numbers to Alphabet
function numberToAlphabetConverter(n) {
    var ordA = 'A'.charCodeAt(0);
    var ordZ = 'Z'.charCodeAt(0);
    var len = ordZ - ordA + 1;

    var s = "";
    while (n >= 0) {
        s = String.fromCharCode(n % len + ordA) + s;
        n = Math.floor(n / len) - 1;
    }
    return s;
}
