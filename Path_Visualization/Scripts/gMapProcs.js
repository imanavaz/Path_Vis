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
    var trajectoryFile = 'Data/trajectory_photos.csv';
    var locations = [];
    
    d3.csv(trajectoryFile, function (data) {
        data.forEach(function (d) {
            if (d.Trajectory_ID == trajectoryList.value)
                locations.push(d);
        });

        //imported code
        var batches = [];
        var itemsPerBatch = 10; // google API max - 1 start, 1 stop, and 8 waypoints
        var itemsCounter = 0;
        var wayptsExist = locations.length > 0;

        while (wayptsExist) {
            var subBatch = [];
            var subitemsCounter = 0;

            for (var j = itemsCounter; j < locations.length; j++) {
                subitemsCounter++;
                subBatch.push({
                    location: new window.google.maps.LatLng(locations[j].Latitude, locations[j].Longitude),
                    stopover: true
                });
                if (subitemsCounter == itemsPerBatch)
                    break;
            }

            itemsCounter += subitemsCounter;
            batches.push(subBatch);
            wayptsExist = itemsCounter < locations.length;
            // If it runs again there are still points. Minus 1 before continuing to 
            // start up with end of previous tour leg
            itemsCounter--;
        }

        if (locations.length > 0) {
            //calculateAndDisplayRoute(directionsService, directionsDisplay, locations);
            calcRoute(batches, directionsService, directionsDisplay);

            var summaryPanel = document.getElementById('directions-panel');
            summaryPanel.innerHTML = '<br/>';
            // For each route, display summary information.
            for (var i = 0; i < locations.length; i++) {
                var routeSegment = numberToAlphabetConverter(i);//i + 1;
                summaryPanel.innerHTML += '<a href="' + locations[i].URL + '" target="_blank">' + 'Photo at Marker ' + routeSegment + '</a>';
                summaryPanel.innerHTML += '<br/><br/>';
            }
        }
        else
            alert("No trajectories found!");
    });
}


function calcRoute (batches, directionsService, directionsDisplay) {
    var combinedResults;
    var unsortedResults = [{}]; // to hold the counter and the results themselves as they come back, to later sort
    var directionsResultsReturned = 0;
     
    for (var k = 0; k < batches.length; k++) {
        var lastIndex = batches[k].length - 1;
        var start = batches[k][0].location;
        var end = batches[k][lastIndex].location;
         
        // trim first and last entry from array
        var waypts = [];
        waypts = batches[k];
        waypts.splice(0, 1);
        waypts.splice(waypts.length - 1, 1);
         
        var request = {
            origin : start,
            destination : end,
            waypoints : waypts,
            travelMode: document.getElementById('mode').value
        };
        (function (kk) {
            directionsService.route(request, function (result, status) {
                if (status == window.google.maps.DirectionsStatus.OK) {
                     
                    var unsortedResult = {
                        order : kk,
                        result : result
                    };
                    unsortedResults.push(unsortedResult);
                     
                    directionsResultsReturned++;
                     
                    if (directionsResultsReturned == batches.length) // we've received all the results. put to map
                    {
                        // sort the returned values into their correct order
                        unsortedResults.sort(function (a, b) {
                            return parseFloat(a.order) - parseFloat(b.order);
                        });
                        var count = 0;
                        for (var key in unsortedResults) {
                            if (unsortedResults[key].result != null) {
                                if (unsortedResults.hasOwnProperty(key)) {
                                    if (count == 0) // first results. new up the combinedResults object
                                        combinedResults = unsortedResults[key].result;
                                    else {
                                        // only building up legs, overview_path, and bounds in my consolidated object. This is not a complete
                                        // directionResults object, but enough to draw a path on the map, which is all I need
                                        combinedResults.routes[0].legs = combinedResults.routes[0].legs.concat(unsortedResults[key].result.routes[0].legs);
                                        combinedResults.routes[0].overview_path = combinedResults.routes[0].overview_path.concat(unsortedResults[key].result.routes[0].overview_path);
                                         
                                        combinedResults.routes[0].bounds = combinedResults.routes[0].bounds.extend(unsortedResults[key].result.routes[0].bounds.getNorthEast());
                                        combinedResults.routes[0].bounds = combinedResults.routes[0].bounds.extend(unsortedResults[key].result.routes[0].bounds.getSouthWest());
                                    }
                                    count++;
                                }
                            }
                        }
                        directionsDisplay.setDirections(combinedResults);
                    }
                }
            });
        })(k);
    }
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
