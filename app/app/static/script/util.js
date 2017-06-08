var map = undefined;
var fpoi = 'https://cdn.rawgit.com/cdawei/path_vis/master/data/poi-Melb-all.csv';
var colors = ["3f51b5", "f44336","ff9800","ffc107","cddc39","8bc34a","009688","e91e63","9c27b0","03a9f4"]
var selected_color = colors[0];
var default_color = "f0f0f0";
var gmap_icons = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld="
var route_drawn = undefined;

var DEFAULT_POI = get_custom_pin("", default_color);
function get_custom_pin(char, color) {
    return gmap_icons + char + '|' + color + '|000000';
}

function draw_map() {
    var latMelb = -37.815018
    var lngMelb = 144.975
    map = new GMaps({
        div: '#map',
        lat: latMelb,
        lng: lngMelb,
        zoom: 15
    });
    // properties of the Map object
    //for (var prop in map) {
    //    console.log('map property: ' + prop);
    //}
}

var allMarkers = [];
var selectedMarker = undefined;
function init_POIs() {
    if (map === undefined) {
        draw_map();
    }
    d3.csv(fpoi, function(data) {
        var pois = {};
        data.forEach(function(d) {
            pois[d.poiID] = {
                "name": d.poiName,
                "category": d.poiTheme,
                "lat": d.poiLat,
                "lng": d.poiLon,
                "url": d.poiURL,
                "popularity": d.poiPopularity
            };
        });
        for (var pid in pois) {
            var pi = pois[pid];
            var marker = {
                lat: pi["lat"],
                lng: pi["lng"],
                //title: pi["category"],
                poiID: pid,  //custom property
                // icon: gmap_icons + "yellow.png",
                icon: new google.maps.MarkerImage(
                    DEFAULT_POI, null, null, null,
                    new google.maps.Size(24, 38)
                ),
                infoWindow: {content: '<p>POI: &nbsp;' + pi["name"] + ',&nbsp;' + pi["category"] + ',&nbsp;' + pid + '</p>'},
                click: function(e) {
                    // set the start point
                    // this.icon.url = SELECTED_POI;
                    this.setIcon(new google.maps.MarkerImage(
                        get_custom_pin("", selected_color), null, null, null,
                        new google.maps.Size(24, 38)
                    ));
                    if (selectedMarker != undefined) {
                        selectedMarker.setIcon(new google.maps.MarkerImage(
                            DEFAULT_POI, null, null, null,
                            new google.maps.Size(24, 38)
                        ));
                    }
                    selectedMarker = this;

                    document.getElementById("ID_marker").innerHTML = "POI " + this.poiID + "<br/>" + pois[this.poiID]["name"];
                    document.getElementById("ID_start").value = this.poiID;
                    console.log('set the start point to ' + this.poiID);
                },
                mouseover: function() {
                    this.infoWindow.open(this.map, this);
                },
                mouseout: function() {
                    this.infoWindow.close();
                }
            }
            allMarkers[pid] = marker;
        }
    });
}

function draw_POIs() {
    map.removeMarkers();
    for (var i = 0; i < allMarkers.length; i++) {
        map.addMarker(allMarkers[i]);
    }
}

function clear_POIs() {
    if (allMarkers.length == 0) {
        init_POIs();
    } else {
        for (var i = 0; i < allMarkers.length; i++) {
            allMarkers[i].icon.url = DEFAULT_POI;
        }
    }
    draw_POIs();
}

function draw_route(traj, color, travel_mode="walking") {
    //travel_mode: driving, bicycling or walking
    if (map === undefined) {
        draw_map();
    }
    d3.csv(fpoi, function(data) {
        var pois = {};
        data.forEach(function(d) {
            pois[d.poiID] = {
                "name": d.poiName,
                "category": d.poiTheme,
                "lat": d.poiLat,
                "lng": d.poiLon,
                "url": d.poiURL,
                "popularity": d.poiPopularity
            };
        });
        var waypts = []; //way points
        for (var i = 1; i < traj.length-1; i++) {
            pi = pois[ traj[i] ];
            waypts.push({
                location: new google.maps.LatLng(pi["lat"], pi["lng"]),
                stopover: true
            });
        }
        ps = pois[ traj[0] ];
        pt = pois[ traj[traj.length-1] ];

        // set POI colors on the route
        allMarkers[traj[0]].icon.url = get_custom_pin("S", selected_color);
        for (var i = 1; i <  traj.length; i++) {
            console.log('change marker color: ' + i);
            allMarkers[traj[i]].icon.url = get_custom_pin(i.toString(), colors[i]);
        }
        draw_POIs();

        map.drawRoute({
            origin: [ ps["lat"], ps["lng"] ],
            destination: [ pt["lat"], pt["lng"] ],
            waypoints: waypts,
            optimizeWaypoints: false, //do NOT allow way points to be reordered
            //optimizeWaypoints: true, //allow way points to be reordered: might be better visually.
            travelMode: travel_mode,
            strokeColor: color, //RRGGBB, e.g. '#1F5566', '#131540'
            strokeOpacity: 0.6,
            strokeWeight: 6,
            fillColor: "#0000FF",
            fillOpacity: 0.4
        });
    });
    console.log('trajectory: ' + traj);
    //console.log(travel);
}


function parse_draw(response) {
    var trajdata = JSON.parse(response);
    console.log(trajdata);
    var trajs = [trajdata[0]['Trajectory']];
    //trajs = response.split(";");
    //console.log(trajs);
    //console.log(trajs.length);
    init_POIs();
    for (var i = 0; i < trajs.length; i++) {
        /*
        var trajstr = trajs[i].split(",");
        var traj = [];
        for (var j = 0; j < trajstr.length; j++) {
            traj.push(parseInt(trajstr[j]));
        }
        */
        traj = trajs[i];
        //console.log(traj);
        color = '#' + colors[i]
        travel = document.getElementById("ID_select").value;
        draw_route(traj, color, travel);
    }
}


function visualise_score(response) {
    var trajdata = JSON.parse(response);
    // console.log(trajdata);
    var arr = [];
    var npois = 0;
    var ntrans = 0;
    var poi_score_max = 0;
    var tran_score_max = 0;
    if (route_drawn == undefined) {
        route_drawn = [];
    }
    for (var i = 0; i < trajdata.length; i++) {
        var row = {
            //'name': 'Top' + (i+1).toString(),
            'index': i,
            'total_score': trajdata[i]['TotalScore'],
        };
        var poi_scores = trajdata[i]['POIScore'];
        var tran_scores = trajdata[i]['TransitionScore'];
        if (npois == 0) {
            npois = poi_scores.length;
        }
        if (ntrans == 0) {
            ntrans = tran_scores.length;
        }
        for (var j = 0; j < poi_scores.length; j++) {
            var key = 'p' + j.toString();
            row[key] = poi_scores[j];
        }
        for (var j = 0; j < tran_scores.length; j++) {
            var key = 't' + j.toString();
            row[key] = tran_scores[j];
        }
        arr.push(row);
        route_drawn.push(false);
    }
    var desc = [
        //{label: 'Recommendation', type: 'string', column: 'name'},
        //{label: 'Total Score', type: 'string', column: 'total_score'}, //plain numbers (as strings)
        {label: 'Index', type: 'number', column: 'index', 'domain': [0, trajdata.length-1]},
        {label: 'Total Score', type: 'number', column: 'total_score', 'domain': [0, 100]}, //domain is required if type=number
    ];
    for (var j = 0; j < npois; j++) {
        desc.push({
            //label: 'SCORE_' + j.toString(),
            type: 'number',
            column: 'p' + j.toString(),
            'domain': [0, 20],
            color: '#' + colors[j]});
    }
    for (var j = 0; j < ntrans; j++) {
        desc.push({
            //label: 'Transition_' + j.toString(),
            type: 'number',
            column: 't' + j.toString(),
            'domain': [0, 20],
            color: '#' + colors[colors.length-j-1]});
    }

    /*
    const arr = [
      {a: 8, b: 20, c: 30, d: 'Top1_Name', e: false, l: {alt: 'Google', href: 'https://google.com'}, cat: 'c2'},
      {a: 5, b: 10, c: 2, d: 'Top2_Name', e: true, l: {alt: 'ORF', href: 'https://orf.at'}, cat: 'c3'},
      {a: 10, b: 30, c: 100, d: 'Top3_Name', e: false, l: {alt: 'heise.de', href: 'https://heise.de'}, cat: 'c2'},];
    const desc = [
      {label: 'D', type: 'string', column: 'd', cssClass: 'orange'},
      {label: 'A', type: 'number', column: 'a', 'domain': [0, 10], cssClass: 'green', color: 'green'},
      {label: 'B', type: 'number', column: 'b', 'domain': [0, 30], cssClass: 'red', color: 'red'},
    ]; */

    const p = new LineUpJS.provider.LocalDataProvider(arr, desc);
    {
        const r = p.pushRanking();
        //r.insert(p.create(LineUpJS.model.createSelectionDesc()), 0);  //selection column
        //r.push(p.create(desc[0]));  //name column
        //r.push(p.create(desc[1]));  //trajectory total score column
        var sel = p.create(LineUpJS.model.createSelectionDesc());  //selection column
        //console.log(sel);
        //console.log(sel.listeners.select);
        sel.listeners.select = function () {
            clear_POIs();
            remove_chart();
            idx = this.args[0]['index'];
            flag = this.args[1];
            travel = document.getElementById("ID_select").value;
            if (flag == true) {
                route_drawn[idx] = true;
                draw_route(trajdata[idx]['Trajectory'], '#' + colors[idx], travel);
                // send data to radarChart
                draw_chart(idx, trajdata);
            } else {
                route_drawn[idx] = false;
                map.cleanRoute();
                for (var j = 0; j < route_drawn.length; j++) {
                    if (route_drawn[j] == true) {
                        draw_route(trajdata[j]['Trajectory'], '#' + colors[j], travel);
                        draw_chart(j, trajdata);
                    }
                }
            }
            console.log(this);
        }
        r.insert(sel, 0);
        var col = p.create(desc[1]);
        col.compressed = true;
        //col.collapsed = true;
        r.push(col);

        //poi scores stack
        r.push((function () {
            const rstack = p.create(LineUpJS.model.createStackDesc('POI Scores'));
            for (var j = 1; j < npois; j++) { //ignore the first POI
                rstack.push(p.create(desc[2+j]));
            }
            //rstack.setWeights([0.2, 0.8]);
            //rstack.compressed = true;
            rstack.collapsed = true;
            return rstack;
        })());

        //transition scores stack
        r.push((function () {
            const rstack = p.create(LineUpJS.model.createStackDesc('Transition Scores'));
            for (var j = 0; j < ntrans; j++) {
                rstack.push(p.create(desc[2+npois+j]));
            }
            rstack.compressed = true;
            rstack.collapsed = true;
            return rstack;
        })());

        var element = document.getElementById("bars");
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }

        const instance = LineUpJS.create(p, document.getElementById("bars"), {
            renderingOptions: {
                animation: false,
                histograms: false,
                meanLine: false
            }
        });
        instance.update(); //comment this to hide table header
    }

    // draw top1 route by default
    p.select(0);
    route_drawn[0] = true;
    draw_route(trajdata[0]['Trajectory'], '#' + colors[0]);
    draw_chart(0, trajdata);

}
