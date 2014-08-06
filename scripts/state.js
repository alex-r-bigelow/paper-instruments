/* globals jQuery, d3, document, config */
"use strict";

// Create a graph, exploring all possible interaction pathways:

var graph = {
        nodes : [],
        links : []
    },
    visited = {};

function constructGraph (config) {
    var tempConfig,
        stateTree,
        stateString,
        comboString = "",
        currentStateStrings = {},
        currentStates = {},
        actions,
        actionString,
        events,
        eventString,
        targetComboString;
    
    for (stateTree in config) {
        if (config.hasOwnProperty(stateTree)) {
            stateString = config[stateTree].currentState;
            currentStateStrings[stateTree] = stateString;
            currentStates[stateTree] = config[stateTree].states[stateString];
            comboString += stateString;
        }
    }
    if (visited.hasOwnProperty(comboString) === false) {
        visited[comboString] = graph.nodes.length;
        
        graph.nodes.push({
                comboString : comboString,
                states : currentStates,
                stateStrings : currentStateStrings
            });
        
        for (stateTree in currentStates) {
            if (currentStates.hasOwnProperty(stateTree)) {
                actions = currentStates[stateTree].actions;
                for (actionString in actions) {
                    if (actions.hasOwnProperty(actionString)) {
                        // Don't permute if the hotSpot isn't even visible
                        if (actions[actionString].hotSpot.isVisible(config) === true) {
                            events = actions[actionString].events;
                            for (eventString in events) {
                                if (events.hasOwnProperty(eventString)) {
                                    // deep clone config; this allows effect functions
                                    // to do anything they want to the config object
                                    tempConfig = jQuery.extend(true, {}, config);
                                    
                                    // apply the event to our clone (with a null event object)
                                    events[eventString](null, tempConfig);
                                    
                                    // recurse
                                    targetComboString = constructGraph(tempConfig);
                                    
                                    // add links to the new nodes; don't create self-edges
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
                }
            }
        }
    }
    
    return comboString;
}

constructGraph(config);

// Show the interface:

function updatePreview() {
    var comboString = "",
        images = [],
        hotSpots = [],
        stateTree;
    
    for (stateTree in config) {
        if (config.hasOwnProperty(stateTree)) {
            images.push(config[stateTree].states[config[stateTree].currentState].image);
            comboString += config[stateTree].currentState;
        }
    }
    
    document.getElementById("previewImages").innerHTML = "";
    
    var preview = d3.select('#previewImages');

    var i = preview.selectAll("img")
        .data(images);
    
    i.enter().append("img")
        .attr("src", function (i) {
                if (i.src !== '') {
                    return 'data/' + i.src;
                } else {
                    return '';
                }
            })
        .attr("z-index", function (i) { return i.zIndex; });
    
    i.exit().remove();
    
    return comboString;
}
var currentComboString = updatePreview();


// Visualize the graph:

// Helper functions
function clickNode (d) {
    var stateTree;
    for (stateTree in d.stateStrings) {
        if (d.stateStrings.hasOwnProperty(stateTree)) {
            config[stateTree].currentState = d.stateStrings[stateTree];
        }
    }
    document.getElementById(currentComboString).setAttribute("class", "node");
    currentComboString = updatePreview();
    document.getElementById(currentComboString).setAttribute("class", "active node");
}

function initGraph() {
    // Set up the graph svg element
    var template = document.getElementById("graphTemplate"),
        width = Number(template.getAttribute("width")),
        height = Number(template.getAttribute("height")),
        style = template.getAttribute("style"),
        svg = d3.select("body").selectAll("svg.graph")
            .data(["graph"])    // only make one view...
            .enter().append("svg")
            .attr("id", function (d) { return d; })
            .attr("class", "graph")
            .attr("width", width)
            .attr("height", height)
            .attr("style", style);
    
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
    
    // Add the nodes
    var node = svg.selectAll(".node")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("id", function (d) { return d.comboString; })
        .attr("class", function (d) {
            if (d.comboString === currentComboString) {
                return "active node";
            } else {
                return "node";
            }
        })
        .attr("r", 5)
        .on('dblclick', clickNode)
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
}
initGraph();
