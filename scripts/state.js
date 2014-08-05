/* globals jQuery, d3, document, config */
"use strict";

var graph = {
        nodes : [],
        links : []
    },
    visited = {};

function constructGraph (config) {
    var tempConfig,
        stateTree,
        stateActions,
        action,
        comboState = "",
        possibleEffects = [],
        effect;
    
    for (stateTree in config) {
        if (config.hasOwnProperty(stateTree)) {
            comboState += config[stateTree].currentState + "_";
            stateActions = config[stateTree].states[config[stateTree].currentState].actions;
            
            for (action in stateActions) {
                if (stateActions.hasOwnProperty(action)) {
                    possibleEffects.push(stateActions[action].effects);
                }
            }
        }
    }
    if (visited.hasOwnProperty(comboState) === false) {
        visited[comboState] = graph.nodes.length;
        graph.nodes.push({
                combo : comboState,
                group : 10
            });  // TODO: compose preview of image layers?
        
        for (effect = 0; effect < possibleEffects.length; effect += 1) {
            tempConfig = jQuery.extend(true, {}, config);    // deep clone; this allows effect functions to do anything they want to the config object
            possibleEffects[effect](tempConfig);
            graph.links.push({
                    source : visited[comboState],
                    target : visited[constructGraph(tempConfig)]
                });
        }
    }
    
    return comboState;
}

constructGraph(config);

// Display the graph:

// Set up svg element
var svg = d3.select("svg.graph"),
    width = Number(svg.attr("width")),
    height = Number(svg.attr("height"));

// Add the arrow template
svg.append("svg:defs").selectAll("marker")
    .data(["end"])      // Different link/path types can be defined here
    .enter().append("svg:marker")    // This section adds in the arrows
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

// Start the layout algorithm
var force = d3.layout.force()
    .charge(-480)
    .linkDistance(120)
    .size([width, height])
    .nodes(graph.nodes)
    .links(graph.links)
    .start();

// Add the links and arrows
var path = svg.append("svg:g").selectAll("path")
    .data(force.links())
    .enter().append("svg:path")
    .attr("class", "link")
    .attr("marker-end", "url(#end)");

// Node hover helper function
function hoverNode (d) {
    var container = document.getElementById('label');
    container.innerHTML = d.combo;
    // TODO: display the images instead
}

// Add the nodes
var node = svg.selectAll(".node")
    .data(graph.nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", 5)
    .on('mouseover', hoverNode)
    .call(force.drag);

// Update with the algorithm
force.on("tick",
    function () {
        path.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + 
                d.source.x + "," + 
                d.source.y + "A" + 
                dr + "," + dr + " 0 0,1 " + 
                d.target.x + "," + 
                d.target.y;
        });
    
        node.attr("transform", function(d) { 
            return "translate(" + d.x + "," + d.y + ")";
        });
});