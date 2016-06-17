"use strict";

var markerArray = [];
var allMelbournePOIs = [];
var gMapBase;
var icons;
var trajectories = []; //to keep trajectories calcualted by all algorithms

﻿//Map works
function initMap() {

    var directionsDisplay = new google.maps.DirectionsRenderer({
      suppressMarkers: true
    });
    var directionsService = new google.maps.DirectionsService;
    gMapBase = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 8,
        center: { lat: -37.811106, lng: 144.962160 }
    });
    directionsDisplay.setMap(gMapBase);

    // Instantiate an info window to hold step text.
    //markerInfoDisplay = new google.maps.InfoWindow();

    gMapBase.controls[google.maps.ControlPosition.RIGHT_TOP].push(
      document.getElementById('legend-panel'));


    var trajectoryList = document.getElementById("trajectory-list");
    trajectoryList.addEventListener("change", function () {
        processData(trajectoryList, directionsService,directionsDisplay);
    });

    var modeList = document.getElementById("mode");
    modeList.addEventListener("change", function () {
        processData(trajectoryList, directionsService, directionsDisplay);
    });

    var algList = document.getElementById("alg-list");
    algList.addEventListener("change", function () {
        processData(trajectoryList, directionsService, directionsDisplay);
    });

    //prepare markers
    var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
    icons = {
      parking: {
        icon: iconBase + 'parking_lot_maps.png'
      },
      library: {
        icon: iconBase + 'library_maps.png'
      },
      info: {
        icon: iconBase + 'info.png'
      },
      sport: {
        icon: iconBase + 'play.png'
      },
      transport:{
        icon: iconBase + 'rail.png'
      },
      park:{
        icon: iconBase + 'parks.png'
      },
      shopping:{
        icon: iconBase + 'shopping.png'
      },
      city: {
        icon: iconBase + 'museum.png'
      },
      entertainment: {
        icon: iconBase + 'movies.png'
      },
      art: {
        icon: iconBase + 'arts.png'
      },
      structure: {
        icon: iconBase + 'landmark.png'
      },
      institution: {
        icon: iconBase + 'govtbldgs.png'
      }
    };

}


function processData(trajectoryCombo, directionsService, directionsDisplay) {
    var trajectoryFile = 'Data/Melb_recommendations.csv';
    var selectedTrajectory = [];//only one will be used

    for (var i = 0; i < 10; i++){//initialize trajecotires array
      trajectories[i] = new Array(6);//algorithm name, POIs, Time, Distance, Path, Markers
      trajectories[i]["Name"] = undefined;
      trajectories[i]["POIs"] = [];
      trajectories[i]["Duration"] = 0;
      trajectories[i]["Distance"] = 0;
      trajectories[i]["Path"] = undefined;
      trajectories[i]["Markers"] = undefined;
    }

//read Melbourne POIs
var poiFile = 'Data/poi-Melb-all.csv';
    var poiCount = 0;
    d3.csv(poiFile, function (data) {
        data.forEach(function (d) {
          var poiData = [];
          poiData["poiID"] = d.poiID;
          poiData["poiName"] = d.poiName;
          poiData["poiTheme"] = d.poiTheme;
          poiData["poiLat"] = d.poiLat;
          poiData["poiLon"] = d.poiLon;
          poiData["poiURL"] = d.poiURL;
          poiData["poiPopularity"] = d.poiPopularity;

          allMelbournePOIs[poiCount] = new Array (7);
          allMelbournePOIs[poiCount] = poiData;
          poiCount++;
      });

    var trajCount;

    var algList = document.getElementById("alg-list");
    var algorithm = algList.value;

    var dsv = d3.dsv(";", "text/plain");

    dsv(trajectoryFile, function (data) {
        data.forEach(function (d) {
          if (d.trajID == trajectoryCombo.value)
          {
            trajectories[0]["Name"] = "REAL";
            trajectories[0]["POIs"] = arrayStringToArrayNumberConverter(d["REAL"]);
            trajectories[1]["Name"] = "PoiPopularity";
            trajectories[1]["POIs"] = arrayStringToArrayNumberConverter(d["PoiPopularity"]);
            trajectories[2]["Name"] = "PoiRank";
            trajectories[2]["POIs"] = arrayStringToArrayNumberConverter(d["PoiRank"]);
            trajectories[3]["Name"] = "Markov";
            trajectories[3]["POIs"] = arrayStringToArrayNumberConverter(d["Markov"]);
            trajectories[4]["Name"] = "MarkovPath";
            trajectories[4]["POIs"] = arrayStringToArrayNumberConverter(d["MarkovPath"]);
            trajectories[5]["Name"] = "RankMarkov";
            trajectories[5]["POIs"] = arrayStringToArrayNumberConverter(d["RankMarkov"]);
            trajectories[6]["Name"] = "RankMarkovPath";
            trajectories[6]["POIs"] = arrayStringToArrayNumberConverter(d["RankMarkovPath"]);
            trajectories[7]["Name"] = "StructuredSVM";
            trajectories[7]["POIs"] = arrayStringToArrayNumberConverter(d["StructuredSVM"]);
            trajectories[8]["Name"] = "PersTour";
            trajectories[8]["POIs"] = arrayStringToArrayNumberConverter(d["PersTour"]);
            trajectories[9]["Name"] = "PersTourL";
            trajectories[9]["POIs"] = arrayStringToArrayNumberConverter(d["PersTourL"]);

            for (trajCount = 0; trajCount < 10; trajCount++)//10 algorithms
            {
              var trajectoryPOIs = trajectories[trajCount].POIs;

              if (trajectoryPOIs.length > 1)
              {
                var POIs = [];//to fetch POI details from the file

                for (var c=0; c < trajectoryPOIs.length; c ++)
                {
                  POIs[c] = grabPOI(trajectoryPOIs[c]);
                }

                //imported code - prepare waypoints
                var batches = [];
                var itemsPerBatch = 10; // google API max - 1 start, 1 stop, and 8 waypoints
                var itemsCounter = 0;
                var wayptsExist = POIs.length > 0;

                while (wayptsExist) {
                    var subBatch = [];
                    var subitemsCounter = 0;

                    for (var j = itemsCounter; j < POIs.length; j++) {
                        subitemsCounter++;
                        subBatch.push({
                            location: new window.google.maps.LatLng(POIs[j].poiLat, POIs[j].poiLon),
                            stopover: true,
                        });
                        if (subitemsCounter == itemsPerBatch)
                            break;
                    }

                    itemsCounter += subitemsCounter;
                    batches.push(subBatch);
                    wayptsExist = itemsCounter < POIs.length;
                    // If it runs again there are still points. Minus 1 before continuing to
                    // start up with end of previous tour leg
                    itemsCounter--;
                }


                if (POIs.length > 0) {
                  var calculationResults = [];

                  if (algorithm == trajectories[trajCount].Name)
                  {
                    //sortout the markers
                    // First, clear out any existing markerArray
                    // from previous calculations.
                    for (i = 0; i < markerArray.length; i++) {
                        markerArray[i].setMap(null);
                    }
                    for (var i = 0; i < POIs.length; i++) {
                        var markerPosition = {lat: parseFloat(POIs[i].poiLat), lng: parseFloat(POIs[i].poiLon)};

                        var markerIcon;
                        if (POIs[i].poiTheme == "Sports stadiums")
                          markerIcon = icons["sport"].icon;
                        else if (POIs[i].poiTheme == "Parks and spaces")
                          markerIcon = icons["park"].icon;
                        else if (POIs[i].poiTheme == "Transport")
                          markerIcon = icons["transport"].icon;
                        else if (POIs[i].poiTheme == "City precincts")
                          markerIcon = icons["city"].icon;
                        else if (POIs[i].poiTheme == "Shopping")
                          markerIcon = icons["shopping"].icon;
                        else if (POIs[i].poiTheme == "Entertainment")
                          markerIcon = icons["entertainment"].icon;
                        else if (POIs[i].poiTheme == "Public galleries")
                          markerIcon = icons["art"].icon;
                        else if (POIs[i].poiTheme == "Institutions")
                          markerIcon = icons["institution"].icon;
                        else if (POIs[i].poiTheme == "Structures")
                          markerIcon = icons["structure"].icon;
                        else
                          markerIcon = icons["info"].icon;


                        var marker = new google.maps.Marker({
                          position: markerPosition,
                          map: gMapBase,
                          icon: markerIcon
                        });
                        attachInstructionText(marker, POIs[i]);
                        markerArray[i] = marker;
                    }

                    calcRoute(batches, directionsService, directionsDisplay, true, trajCount);

                  }
                  else{
                    calcRoute(batches, directionsService, directionsDisplay, false, trajCount);
                  }

                }
                else
                    console.log("No trajectories found!");
            }
            else
            {
              console.log("Trajectory does not exists");
            }
          }//end of for loop for algorithms
          generateTrajectoryListVis(trajectories);
          return; //break out of foreach loop
        }//end if trajectory id is found
      });//end data foreach
    })//end dsv
  });
}


function calcRoute (batches, directionsService, directionsDisplay, shouldDisplay, trajIndex) {
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

        //(function (kk)
        //{
            directionsService.route(request, function (result, status) {
                if (status == window.google.maps.DirectionsStatus.OK) {

                    var unsortedResult = {
                        order : 0,//kk,
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
                    }

                    if (shouldDisplay){
                      directionsDisplay.setDirections(combinedResults);
                      //console.log(combinedResults);
                    }

                    //calculate total duration and distance of trip
                    var totalDistance = 0.0;
                    var totalDuration = 0.0;
                    for (var i=0; i < combinedResults.routes[0].legs.length; i++) {
                      totalDistance += combinedResults.routes[0].legs[i].distance.value;
                      totalDuration += combinedResults.routes[0].legs[i].duration.value;
                    }
                    trajectories[trajIndex].Distance = JSON.parse(JSON.stringify(totalDistance / 1000));
                    trajectories[trajIndex].Duration = JSON.parse(JSON.stringify(parseInt(totalDuration / 60)));

                    trajectories[trajIndex].Path = combinedResults;
console.log(trajectories[trajIndex].Distance);
                }
            });
        //})(k);

        return;
    }
}

function generateTrajectoryListVis(tList){
  console.log(tList);

  var myChart = document.getElementById("chart");
  //console.log(tList[0].Distance);
  for (var c = 0; c < tList.length; c++){

    var listElement = document.createElement('li');
    listElement.appendChild(document.createTextNode(tList[c].Name
      +" Distance is : "+tList[c].Distance
      +" Duration is : "+tList[c].Duration));

    myChart.appendChild(listElement);

  }

}


//this would load POIs but have not been used in the code
function loadPOIs(){
  //read Melbourne POIs
  var poiFile = 'Data/poi-Melb-all.csv';

  var poiCount = 0;
  d3.csv(poiFile, function (data) {
      data.forEach(function (d) {
        var poiData = [];
        poiData["poiID"] = d.poiID;
        poiData["poiName"] = d.poiName;
        poiData["poiTheme"] = d.poiTheme;
        poiData["poiLat"] = d.poiLat;
        poiData["poiLon"] = d.poiLon;
        poiData["poiURL"] = d.poiURL;
        poiData["poiPopularity"] = d.poiPopularity;

        allMelbournePOIs[poiCount] = new Array (7);
        allMelbournePOIs[poiCount] = jQuery.extend(true, {}, poiData);
        poiCount++;
    });
  });
}


function grabPOI (poiID){
  for(var i = 0; i < allMelbournePOIs.length; i++)
  {
    if (allMelbournePOIs[i].poiID == poiID){
      return allMelbournePOIs[i];
    }
  }
}


function attachInstructionText(marker, poi) {

  var infoContentString = '<p>'+
       poi.poiName+
      '<p>Theme: '+poi.poiTheme+'</p>'+
      '<p><a href="'+poi.poiURL+'"> on Wikipedia ...</a> '+'</p>'+
      '<p>Popularity: '+poi.poiPopularity+'</p>' +
      '</p>';

  var markerInfoDisplay = new google.maps.InfoWindow({
          content: infoContentString
        });
  google.maps.event.addListener(marker, 'click', function() {
    markerInfoDisplay.open(gMapBase, marker);
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

//just works for this application due to bad encoding of numbers in csv file
function arrayStringToArrayNumberConverter (str){
  str = str.replace("[","");
  str = str.replace("]","");
  str = str.replace(",","");

  var result = [];

  result = str.split(' ');

  for (var i = 0; i< result.length; i++)
    result[i] = parseInt(result[i]);

  return result;
}






/****** Previous Process Data, works for first batch of datafiles ******/
/*function processData(trajectoryList, directionsService, directionsDisplay) {
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
}*/
