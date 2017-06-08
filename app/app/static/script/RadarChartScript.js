var w = 300, h = 300;

//Data
var d = [
			  [
						{axis:"City precincts",value:0.59},
						{axis:"Shopping",value:0.81},
						{axis:"Entertainment",value:0.42},
						{axis:"Public galleries",value:0.34},
						{axis:"Institutions",value:0.48},
						{axis:"Structures",value:0.14},
						{axis:"Sports stadiums",value:0.11},
						{axis:"Parks and spaces",value:0.05},
						{axis:"Transport",value:0.07},
			  ],[
						{axis:"City precincts",value:0.27},
						{axis:"Shopping",value:0.41},
						{axis:"Entertainment",value:0.77},
						{axis:"Public galleries",value:0.28},
						{axis:"Institutions",value:0.16},
						{axis:"Structures",value:0.29},
						{axis:"Sports stadiums",value:0.11},
						{axis:"Parks and spaces",value:0.14},
						{axis:"Transport",value:0.55},
			  ]
		];

var labels = ["City precincts", "Shopping", "Entertainment", "Public galleries",
		"Institutions", "Structures", "Sports stadiums", "Parks and spaces", "Transport"];

function draw_chart(ind, trajdata) {
		data = [];
		legends = [];
		for (var k = 0; k < trajdata[ind]['POIPerFeatureScore'].length; k++) {
				entry = [];
				for (var j = 0; j < labels.length; j++) {
						entry.push({ axis:labels[j], value:trajdata[ind]['POIPerFeatureScore'][k][j]+5 });
				}
				console.log(entry);
				legends.push('p'+k.toString());
				data.push(entry);
		}
		// console.log(data);
		//Call function to draw the Radar chart
		//Will expect that data is in %'s
		RadarChart.draw("#chart", data, mycfg, legends);
}

function remove_chart() {
		d3.select("#chart").select("svg").remove();
}

//Options for the Radar chart, other than default
var mycfg = {
	  w: w,
	  h: h,
	  maxValue: 10,
	  levels: 5,
	  ExtraWidthX: 200
}
