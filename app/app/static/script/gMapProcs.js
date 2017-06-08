var markerArray = [];
var allMelbournePOIs = [];
var gMapBase;
var icons;
var trajectories = []; //to keep trajectories calcualted by all algorithms
var algorithm;
var directionsDisplay;
var POIpopularitySoftSum = 0.0;
var showPOIRatings = false;
var showPOICategories = true;

﻿ //Map works
function initMap() {

    directionsDisplay = new google.maps.DirectionsRenderer({
        suppressMarkers: true
    });

    var directionsService = new google.maps.DirectionsService;
    gMapBase = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 8,
        center: {
            lat: -37.811106,
            lng: 144.962160
        }
    });
    directionsDisplay.setMap(gMapBase);

    // Instantiate an info window to hold step text.
    //markerInfoDisplay = new google.maps.InfoWindow();

    gMapBase.controls[google.maps.ControlPosition.RIGHT_TOP].push(
        document.getElementById('legend-panel'));


    var trajectoryList = document.getElementById("trajectory-list");
    trajectoryList.addEventListener("change", function() {
        processData(trajectoryList, directionsService, directionsDisplay);
    });

    var modeList = document.getElementById("mode");
    modeList.addEventListener("change", function() {
        processData(trajectoryList, directionsService, directionsDisplay);
    });

    //var algList = document.getElementById("alg-list");
    //algList.addEventListener("change", function () {
    //    processData(trajectoryList, directionsService, directionsDisplay);
    //});

    //prepare markers
    //var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
    var iconBase = 'Images/';
    icons = {
        parking: {
            icon: iconBase + 'parking.svg'
        },
        library: {
            icon: iconBase + 'library.svg'
        },
        info: {
            icon: iconBase + 'embassy.svg'
        },
        sport: {
            icon: iconBase + 'test2.svg'//'stadium.svg'
        },
        transport: {
            icon: iconBase + 'bus-station.svg' //iconBase + 'rail.png'
        },
        park: {
            icon: iconBase + 'park.svg'
        },
        shopping: {
            icon: iconBase + 'shopping-mall.svg'
        },
        city: {
            icon: iconBase + 'city-hall.svg'
        },
        entertainment: {
            icon: iconBase + 'movie-theater.svg'
        },
        art: {
            icon: iconBase + 'art-gallery.svg'
        },
        structure: {
            icon: iconBase + 'point-of-interest.svg'
        },
        institution: {
            icon: iconBase + 'political.svg'
        }
    };

    //generate legend for algorithm list panel vis
    generateAlgorithmPanelLegend();

}


function processData(trajectoryCombo, directionsService, directionsDisplay) {
    var trajectoryFile = 'Data/Melb_recommendations.csv';
    var selectedTrajectory = []; //only one will be used

    for (var i = 0; i < 10; i++) { //initialize trajecotires array
        trajectories[i] = new Array(6); //algorithm name, POIs, Time, Distance, Path, Markers
        trajectories[i]["Name"] = undefined;
        trajectories[i]["POIs"] = [];
        trajectories[i]["Duration"] = 0;
        trajectories[i]["Distance"] = 0;
        trajectories[i]["Path"] = undefined;
        //trajectories[i]["Markers"] = undefined;
    }

    //read Melbourne POIs
    var poiFile = 'Data/poi-Melb-all.csv';
    var poiCount = 0;
    d3.csv(poiFile, function(data) {
        data.forEach(function(d) {
            var poiData = [];
            poiData["poiID"] = d.poiID;
            poiData["poiName"] = d.poiName;
            poiData["poiTheme"] = d.poiTheme;
            poiData["poiLat"] = d.poiLat;
            poiData["poiLon"] = d.poiLon;
            poiData["poiURL"] = d.poiURL;
            poiData["poiPopularity"] = d.poiPopularity;

            allMelbournePOIs[poiCount] = new Array(7);
            allMelbournePOIs[poiCount] = poiData;

            POIpopularitySoftSum = POIpopularitySoftSum + Math.exp(d.poiPopularity);
            poiCount++;
        });


        var trajCount;

        //var algList = document.getElementById("alg-list");
        if (algorithm == null)
            algorithm = 0; // put first algorithm as default, before it was algList.value;

        var dsv = d3.dsv(";", "text/plain");

        dsv(trajectoryFile, function(data) {
                data.forEach(function(d) {
                    if (d.trajID == trajectoryCombo.value) {
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


                        clearAlgorithmList();


                        for (trajCount = 0; trajCount < 10; trajCount++) //10 algorithms
                        {
                            var trajectoryPOIs = trajectories[trajCount].POIs;

                            if (trajectoryPOIs.length > 1) {
                                var POIs = []; //to fetch POI details from the file

                                for (var c = 0; c < trajectoryPOIs.length; c++) {
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

                                    calcRoute(batches, directionsService, directionsDisplay, trajCount);

                                } else
                                    console.log("No trajectories found!");
                            } else {
                                console.log("Trajectory does not exists");
                            }
                        } //end of for loop for algorithms

                        //displayRout(trajectories[0].Path, trajectories[0].POIs);

                        return; //break out of foreach loop
                    } //end if trajectory id is found
                }); //end data foreach
            }) //end dsv
    });
}


function calcRoute(batches, directionsService, directionsDisplay, trajIndex) {
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
            origin: start,
            destination: end,
            waypoints: waypts,
            travelMode: document.getElementById('mode').value
        };

        (function(kk) {
            directionsService.route(request, function(result, status) {
                if (status == window.google.maps.DirectionsStatus.OK) {

                    var unsortedResult = {
                        order: 0, //kk,
                        result: result
                    };
                    unsortedResults.push(unsortedResult);
                    directionsResultsReturned++;

                    if (directionsResultsReturned == batches.length) // we've received all the results. put to map
                    {
                        // sort the returned values into their correct order
                        unsortedResults.sort(function(a, b) {
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

                    //calculate total duration and distance of trip
                    var totalDistance = 0.0;
                    var totalDuration = 0.0;
                    if (combinedResults) {
                        for (var i = 0; i < combinedResults.routes[0].legs.length; i++) {
                            totalDistance += combinedResults.routes[0].legs[i].distance.value;
                            totalDuration += combinedResults.routes[0].legs[i].duration.value;
                        }
                    }
                    trajectories[trajIndex].Distance = JSON.parse(JSON.stringify(totalDistance / 1000));
                    trajectories[trajIndex].Duration = JSON.parse(JSON.stringify(parseInt(totalDuration / 60)));

                    trajectories[trajIndex].Path = combinedResults;


                    //Add route info to the list
                    //Would have liked to do this in D3js instead

                    var listDiv = document.getElementById("alg-list");

                    var listElementDiv = document.createElement("div");
                    listElementDiv.setAttribute("data-internalid", trajIndex);

                    //when user clicks on div showing rout characteristics
                    listElementDiv.addEventListener('click', function(event) {
                        var tindex = parseInt(this.getAttribute("data-internalid"));
                        displayRout(trajectories[tindex].Path, trajectories[tindex].POIs);
                    });

                    var listElement = document.createElementNS("https://www.w3.org/2000/svg", "svg");
                    listElement.setAttribute('height', 55);

                    var nameElement = document.createElementNS("https://www.w3.org/2000/svg", 'text');
                    //nameElement.setAttribute('height', 50);
                    nameElement.setAttribute('y', 18);
                    var textNode = document.createTextNode(trajectories[trajIndex].Name);
                    nameElement.appendChild(textNode);
                    listElement.appendChild(nameElement);

                    var distanceElement = document.createElementNS("https://www.w3.org/2000/svg", 'rect');
                    distanceElement.setAttribute('width', trajectories[trajIndex].Distance * 10); //This needs normalization
                    distanceElement.setAttribute('height', 15);
                    distanceElement.setAttribute('y', 20);
                    distanceElement.setAttribute('style', "fill:rgb(0,146,146);");
                    listElement.appendChild(distanceElement);

                    var distanceTextElement = document.createElementNS("https://www.w3.org/2000/svg", 'text');
                    //nameElement.setAttribute('height', 50);
                    distanceTextElement.setAttribute('x', trajectories[trajIndex].Distance * 10 + 2); //this needs normaization
                    distanceTextElement.setAttribute('y', 34);
                    var textNode2 = document.createTextNode(trajectories[trajIndex].Distance + 'km');
                    distanceTextElement.appendChild(textNode2);
                    listElement.appendChild(distanceTextElement);

                    var durationElement = document.createElementNS("https://www.w3.org/2000/svg", "rect");
                    durationElement.setAttribute('width', trajectories[trajIndex].Duration); //this needs normaization
                    durationElement.setAttribute('height', 15);
                    durationElement.setAttribute('y', 35);
                    durationElement.setAttribute('style', "fill:rgb(146,0,0);");
                    listElement.appendChild(durationElement);

                    var durationTextElement = document.createElementNS("https://www.w3.org/2000/svg", 'text');
                    //nameElement.setAttribute('height', 50);
                    durationTextElement.setAttribute('x', trajectories[trajIndex].Duration + 2); //this needs normaization
                    durationTextElement.setAttribute('y', 49);
                    var textNode3 = document.createTextNode(trajectories[trajIndex].Duration + 'min');
                    durationTextElement.appendChild(textNode3);
                    listElement.appendChild(durationTextElement);


                    listElementDiv.appendChild(listElement);
                    listDiv.appendChild(listElementDiv);


                }
            });

        })(k);

        return;
    }
}


function resetMarkers(poiArray) {
    //clear markers
    for (i = 0; i < markerArray.length; i++) {
        markerArray[i].setMap(null);
    }

    //find max PoiPopularity
    var maxPopularity = 0;
    for (var i = 0; i < poiArray.length; i++) {
        var tempp = grabPOI(poiArray[i]);
        if (tempp.poiPopularity > maxPopularity)
            maxPopularity = tempp.poiPopularity;
    }


    //if (showPOICategories) {
    for (var i = 0; i < poiArray.length; i++) {

        var tempPOI = grabPOI(poiArray[i]);

        var markerPosition = new google.maps.LatLng(parseFloat(tempPOI.poiLat),parseFloat(tempPOI.poiLon));

        var markerIcon;
        if (tempPOI.poiTheme == "Sports stadiums") {
            if (showPOIRatings) {
                var temps = makePOIMarkerFlag(1, [tempPOI.poiPopularity], maxPopularity, icons["sport"].icon);
                //console.log('data:image/svg+xml;charset=UTF-8,' + temps.node().outerHTML);
                markerIcon = 'data:image/svg+xml, ' + encodeURIComponent(temps.node().outerHTML);
            } else {
                markerIcon = icons["sport"].icon;
            }
        } else if (tempPOI.poiTheme == "Parks and spaces") {
            if (showPOIRatings) {
                var temps = makePOIMarkerFlag(1, [tempPOI.poiPopularity], maxPopularity, icons["park"].icon);
                markerIcon = 'data:image/svg+xml, ' + encodeURIComponent(temps.node().outerHTML);
            } else {
                markerIcon = icons["park"].icon;
            }
        } else if (tempPOI.poiTheme == "Transport") {
            if (showPOIRatings) {
                var temps = makePOIMarkerFlag(1, [tempPOI.poiPopularity], maxPopularity, icons["transport"].icon);
                markerIcon = 'data:image/svg+xml, ' + encodeURIComponent(temps.node().outerHTML);
            } else {
                markerIcon = icons["transport"].icon;
            }
        } else if (tempPOI.poiTheme == "City precincts") {
            if (showPOIRatings) {
                var temps = makePOIMarkerFlag(1, [tempPOI.poiPopularity], maxPopularity, icons["city"].icon);
                markerIcon = 'data:image/svg+xml, ' + encodeURIComponent(temps.node().outerHTML);
            } else {
                markerIcon = icons["city"].icon;
            }
        } else if (tempPOI.poiTheme == "Shopping") {
            if (showPOIRatings) {
                var temps = makePOIMarkerFlag(1, [tempPOI.poiPopularity], maxPopularity, icons["shopping"].icon);
                markerIcon = 'data:image/svg+xml, ' + encodeURIComponent(temps.node().outerHTML);
            } else {
                markerIcon = icons["shopping"].icon;
            }
        } else if (tempPOI.poiTheme == "Entertainment") {
            if (showPOIRatings) {
                var temps = makePOIMarkerFlag(1, [tempPOI.poiPopularity], maxPopularity, icons["entertainment"].icon);
                markerIcon = 'data:image/svg+xml, ' + encodeURIComponent(temps.node().outerHTML);
            } else {
                markerIcon = icons["entertainment"].icon;
            }
        } else if (tempPOI.poiTheme == "Public galleries") {
            if (showPOIRatings) {
                var temps = makePOIMarkerFlag(1, [tempPOI.poiPopularity], maxPopularity, icons["art"].icon);
                markerIcon = 'data:image/svg+xml, ' + encodeURIComponent(temps.node().outerHTML);
            } else {
                markerIcon = icons["art"].icon;
            }
        } else if (tempPOI.poiTheme == "Institutions") {
            if (showPOIRatings) {
                var temps = makePOIMarkerFlag(1, [tempPOI.poiPopularity], maxPopularity, icons["institution"].icon);
                markerIcon = 'data:image/svg+xml, ' + encodeURIComponent(temps.node().outerHTML);
            } else {
                markerIcon = icons["institution"].icon;
            }
        } else if (tempPOI.poiTheme == "Structures") {
            if (showPOIRatings) {
                var temps = makePOIMarkerFlag(1, [tempPOI.poiPopularity], maxPopularity, icons["structure"].icon);
                markerIcon = 'data:image/svg+xml, ' + encodeURIComponent(temps.node().outerHTML);
            } else {
                markerIcon = icons["structure"].icon;
            }
        } else {
            if (showPOIRatings) {
                var temps = makePOIMarkerFlag(1, [tempPOI.poiPopularity], maxPopularity, icons["info"].icon);
                markerIcon = 'data:image/svg+xml, ' + encodeURIComponent(temps.node().outerHTML);
            } else {
                markerIcon = icons["info"].icon;
            }
        }
        //console.log(markerIcon);
        var marker = new google.maps.Marker({
            position: markerPosition,
            map: gMapBase,
            icon: {
                anchor: new google.maps.Point(4, 12 + 39 - 4), //based on the pole position (locationPointRadius, shapeHeight + flagWidth - locationPointRadius)
                url: markerIcon
            }
        });

        //console.log(markerPosition);
        //console.log(parseFloat(tempPOI.poiLat));
        //var marker = new Marker({
        //    map: gMapBase,
        //    position: new google.maps.LatLng(parseFloat(tempPOI.poiLat),parseFloat(tempPOI.poiLon)),//markerPosition,
        //    icon: {
        //        path: SQUARE_PIN,
        //        fillColor: '#6331AE',
        //        fillOpacity: 1,
        //        strokeColor: '',
        //        strokeWeight: 0
        //    },
        //    map_icon_label: '<span class="map-icon map-icon-city-hall"></span>'
        //});


        attachInstructionText(marker, tempPOI);
        markerArray[i] = marker;
        //console.log(marker);
        markerArray[i].setMap(gMapBase);

    }
    //}

}

function displayRout(resultsToDisplay, poiA) {
    directionsDisplay.setDirections(resultsToDisplay);
    resetMarkers(poiA);
}

function handleClickPOICategory(cb) {
    if (cb.checked == true)
        showPOICategories = true;
    else {
        showPOICategories = false;
    }

    //update route
}

function handleClickPOIRating(cb) {
    if (cb.checked == true)
        showPOIRatings = true;
    else {
        showPOIRatings = false;
    }

    //update route
}

function clearAlgorithmList() {
    //document.getElementById("alg-panel").innerHTML="";

    var myChart = document.getElementById("alg-list");
    myChart.innerHTML = "";
}

function generateAlgorithmPanelLegend() {
    var chartLegend = document.getElementById('alg-legend-panel');
    chartLegend.innerHTML = "";

    chartLegend.setAttribute("style", "height:60px");

    var legendContents = document.createElementNS("https://www.w3.org/2000/svg", "svg");

    var distanceBox = document.createElementNS("https://www.w3.org/2000/svg", 'rect');
    distanceBox.setAttribute('width', 20);
    distanceBox.setAttribute('height', 15);
    distanceBox.setAttribute('y', 5);
    distanceBox.setAttribute('x', 0)
    distanceBox.setAttribute('style', "fill:rgb(0,146,146);");
    legendContents.appendChild(distanceBox);


    var nameElement = document.createElementNS("https://www.w3.org/2000/svg", 'text');
    //nameElement.setAttribute('height', 50);
    nameElement.setAttribute('y', 19);
    nameElement.setAttribute('x', 22)
    var textNode = document.createTextNode("Distance");
    nameElement.appendChild(textNode);
    legendContents.appendChild(nameElement);

    var distanceBox2 = document.createElementNS("https://www.w3.org/2000/svg", 'rect');
    distanceBox2.setAttribute('width', 20);
    distanceBox2.setAttribute('height', 15);
    distanceBox2.setAttribute('y', 27);
    distanceBox2.setAttribute('x', 0)
    distanceBox2.setAttribute('style', "fill:rgb(146,0,0);");
    legendContents.appendChild(distanceBox2);

    var nameElement2 = document.createElementNS("https://www.w3.org/2000/svg", 'text');
    //nameElement.setAttribute('height', 50);
    nameElement2.setAttribute('y', 40);
    nameElement2.setAttribute('x', 22)
    var textNode2 = document.createTextNode("Duration");
    nameElement2.appendChild(textNode2);
    legendContents.appendChild(nameElement2);

    chartLegend.appendChild(legendContents);
    //myChart.appendChild(chartLegend);

}

function test(data) {
    var div1 = d3.select('#alg-panel');
    //.append('div')
    //  .attr('width', 100)
    //  .attr('height', 240);
    div1.selectAll('svg')
        .data(data)
        .enter()
        .append('svg')
        .attr('height', 60);

    var myarray = div1.selectAll('svg')

    .append('rect')
        .attr('y', function(d, i) {
            return i * 22;
        })
        .attr('x', function(d) {
            return 5;
        }) //100 - d.Distance * 20; })
        .attr('height', 20)
        .attr('width', function(d, i) {
            return data[i].Distance * 20 + 10;
        })
        .attr('fill', d3.rgb(0, 146, 146));

    //myarray.enter()
    //.append('rect')
    //.attr('y', function(d, i) { return (i + 2) * 22 ; })
    //.attr('x', function(d) { return 5; })//100 - d.Distance * 20; })
    //.attr('height', 20)
    //.attr('width', function(d) { return d.Duration * 20; })
    //.attr('fill', d3.rgb(146,0,0));


}


//this would load POIs but have not been used in the code
function loadPOIs() {
    //read Melbourne POIs
    var poiFile = 'Data/poi-Melb-all.csv';

    var poiCount = 0;
    d3.csv(poiFile, function(data) {
        data.forEach(function(d) {
            var poiData = [];
            poiData["poiID"] = d.poiID;
            poiData["poiName"] = d.poiName;
            poiData["poiTheme"] = d.poiTheme;
            poiData["poiLat"] = d.poiLat;
            poiData["poiLon"] = d.poiLon;
            poiData["poiURL"] = d.poiURL;
            poiData["poiPopularity"] = d.poiPopularity;

            allMelbournePOIs[poiCount] = new Array(7);
            allMelbournePOIs[poiCount] = jQuery.extend(true, {}, poiData);
            poiCount++;
        });
    });
}


function grabPOI(poiID) {
    for (var i = 0; i < allMelbournePOIs.length; i++) {
        if (allMelbournePOIs[i].poiID == poiID) {
            return allMelbournePOIs[i];
        }
    }
}


function attachInstructionText(marker, poi) {

    var infoContentString = '<p>' +
        poi.poiName +
        '<p>Theme: ' + poi.poiTheme + '</p>' +
        '<p><a href="' + poi.poiURL + '"> on Wikipedia ...</a> ' + '</p>' +
        '<p>Popularity: ' + poi.poiPopularity + ' </p>' +
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
function arrayStringToArrayNumberConverter(str) {
    str = str.replace("[", "");
    str = str.replace("]", "");
    str = str.replace(",", "");

    var result = [];

    result = str.split(' ');

    for (var i = 0; i < result.length; i++)
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
