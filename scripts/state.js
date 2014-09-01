/* globals jQuery, d3, document, metaStates, config, metaActions, currentComboString, loadImages, updatePreview, hideHotSpots */
"use strict";

// Create a graph, exploring all possible interaction pathways:

var graph = {
        nodes : [],
        links : []
    },
    linkLookup = {},
    visited = {},
    metaSeeds = {},
    allMetaStates = {},
    allActionTypes = {},
    metaStateColors = [ '#1f77b4',  // d3.scale.category20, but parsed
                        '#ff7f0e',  // so that states are only
                        '#2ca02c',  // encoded with saturated colors,
                        '#d62728',  // and actions are only encoded with
                        '#9467bd',  // desaturated ones. Also rotated
                        '#8c564b',  // so that hues are less likely to be
                        '#e377c2',  // repeated between the two
                        '#bcbd22',
                        '#17becf'],
    metaActionColors = ['#c49c94',
                        '#f7b6d2',
                        '#dbdb8d',
                        '#9edae5',
                        '#aec7e8',
                        '#ffbb78',
                        '#98df8a',
                        '#ff9896',
                        '#c5b0d5'];

function constructGraph (config, metaStates) {
    var tempConfig,
        tempMetaStates,
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
            if (config[stateTree].states.hasOwnProperty(stateString) === false) {
                throw "Set tree '" + stateTree + "' to nonexistent state '" + stateString + "'";
            }
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
                stateStrings : currentStateStrings,
                metaStates : {}
            });
        
        // ... copy our current meta states
        for (entity in metaStates) {
            if (metaStates.hasOwnProperty(entity)) {
                graph.nodes[graph.nodes.length - 1].metaStates[entity] = metaStates[entity];
                // collect all possible meta states
                if (allMetaStates.hasOwnProperty(entity) === false) {
                    allMetaStates[entity] = {};
                }
                allMetaStates[entity][metaStates[entity]] = true;
            }
        }
        
        // ... recurse for all the possible next states
        for (stateTree in currentStates) {
            if (currentStates.hasOwnProperty(stateTree)) {
                actions = currentStates[stateTree].actions;
                for (actionString in actions) {
                    if (actions.hasOwnProperty(actionString)) {
                        // Don't follow actions if their hotSpots aren't even visible
                        if (actions[actionString].hotSpot.isVisible(config) === true) {
                            // Collect all possible action types
                            allActionTypes[actions[actionString].actionType] = true;
                            
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
                                                    metaSeeds[entity][meta].push({
                                                        config : config,
                                                        metaStates : metaStates
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            
                            events = actions[actionString].events;
                            for (eventString in events) {
                                if (events.hasOwnProperty(eventString)) {
                                    // deep clone config and metaStates; this allows effect functions
                                    // to do anything they want to the config object
                                    tempConfig = jQuery.extend(true, {}, config);
                                    tempMetaStates = jQuery.extend(true, {}, metaStates);
                                    
                                    // apply the event to our clone and metaStates (with a null event object)
                                    events[eventString](null, tempConfig, tempMetaStates);
                                    
                                    // recurse
                                    targetComboString = constructGraph(tempConfig, tempMetaStates);
                                    
                                    // don't create self-edges in the graph
                                    if (targetComboString !== comboString) {
                                        // add the links to the new nodes
                                        graph.links.push({
                                            source : visited[comboString],
                                            target : visited[targetComboString],
                                            metaActions : {},
                                            actionType : actions[actionString].actionType
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
function flagMetaActions() {
    var metaAction,
        entity,
        tempConfig,
        tempMetaStates,
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
            for (metaAction in metaSeeds[entity]) {
                if (metaSeeds[entity].hasOwnProperty(metaAction)) {
                    for (i = 0; i < metaSeeds[entity][metaAction].length; i += 1) {
                        linksToFlag = [];
                        success = true;
                        tempConfig = metaSeeds[entity][metaAction][i].config;
                        tempMetaStates = metaSeeds[entity][metaAction][i].metaStates;
                        // loop through the potential steps TODO: may be a bug here if there's more than one sequence...
                        for (j = 0; j < metaActions[entity][metaAction].length; j += 1) {
                            for (k = 0; k < metaActions[entity][metaAction][j].length; k += 1) {
                                state = tempConfig[metaActions[entity][metaAction][j][k].stateTree].currentState;
                                
                                // It's possible that we're not even in the right state to perform
                                // this step...
                                if (state !== metaActions[entity][metaAction][j][k].state) {
                                    success = false;
                                    break;
                                }
                                
                                action = tempConfig[metaActions[entity][metaAction][j][k].stateTree]
                                    .states[state].actions[metaActions[entity][metaAction][j][k].action];
                                
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
                                            action.events[temp](null, tempConfig, tempMetaStates);
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
                                if (temp.hasOwnProperty(entity) === false) {
                                    temp[entity] = {};
                                }
                                temp[entity][metaAction] = true;
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

function updateGraphColors () {
    var colorScheme = jQuery('#graphColorScheme').val(),
        entity = jQuery('#graphEntities').val(),
        legendHeight = jQuery('#graphLegend').height() - 20,    // -20 for scroll bar
        offset,
        colors,
        path = d3.select("#edges").selectAll("path"),
        node = d3.select("#nodes").selectAll("circle"),
        edgeLegend = [],
        nodeLegend = [],
        legendScale;
    // Set up our color scheme, and draw our legend
    if (colorScheme === 'actionType') {
        colors = d3.scale.category10();
        // Prep 'No State' as grey (the others are dummy values)
        colors.domain(['a','b','c','d','e','f','g','No State']);
        edgeLegend = Object.keys(allActionTypes);
        legendScale = d3.scale.ordinal().domain(edgeLegend).rangePoints([0,legendHeight],1);
    } else {
        var state,
            action,
            domain = ['No Meta Action','No State'],
            range = ['#c7c7c7','#7f7f7f'],
            i = 0;
        for (state in allMetaStates[entity]) {
            if (allMetaStates[entity].hasOwnProperty(state)) {
                domain.push(state);
                nodeLegend.push(state);
                range.push(metaStateColors[i]);
                i += 1;
                if (i >= metaStateColors.length) {
                    i = 0;
                }
            }
        }
        i = 0;
        for (action in metaActions[entity]) {
            if (metaActions[entity].hasOwnProperty(action)) {
                domain.push(action);
                edgeLegend.push(action);
                range.push(metaActionColors[i]);
                i += 1;
                if (i >= metaActionColors.length) {
                    i = 0;
                }
            }
        }
        legendScale = d3.scale.ordinal().domain(edgeLegend.concat(nodeLegend)).rangePoints([0,legendHeight],1);
        colors = d3.scale.ordinal(10).domain(domain).range(range);
    }
    
    // Apply the colors
    path.attr("fill", function (d) {
        if (colorScheme === 'actionType') {
            return colors(d.actionType);
        } else {
            var metaAction;
            for (metaAction in d.metaActions[entity]) {
                if (d.metaActions[entity].hasOwnProperty(metaAction)) {
                    return colors(metaAction);
                    // TODO: what if an action is part of more than one metaAction arc for an entity?
                }
            }
            return colors('No Meta Action');
        }
    });
    node.attr("fill", function (d) {
        if (colorScheme === 'actionType' || d.metaStates.hasOwnProperty(entity) === false) {
            return colors('No State');
        } else {
            return colors(d.metaStates[entity]);
        }
    });
    
    // Redraw the legend
    document.getElementById('graphLegend').innerHTML = "";
    
    var svg = d3.select("#graphLegend").append("svg")
        .attr("height", legendHeight)
        .selectAll("g");
    var edges = svg.data(edgeLegend),
        nodes = svg.data(nodeLegend);
        
    var oneEdgeGroup = edges.enter()
        .append("g");
        
    oneEdgeGroup.append("path")
        .attr("d" , function (d) {
            offset = legendScale(d);
            return 'M6.33301113330128,' + (10.00666937243196 + offset) +
                   'Q32.21052497327895,' + (14.41824348294756 + offset) +
                   ',57.74629172573322,' + (3.83371113451292 + offset) +
                   'Q32.21052497327895,' + (14.41824348294756 + offset) +
                   ',6.105179741619,' + (0.00926506646513 + offset) + 'Z';
        })
        .attr("fill", function (d) {
            return colors(d);
        });
    oneEdgeGroup.append("text")
        .attr("x", 60)
        .attr("y", function (d) {
            return legendScale(d) + 12;
        })
        .text(function (d) {
            return d;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("fill", "black");
    
    var oneNodeGroup = nodes.enter()
        .append("g");
    
    oneNodeGroup.append("circle")
        .attr("cx", 10)
        .attr("cy", function (d) {
            return legendScale(d) + 8;
        })
        .attr("r",5)
        .attr("fill", function (d) {
            return colors(d);
        });
    oneNodeGroup.append("text")
        .attr("x", 25)
        .attr("y", function (d) {
            return legendScale(d) + 12;
        })
        .text(function (d) {
            return d;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("fill", "black");
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
    svg = d3.select("#graphRegion")
        .selectAll("svg.graph")
        .data(["graph"])
        .enter().append("svg")
        .attr("id", function (d) { return d; })
        .attr("class", "graph")
        .attr("width", width)
        .attr("height", height);
    
    // Add the edges and nodes groups
    svg.append("svg:g").attr("id","edges");
    svg.append("svg:g").attr("id","nodes");
    
    // Start the layout algorithm
    var force = d3.layout.force()
        .charge(-480)
        .linkDistance(60)
        .size([width, height])
        .nodes(graph.nodes)
        .links(graph.links)
        .start();
    
    // Add the links and arrows
    var path = svg.select("#edges").selectAll("path")
        .data(force.links());
    
    path.enter().append("svg:path")
        .attr("class", function (d) {
            var result = "link";
            if (d.metaActions.length > 0) {
                result += " " + d.metaActions.join(" ");
            }
            return result;
        });
        
    // Add the nodes
    var nodeRadius = 5;
    
    var node = svg.select("#nodes").selectAll("circle")
        .data(graph.nodes);
    
    node.enter().append("circle")
        .attr("id", function (d) { return d.comboString; })
        .attr("r", nodeRadius)
        .on('dblclick', clickNode)
        .call(force.drag);
    
    node.attr("class", function (d) {
        if (d.comboString === currentComboString) {
            return "active node";
        } else {
            return "node";
        }
    });
    
    updateGraphColors();
    
    // Update with the algorithm
    force.on("tick",
        function () {
            // draw curvy, pointy arc
            path.attr("d", function(d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    arcRadius = 10 * dx / Math.abs(dx),
                    theta,
                    edgePoint,
                    front,
                    back,
                    arc;
                if (dx === 0) {
                    if (dy >= 0) {
                        theta = Math.PI;
                    } else {
                        theta = -Math.PI;
                    }
                    edgePoint = {
                        x : 0,
                        y : nodeRadius
                    };
                } else {
                    theta = Math.atan((d.target.y - d.source.y)/(d.target.x - d.source.x)) + Math.PI / 2;
                    edgePoint = {
                        x : nodeRadius * Math.cos(theta),
                        y : nodeRadius * Math.sin(theta)
                    };
                }
                front = {
                    x : d.source.x + edgePoint.x,
                    y : d.source.y + edgePoint.y
                };
                back = {
                    x : d.source.x - edgePoint.x,
                    y : d.source.y - edgePoint.y
                };
                arc = {
                    x : (d.source.x + d.target.x) / 2 + arcRadius * Math.cos(theta),
                    y : (d.source.y + d.target.y) / 2 + arcRadius * Math.sin(theta)
                };
                return "M" + 
                    front.x + "," + 
                    front.y + "Q" + 
                    arc.x + "," +
                    arc.y + "," +
                    d.target.x + "," + 
                    d.target.y + "Q" +
                    arc.x + "," +
                    arc.y + "," +
                    back.x + "," +
                    back.y + "Z";
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

function initGui() {
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
    
    // Populate the graph entity menu
    var menu = jQuery("#graphEntities"),
        entity;
    for (entity in metaActions) {
        if (metaActions.hasOwnProperty(entity)) {
            menu.append(jQuery('<option value="' + entity + '">' + entity + '</option>'));
        }
    }
    
    // Update the graph when selects are changed
    jQuery("#graphColorScheme").on('change', function (event) {
        if (event.target.value === 'actionType') {
            menu.prop('disabled','disabled');
        } else {
            menu.prop('disabled', false);
        }
        updateGraphColors();
    });
    menu.on('change', function(event) {
        updateGraphColors();
    });
}

loadImages();
hideHotSpots();
constructGraph(jQuery.extend(true, {}, config), jQuery.extend(true, {}, metaStates));
flagMetaActions();
updateAll();
initGraph();
initMatrix();
initGui();
