﻿//Data works
var statsFile = 'http://localhost:26648/Data/trajectory_stats.csv';
var trajectoryFile = 'http://localhost:26648/Data/trajectory_photos.csv';

var statsArr;
var trajectoryArr;

var xmlhttp = new XMLHttpRequest();

xmlhttp.onreadystatechange = function () {
    //if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        var reader = new FileReader();
        reader.readAsText(statsFile);
        statsArr = $.csv.toObjects(xmlhttp.responseText);
        alert("t");
        createTrajectoryList(statsArr);
    //}
}
xmlhttp.open("GET", statsFile, true);
xmlhttp.send();


function createTrajectoryList(arr) {
    var trajList = document.getElementById('trajectory-list');
    var out = "";
    var i;
    alert(arr.length);
    for (i = 0; i < arr.length; i++) {
        //alert(arr[i]);
        //trajList.appendChild('<option value="" >' + arr[i] + '</option>');
        trajList.appendChild('<option value="" >' + arr[i] + '</option>');

    }
    
}




//Map works

function initMap() {
    var directionsDisplay = new google.maps.DirectionsRenderer;
    var directionsService = new google.maps.DirectionsService;
    var gMapBase = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 10,
        center: { lat: 37.77, lng: -122.447 }
    });
    directionsDisplay.setMap(gMapBase);

    document.getElementById('submit').addEventListener('click', function () {
        calculateAndDisplayRoute(directionsService, directionsDisplay);
    });
}



function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    var waypts = [];
    var checkboxArray = document.getElementById('waypoints');
    for (var i = 0; i < checkboxArray.length; i++) {
        if (checkboxArray.options[i].selected) {
            waypts.push({
                location: checkboxArray[i].value,
                stopover: true
            });
        }
    }

    directionsService.route({
        origin: document.getElementById('start').value,
        destination: document.getElementById('end').value,
        waypoints: waypts,
        optimizeWaypoints: true,
        travelMode: document.getElementById('mode').value,
    }, function (response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
            var route = response.routes[0];
            var summaryPanel = document.getElementById('directions-panel');
            summaryPanel.innerHTML = '';
            // For each route, display summary information.
            for (var i = 0; i < route.legs.length; i++) {
                var routeSegment = i + 1;
                summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment +
                    '</b><br>';
                summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
                summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
                summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
            }
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}
