/* globals jQuery, d3, document, config, metaActions, currentComboString, updatePreview, hideHotSpots */
"use strict";

// Create a graph, exploring all possible interaction pathways:

var graph = {
        nodes : [],
        links : []
    },
    linkLookup = {},
    visited = {},
    metaSeeds = {};

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
        targetComboString,
        meta,
        entity,
        i;
    
    // Extract the starting states
    for (stateTree in config) {
        if (config.hasOwnProperty(stateTree)) {
            stateString = config[stateTree].currentState;
            currentStateStrings[stateTree] = stateString;
            currentStates[stateTree] = config[stateTree].states[stateString];
            comboString += stateString;
        }
    }
    // If we haven't been in this exact state before...
    if (visited.hasOwnProperty(comboString) === false) {
        visited[comboString] = graph.nodes.length;
        
        // ... add the graph node
        graph.nodes.push({
                comboString : comboString,
                states : currentStates,
                stateStrings : currentStateStrings
            });
        
        // ... recurse for all the possible next states
        for (stateTree in currentStates) {
            if (currentStates.hasOwnProperty(stateTree)) {
                actions = currentStates[stateTree].actions;
                for (actionString in actions) {
                    if (actions.hasOwnProperty(actionString)) {
                        // Don't follow actions if their hotSpots aren't even visible
                        if (actions[actionString].hotSpot.isVisible(config) === true) {
                            // Are we potentially starting a meta action?
                            for (entity in metaActions) {
                                if (metaActions.hasOwnProperty(entity)) {
                                    for (meta in metaActions[entity]) {
                                        if (metaActions[entity].hasOwnProperty(meta)) {
                                            for (i = 0; i < metaActions[entity][meta].length; i += 1) {
                                                if (stateTree === metaActions[entity][meta][i][0].stateTree &&
                                                        config[stateTree].currentState === metaActions[entity][meta][i][0].state &&
                                                        actionString === metaActions[entity][meta][i][0].action) {
                                                    if (metaSeeds.hasOwnProperty(entity) === false) {
                                                        metaSeeds[entity] = {};
                                                    }
                                                    if (metaSeeds[entity].hasOwnProperty(meta) === false) {
                                                        metaSeeds[entity][meta] = [];
                                                    }
                                                    metaSeeds[entity][meta].push(config);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            
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
                                    
                                    // don't create self-edges in the graph
                                    if (targetComboString !== comboString) {
                                        // add the links to the new nodes
                                        graph.links.push({
                                            source : visited[comboString],
                                            target : visited[targetComboString],
                                            metaActions : []
                                        });
                                        linkLookup[comboString + "->" + targetComboString] = graph.links[graph.links.length - 1];
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

// Flag the links that are part of a metaAction
function flagMetas() {
    var meta,
        entity,
        tempConfig,
        i,
        j,
        k,
        source,
        target,
        success,
        linksToFlag,
        stateTree,
        state,
        action,
        temp;
    // loop through potential starting locations
    for (entity in metaSeeds){
        if (metaSeeds.hasOwnProperty(entity)) {
            for (meta in metaSeeds[entity]) {
                if (metaSeeds[entity].hasOwnProperty(meta)) {
                    for (i = 0; i < metaSeeds[entity][meta].length; i += 1) {
                        linksToFlag = [];
                        success = true;
                        tempConfig = metaSeeds[entity][meta][i];
                        // loop through the potential steps TODO: may be a bug here if there's more than one sequence...
                        for (j = 0; j < metaActions[entity][meta].length; j += 1) {
                            for (k = 0; k < metaActions[entity][meta][j].length; k += 1) {
                                state = tempConfig[metaActions[entity][meta][j][k].stateTree].currentState;
                                
                                // It's possible that we're not even in the right state to perform
                                // this step...
                                if (state !== metaActions[entity][meta][j][k].state) {
                                    success = false;
                                    break;
                                }
                                
                                action = tempConfig[metaActions[entity][meta][j][k].stateTree].states[state].actions[metaActions[entity][meta][j][k].action];
                                
                                // if we can't see the hotSpot, the chain is broken;
                                // there's no way to perform the next action in the meta action
                                if (action.hotSpot.isVisible(tempConfig) === false) {
                                    success = false;
                                    break;
                                } else {
                                    // Get the source combo string
                                    source = "";
                                    for (stateTree in tempConfig) {
                                        if (tempConfig.hasOwnProperty(stateTree)) {
                                            source += tempConfig[stateTree].currentState;
                                        }
                                    }
                                    // Apply an event (just pick one - they SHOULD have the same
                                    // side effects)
                                    for (temp in action.events) {
                                        if (action.events.hasOwnProperty(temp)) {
                                            action.events[temp](null, tempConfig);
                                            break;
                                        }
                                    }
                                    // Get the target combo string
                                    target = "";
                                    for (stateTree in tempConfig) {
                                        if (tempConfig.hasOwnProperty(stateTree)) {
                                            target += tempConfig[stateTree].currentState;
                                        }
                                    }
                                    if (target !== source) {
                                        linksToFlag.push(source + "->" + target);
                                    }
                                }
                            }
                        }
                        if (success === true) {
                            // Mark all the relevant links that they belong
                            // to the meta action
                            for (j = 0; j < linksToFlag.length; j += 1) {
                                temp = linkLookup[linksToFlag[j]].metaActions;
                                if (temp.indexOf(meta) === -1) {
                                    temp.push(meta);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// Show the interface:

function updateAll() {
    var images = [],
        actions = [],
        stateTree,
        state,
        action,
        temp;
    
    // First, remove the previous graph highlight
    temp = document.getElementById(currentComboString);
    if (temp !== null) {
        temp.setAttribute("class", "node");
    }
    
    updatePreview(updateAll);
    
    // Highlight the relevant node in the graph
    temp = document.getElementById(currentComboString);
    if (temp !== null) {
        temp.setAttribute("class", "active node");
    }
}

// Visualize the graph:

// Helper functions
function clickNode (d) {
    var stateTree;
    for (stateTree in d.stateStrings) {
        if (d.stateStrings.hasOwnProperty(stateTree)) {
            config[stateTree].currentState = d.stateStrings[stateTree];
        }
    }
    
    updateAll();
}

function initGraph() {
    // Set up the graph svg element
    var bounds = document.getElementById("configContents").getBoundingClientRect(),
        width,
        height,
        style,
        svg;
    
    if (bounds.width === 0) {
        return;
    }
    
    // I'm guessing with current styling, etc, we need 50px per node?
    width = graph.nodes.length * 50;
    height = graph.nodes.length * 50;
    svg = d3.select("#graphContainer")
        .selectAll("svg.graph")
        .data(["graph"])
        .enter().append("svg")
        .attr("id", function (d) { return d; })
        .attr("class", "graph")
        .attr("width", width)
        .attr("height", height);
    
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
        .attr("class", function (d) {
            var result = "link";
            if (d.metaActions.length > 0) {
                result += " " + d.metaActions.join(" ");
            }
            return result;
        })
        .attr("marker-end", "url(#end)");
    
    // Add the nodes
    var node = svg.selectAll(".node")
        .data(graph.nodes);
    
    node.enter().append("circle")
        .attr("id", function (d) { return d.comboString; })
        .attr("r", 5)
        .on('dblclick', clickNode)
        .call(force.drag);
    
    node.attr("class", function (d) {
        if (d.comboString === currentComboString) {
            return "active node";
        } else {
            return "node";
        }
    });
    
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

// Visualize the process matrix:

function initMatrix() {
    // TODO: create the data by traversing the graph;
    // here I'm just putting it in manually for
    // a proof-of-concept
    var matrix;
}

hideHotSpots();
constructGraph(jQuery.extend(true, {}, config));
flagMetas();
updateAll();
initGraph();
initMatrix();

// Handle collapsing / expanding the config panel
jQuery("#collapseBar").on("click", function (event) {
    var panel = jQuery("#configPanel"),
        collapsed = panel.attr('class');
    if (typeof collapsed !== typeof undefined && collapsed !== false) {
        panel.removeAttr('class');
        jQuery("#collapseBar img").attr("src", "images/collapse.png");
    } else {
        panel.attr("class", "collapsed");
        jQuery("#collapseBar img").attr("src", "images/expand.png");
    }
    initGraph();
    initMatrix();
});