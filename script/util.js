var map = undefined;
var fpoi = 'https://cdn.rawgit.com/cdawei/path_vis/master/data/poi-Melb-all.csv';
const COLORS = ['black', 'green', 'purple', 'lime', 'red', 'silver', 'blue', 'gray', 'navy', 'olive', 'white', 'yellow', 'maroon', 'teal', 'fuchsia', 'aqua'];

function draw_map() {
    var latMelb = -37.815018
    var lngMelb = 144.97
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


function draw_POIs() {
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
            var pi = pois[pid]
            map.addMarker({
                lat: pi["lat"],
                lng: pi["lng"],
                //title: pi["category"],
                poiID: pid,  //custom property
                infoWindow: {content: '<p>POI: &nbsp;' + pi["name"] + ',&nbsp;' + pi["category"] + ',&nbsp;' + pid + '</p>'},
                click: function(e) {
                    // set the start point
                    document.getElementById("ID_marker").innerHTML = "<font color=\"red\">" + this.poiID + "</font>";
                    document.getElementById("ID_start").value = this.poiID;
                    console.log('set the start point to ' + this.poiID);
                },
                mouseover: function() {
                    this.infoWindow.open(this.map, this);
                },
                mouseout: function() {
                    this.infoWindow.close();
                }
            });
        }
    });
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
        map.drawRoute({
            origin: [ ps["lat"], ps["lng"] ],
            destination: [ pt["lat"], pt["lng"] ],
            waypoints: waypts,
            optimizeWaypoints: false, //do NOT allow way points to be reordered
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
    var trajs = [trajdata[0]['Trajectory'], trajdata[1]['Trajectory']];
    //trajs = response.split(";");
    //console.log(trajs);
    //console.log(trajs.length);
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
        color = "#" + (Math.random()*0xFFFFFF<<0).toString(16); //random color
        travel = document.getElementById("ID_select").value;
        draw_route(traj, color, travel);

    }
}


function visualise_score(response) {
    var trajdata = JSON.parse(response);
    var arr = [];
    var ncols = 0;
    for (var i = 0; i < trajdata.length; i++) {
        var rowdata = trajdata[i]['POIScore'];
        var row = {'name': 'Top' + (i+1).toString()};
        ncols = rowdata.length;
        for (var j = 1; j < ncols; j++) {
            //var key = 'score_' + j.toString();
            var key = 's' + j.toString();
            row[key] = rowdata[j];
        }
        arr.push(row);
    }
    var desc = [];
    desc.push({label: 'Recommendation', type: 'string', column: 'name'});
    for (var j = 1; j < ncols; j++) {
        desc.push({
            //label: 'SCORE_' + j.toString(),
            type: 'number',
            //column: 'score_' + j.toString(),
            column: 's' + j.toString(),
            'domain': [0, 20],
            color: COLORS[j]});
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
      r.insert(p.create(LineUpJS.model.createSelectionDesc()), 0);
      r.push(p.create(desc[0]));

      r.push((function () {
        const rstack = p.create(LineUpJS.model.createStackDesc('Stack'));
        for (var j = 1; j < desc.length; j++) {
            rstack.push(p.create(desc[j]));
        }
        //rstack.setWeights([0.2, 0.8]);
        return rstack;
      })());
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
