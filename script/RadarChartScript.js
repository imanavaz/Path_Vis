var w = 300, h = 300;

var colorscale = d3.scale.category10();

//Legend titles
var LegendOptions = ['Queen Victoria Market','Melbourne Aquarium'];

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

//Options for the Radar chart, other than default
var mycfg = {
  w: w,
  h: h,
  maxValue: 0.8,
  levels: 6,
  ExtraWidthX: 100
}

//Call function to draw the Radar chart
//Will expect that data is in %'s
RadarChart.draw("#chart", d, mycfg);

////////////////////////////////////////////
/////////// Initiate legend ////////////////
////////////////////////////////////////////

var svg = d3.select('#body')
	.selectAll('svg')
	.append('svg')
	.attr("width", w+300)
	.attr("height", h)

//Create the title for the legend
var text = svg.append("text")
	.attr("class", "title")
	.attr('transform', 'translate(90,0)')
	.attr("x", w - 70)
	.attr("y", 10)
	.attr("font-size", "12px")
	.attr("fill", "#404040")

//Initiate Legend
var legend = svg.append("g")
	.attr("class", "legend")
	.attr("height", 100)
	.attr("width", 200)
	.attr('transform', 'translate(90,20)')
	;
	//Create colour squares
	legend.selectAll('rect')
	  .data(LegendOptions)
	  .enter()
	  .append("rect")
	  .attr("x", w - 125)
	  .attr("y", function(d, i){ return i * 20;})
	  .attr("width", 10)
	  .attr("height", 10)
	  .style("fill", function(d, i){ return colorscale(i);})
	  ;
	//Create text next to squares
	legend.selectAll('text')
	  .data(LegendOptions)
	  .enter()
	  .append("text")
	  .attr("x", w - 112)
	  .attr("y", function(d, i){ return i * 20 + 9;})
	  .attr("font-size", "11px")
	  .attr("fill", "#737373")
	  .text(function(d) { return d; })
	  ;
