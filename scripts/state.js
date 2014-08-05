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
        state,
        stateActions,
        action,
        comboString = "",
        states = {},
        possibleEvents = [],
        events,
        event,
        targetComboString;
    
    for (stateTree in config) {
        if (config.hasOwnProperty(stateTree)) {
            comboString += config[stateTree].currentState;
            
            state = config[stateTree].states[config[stateTree].currentState];
            states[stateTree] = config[stateTree].currentState;
            
            for (action in state.actions) {
                if (state.actions.hasOwnProperty(action)) {
                    possibleEvents.push(state.actions[action].events);
                }
            }
        }
    }
    if (visited.hasOwnProperty(comboString) === false) {
        visited[comboString] = graph.nodes.length;
        
        
        graph.nodes.push({
                comboString : comboString,
                states : states
            });  // TODO: compose preview of image layers?
        
        for (events = 0; events < possibleEvents.length; events += 1) {
            for (event in possibleEvents[events]) {
                if (possibleEvents[events].hasOwnProperty(event)) {
                    tempConfig = jQuery.extend(true, {}, config);    // deep clone; this allows effect functions to do anything they want to the config object
                    possibleEvents[events][event](null, tempConfig);
                    targetComboString = constructGraph(tempConfig);
                    if (targetComboString !== comboString) {
                        graph.links.push({
                            source : visited[comboString],
                            target : visited[targetComboString]
                        });
                    }
                }
            }
        }
    }
    
    return comboString;
}

constructGraph(config);

// Set up the preview:

function updatePreview() {
    var currentComboString = "",
        images = [],
        stateTree;
    
    for (stateTree in config) {
        if (config.hasOwnProperty(stateTree)) {
            images.push(config[stateTree].states[config[stateTree].currentState].image);
        }
    }
    
    document.getElementById("previewImages").innerHTML = "";
    
    var preview = d3.select('#previewImages');

    var i = preview.selectAll("img")
        .data(images);
    
    i.enter().append("img")
        .attr("src", function (i) { return 'data/' + i.src; })
        .attr("z-index", function (i) { return i.zIndex; });
    
    i.exit().remove();
}
updatePreview();


// Display the graph:

// Set up the graph svg element
var svg = d3.select("svg#graph"),
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
function clickNode (d) {
    var tree;
    for (tree in d.states) {
        if (d.states.hasOwnProperty(tree)) {
            config[tree].currentState = d.states[tree];
        }
    }
    updatePreview();
}

// Add the nodes
var node = svg.selectAll(".node")
    .data(graph.nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", 5)
    .on('mousedown', clickNode)
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