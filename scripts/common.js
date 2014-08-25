/* globals jQuery, d3, getCSSRule, document, window */
"use strict";

// Classes used in previews

function Image(src,z) {
    var self = this;
    self.src = src;
    if (z === undefined) {
        z = 1;
    }
    self.zIndex = z;
}

function Shape(d,visible,zIndex) {
    var self = this;
    
    self.hash = Shape.HASH;
    Shape.ALL[self.hash] = self;
    Shape.HASH += 1;
    
    self.d = d;
    if (zIndex === undefined) {
        zIndex = 1;
    }
    self.zIndex = zIndex;
    if (visible === undefined) {
        self.isVisible = function () { return true; };
    } else if (typeof visible === 'boolean') {
        self.isVisible = function () { return visible; };
    } else if (typeof visible !== 'function') {
            throw "visible parameter must be a boolean or function!";
    } else {
        self.isVisible = visible;
    }
}
Shape.ALL = {};
Shape.HASH = 1;
Shape.findShape = function (domTarget) {
    var hash = Number(domTarget.getAttribute('id').substring(7));
    return Shape.ALL[hash];
};

function DummyAction(mask) {
    var self = this;
    self.hotSpot = mask;
    self.events = {};
    self.isMask = true;
}

function MetaActionStep(stateTree, state, action, actionType) {
    var self = this;
    self.stateTree = stateTree;
    self.state = state;
    self.action = action;
    self.actionType = actionType;
}

// Global variables

var no_image = new Image('',1),
    empty_space = new Shape('M0,0L512,0L512,343L0,343Z',true,0), // TODO: figure this out automatically
    config,
    metaActions,
    differentiateMasks = false,
    currentComboString = null;

// Function that handles the preview - by default this gets called whenever state changes,
// but I can replace that callback...
function updatePreview(updateCallback) {
    var images = [],
        actions = [],
        stateTree,
        state,
        action,
        mask,
        temp;
    
    if (updateCallback === undefined) {
        updateCallback = updatePreview;
    }
    
    // figure out the new currentComboString while collecting the relevant images and actions
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
            for (mask in state.masks) {
                if (state.masks.hasOwnProperty(mask)) {
                    if (state.masks[mask].isVisible(config) === true) {
                        actions.push(new DummyAction(state.masks[mask]));
                    }
                }
            }
        }
    }
    
    // Because SVG uses document order instead of z-index, we need to sort the actions
    actions.sort(function (a, b) {
        return a.hotSpot.zIndex - b.hotSpot.zIndex;
    });
    
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
                        updateCallback();
                        return true;
                    }); // jshint ignore:line
                }
            }
        });
    
    if (differentiateMasks === true) {
        previewHotSpots.attr("class", function (d) {
            if (d.isMask === true) {
                return 'mask';
            } else {
                return "";
            }});
    }
    
    previewHotSpots.exit().remove();
}

// Hotspot showing / hiding depending on whether space is pressed
function hideHotSpots () {
    jQuery(window).on("keydown", function (event) {
        var hotSpotRule = getCSSRule('svg#hotSpots path');
        if (event.which === 32) {   // 32 is the key code for SPACE
            hotSpotRule.style['fill-opacity'] = 0.3;
        }
    });
    jQuery(window).on("keyup", function (event) {
        var hotSpotRule = getCSSRule('svg#hotSpots path');
        hotSpotRule.style['fill-opacity'] = 0.001;
    });
}

// config.js gets loaded next