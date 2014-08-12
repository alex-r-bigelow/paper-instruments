/* globals jQuery, d3, document, config, metaActions */
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
        meta;
    
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
                            for (meta in metaActions) {
                                if (metaActions.hasOwnProperty(meta)) {
                                    if (stateTree === metaActions[meta][0].stateTree &&
                                            config[stateTree].currentState === metaActions[meta][0].state &&
                                            actionString === metaActions[meta][0].action) {
                                        if (metaSeeds.hasOwnProperty(meta) === false) {
                                            metaSeeds[meta] = [];
                                        }
                                        metaSeeds[meta].push(config);
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
constructGraph(jQuery.extend(true, {}, config));

// Flag the links that are part of a metaAction
function flagMetas() {
    var meta,
        tempConfig,
        i,
        j,
        source,
        target,
        success,
        linksToFlag,
        stateTree,
        state,
        action,
        temp;
    // loop through potential starting locations
    for (meta in metaSeeds) {
        if (metaSeeds.hasOwnProperty(meta)) {
            for (j = 0; j < metaSeeds[meta].length; j += 1) {
                linksToFlag = [];
                success = true;
                tempConfig = metaSeeds[meta][j];
                // loop through the meta action's list of actions
                for (i = 0; i < metaActions[meta].length; i += 1) {
                    state = tempConfig[metaActions[meta][i].stateTree].currentState;
                    
                    // It's possible that we're not even in the right state to perform
                    // this step...
                    if (state !== metaActions[meta][i].state) {
                        success = false;
                        break;
                    }
                    
                    action = tempConfig[metaActions[meta][i].stateTree].states[state].actions[metaActions[meta][i].action];
                    
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
                if (success === true) {
                    // Mark all the relevant links that they belong
                    // to the meta action
                    for (i = 0; i < linksToFlag.length; i += 1) {
                        temp = linkLookup[linksToFlag[i]].metaActions;
                        if (temp.indexOf(meta) === -1) {
                            temp.push(meta);
                        }
                    }
                }
            }
        }
    }
}
flagMetas();

// Show the interface:

var currentComboString = null;

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
    
    // Now figure out the new currentComboString while collecting the relevant images and actions
    currentComboString = "";
    for (stateTree in config) {
        if (config.hasOwnProperty(stateTree)) {
            currentComboString += config[stateTree].currentState;
            
            state = config[stateTree].states[config[stateTree].currentState];
            images.push(state.image);
            for (action in state.actions) {
                if (state.actions.hasOwnProperty(action)) {
                    if (state.actions[action].hotSpot.isVisible(config) === true) {
                        actions.push(state.actions[action]);
                    }
                }
            }
        }
    }
    
    // Because SVG uses document order instead of z-index, we need to sort the actions
    actions.sort(function (a, b) {
        return a.hotSpot.zIndex - b.hotSpot.zIndex;
    });
    
    // Highlight the relevant node in the graph
    temp = document.getElementById(currentComboString);
    if (temp !== null) {
        temp.setAttribute("class", "active node");
    }
    
    // Update the preview images
    var previewImages = d3.select('#previewImages')
        .selectAll("img")
        .data(images);
    
    previewImages.enter().append("img");
    
    previewImages.attr("src", function (i) {
                if (i.src !== '') {
                    return 'data/' + i.src;
                } else {
                    return '';
                }
            })
        .attr("style", function (i) { return "z-index:"+i.zIndex; });
    
    // Update the hotSpots
    
    // I think d3 is reusing DOM elements with jQuery events
    // still attached, so I manually clear the hotspots first:
    document.getElementById("hotSpots").innerHTML = "";
    
    var previewHotSpots = d3.select("#hotSpots")
        .selectAll("path")
        .data(actions);
    
    previewHotSpots.enter().append("path");
    
    previewHotSpots.attr("d", function (d) { return d.hotSpot.d; })
        .attr("id", function (d) { return "HotSpot" + d.hotSpot.hash; })
        .each(function (d) {
            var eventString;
            for (eventString in d.events) {
                if (d.events.hasOwnProperty(eventString)) {
                    jQuery('#HotSpot' + d.hotSpot.hash).on(eventString, function (event) {
                        event.preventDefault();
                        d.events[eventString](event, config);
                        updateAll();
                        return true;
                    }); // jshint ignore:line
                }
            }
        });
    
    previewHotSpots.exit().remove();
}
updateAll();

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
    var template = document.getElementById("graphTemplate"),
        width = Number(template.getAttribute("width")),
        height = Number(template.getAttribute("height")),
        style = template.getAttribute("style"),
        svg = d3.select("body")
            .selectAll("svg.graph")
            .data(["graph"])
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
initGraph();

// Visualize the process matrix:

function initMatrix() {
    // TODO: create the data by traversing the graph;
    // here I'm just putting it in manually for
    // a proof-of-concept
    var matrix;
}
initMatrix();
