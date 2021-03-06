/* globals jQuery, d3, Image, getCSSRule, document, window, setTimeout */
"use strict";

// funcitons for adding / removing SVG classes:
function jQueryAddSvgClass (queryObj, classname) {
    var existingClasses = queryObj.attr('class');
    if (existingClasses !== undefined) {
        if (existingClasses.split(" ").indexOf(classname) === -1) {
            queryObj.attr({
                'class' : existingClasses + " " + classname
            });
        }
    } else {
        queryObj.attr({
            "class" : classname
        });
    }
}
function jQueryRemoveSvgClass (queryObj, classname) {
    var classes = queryObj.attr('class').split(" ");
    classes.pop(classes.indexOf(classname));
    if (classes.length === 0) {
        queryObj.removeAttr('class');
    } else {
        queryObj.attr({
            'class' : classes.join(" ")
        });
    }
}

// Classes used in previews

function Slide(src,z) {
    var self = this;
    self.src = src;
    if (z === undefined) {
        z = 1;
    }
    self.zIndex = z;
}

function Handle(shape, x, y, hIndex) {
    var self = this,
        domHandle;
    
    self.hash = Handle.HASH;
    Handle.ALL[self.hash] = self;
    Handle.HASH += 1;

    self.shape = shape;
    self.x = x;
    self.y = y;
    self.hIndex = hIndex;
    
    // jQuery doesn't support creating SVG nodes...
    domHandle = document.createElementNS('http://www.w3.org/2000/svg','circle');
    domHandle.setAttribute('id', 'Handle' + self.hash);
    document.getElementById('hotSpots').appendChild(domHandle);
    // Now set the other attributes
    jQuery("#Handle" + self.hash).attr({
        cx : self.x,
        cy : self.y,
        r : 5
    }).on('mousedown', function (event) {
        self.drag(event);
    });
}
Handle.ALL = {};
Handle.HASH = 1;
Handle.clearAll = function () {
    var hash;
    for (hash in Handle.ALL) {
        if (Handle.ALL.hasOwnProperty(hash)) {
            jQuery("#Handle" + hash).remove();
        }
    }
    Handle.ALL = {};
    Handle.HASH = 1;
};

Handle.prototype.drag = function (event) {
    var self = this,
        origin = {
            X : event.clientX - self.x,
            Y : event.clientY - self.y
        },
        move = function (event) {
            event.preventDefault();
            self.moveTo({
                X : event.clientX - origin.X,
                Y : event.clientY - origin.Y
            });
            return true;
        },
        up = function (event) {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            return move(event);
        };
    
    event.preventDefault();
    
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    
    return true;
};
Handle.prototype.moveTo = function (pos) {
    var self = this,
        segments = self.shape.extractSegments(),
        s,
        l,
        hIndex;
    self.x = pos.X;
    self.y = pos.Y;
    jQuery('#Handle' + self.hash).attr({
        'cx' : self.x,
        'cy' : self.y
    });
    
    // Update the path string in our parent shape
    hIndex = 0;
    for (s = 0; s < segments.length; s += 1) {
        if (hIndex === self.hIndex) {
            segments[s].points[0].X = self.x;
            segments[s].points[0].Y = self.y;
            self.shape.setD(segments);
            self.shape.finalizeD();
            break;
        } else {
            hIndex += 1;
        }
        l = segments[s].segType.toLowerCase();
        if (l === 's' || l === 'q') {
            if (hIndex === self.hIndex) {
                segments[s].points[1].X = self.x;
                segments[s].points[1].Y = self.y;
                self.shape.setD(segments);
                self.shape.finalizeD();
                break;
            } else {
                hIndex += 1;
            }
        }
    }
};

function Shape(d,visible,zIndex) {
    var self = this;
    
    self.hash = Shape.HASH;
    Shape.ALL[self.hash] = self;
    Shape.HASH += 1;
    
    if (d === null) {
        self.isFullScreen = true;
        self.d = 'M0,0';    // Will be updated later
    } else {
        self.isFullScreen = false;
        self.d = d;
    }
    
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
Shape.SELECTED = null;
Shape.findShape = function (domTarget) {
    var hash = Number(domTarget.getAttribute('id').substring(7));
    return Shape.ALL[hash];
};
Shape.prototype.extractSegments = function () {
    var self = this,
        numbers = self.d.replace(new RegExp("[a-zA-Z]", "g"), ",").split(","),
        letterString = self.d.replace(new RegExp("[0-9]", "g"), ""),
        letters = letterString.split(","),
        lowerLetters = letterString.toLowerCase().split(","),
        segments = [],
        splicedNumbers,
        l;
    
    // There's an empty entry at the beginning
    numbers.splice(0, 1);
    
    for (l = 0; l < letters.length; l += 1) {
        if (lowerLetters[l] === "z") {
            segments.push({
                segType : letters[l],
                points : []
            });
        } else if (lowerLetters[l] === "m" || lowerLetters[l] === "l" || lowerLetters[l] === "t") {
            splicedNumbers = numbers.splice(0, 2);
            segments.push({
                segType : letters[l],
                points : [
                    {
                        X : splicedNumbers[0],
                        Y : splicedNumbers[1]
                    }
                ]
            });
        } else if (lowerLetters[l] === "s" || lowerLetters[l] === "q") {
            splicedNumbers = numbers.splice(0, 4);
            segments.push({
                segType : letters[l],
                points : [
                    {
                        X : splicedNumbers[0],
                        Y : splicedNumbers[1]
                    },
                    {
                        X : splicedNumbers[2],
                        Y : splicedNumbers[3]
                    }
                ]
            });
        }
    }
    return segments;
};
Shape.prototype.setD = function (segments) {
    var self = this,
        s,
        l;
    
    self.d = "";
    
    for (s = 0; s < segments.length; s += 1) {
        l = segments[s].segType.toLowerCase();
        self.d += segments[s].segType;
        if (l === 'z') {
            break;
        }
        self.d += segments[s].points[0].X;
        self.d += ',';
        self.d += segments[s].points[0].Y;
        if (l === 's' || l === 'q') {
            self.d += ",";
            self.d += segments[s].points[1].X;
            self.d += ',';
            self.d += segments[s].points[1].Y;
        }
    }
};
Shape.prototype.finalizeD = function () {
    var self = this;
    jQuery('#pathString').val(self.d);
    jQuery('#HotSpot' + self.hash).attr({
        'd' : self.d
    });
};
Shape.prototype.initHandles = function () {
    var self = this,
        segments = self.extractSegments(),
        i,
        p,
        h,
        hIndex;
    Handle.clearAll();
    jQuery("#pathString").val(self.d);
    hIndex = 0;
    for (i = 0; i < segments.length; i += 1) {
        for (p = 0; p < segments[i].points.length; p += 1) {
            h = new Handle(self, segments[i].points[p].X, segments[i].points[p].Y, hIndex);
            hIndex += 1;
        }
    }
};
Shape.prototype.select = function (event) {
    var self = this,
        hash,
        origins = {},
        domShape = jQuery("#HotSpot" + self.hash),
        move = function (event) {
            var hash;
            event.preventDefault();
            
            for (hash in Handle.ALL) {
                if (Handle.ALL.hasOwnProperty(hash)) {
                    Handle.ALL[hash].moveTo({
                        X : event.clientX - origins[hash].X,
                        Y : event.clientY - origins[hash].Y
                    });
                }
            }
            self.finalizeD();
            
            return true;
        },
        up = function (event) {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
                
                return move(event);
        };
    
    if (Shape.SELECTED !== null && Shape.SELECTED !== -1) {
        jQueryRemoveSvgClass(jQuery("#HotSpot" + Shape.ALL[Shape.SELECTED].hash), "selected");
    }
    Shape.SELECTED = self.hash;
    
    // Create our handles, border
    self.initHandles();
    jQueryAddSvgClass(domShape, "selected");
    
    // Now drag the whole shape
    event.preventDefault();
    
    for (hash in Handle.ALL) {
        if (Handle.ALL.hasOwnProperty(hash)) {
            origins[hash] = {
                X : event.clientX - Handle.ALL[hash].x,
                Y : event.clientY - Handle.ALL[hash].y
            };
        }
    }
    
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    
    return true;
};

function DummyAction(mask) {
    var self = this;
    self.hotSpot = mask;
    self.events = {};
    self.isMask = true;
}

function MetaActionStep(stateTree, state, action) {
    var self = this;
    self.stateTree = stateTree;
    self.state = state;
    self.action = action;
}

// Global variables

var no_image = new Slide('',1),
    metaStates,
    config,
    metaActions,
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
        temp,
        hotSpotHashes = {};
    
    if (updateCallback === undefined) {
        updateCallback = updatePreview;
    }
    
    // figure out the new currentComboString while collecting the relevant images and actions
    currentComboString = "";
    for (stateTree in config) {
        if (config.hasOwnProperty(stateTree)) {
            currentComboString += config[stateTree].currentState;
            
            if (config[stateTree].hasOwnProperty('currentState') === false) {
                throw 'You must specify an initial state for stateTree "' + stateTree + '"';
            } else if (config[stateTree].states.hasOwnProperty(config[stateTree].currentState) === false) {
                throw "Attempted to set stateTree '" + stateTree + "' to nonexistent state '" + config[stateTree].currentState + "'";
            }
            state = config[stateTree].states[config[stateTree].currentState];
            images.push(state.image);
            for (action in state.actions) {
                if (state.actions.hasOwnProperty(action)) {
                    if (state.actions[action].hotSpot.isVisible(config, metaStates) === true &&
                            hotSpotHashes.hasOwnProperty(state.actions[action].hotSpot.hash) === false) {
                        actions.push(state.actions[action]);
                        hotSpotHashes[state.actions[action].hotSpot.hash] = true;
                    }
                }
            }
            for (mask in state.masks) {
                if (state.masks.hasOwnProperty(mask)) {
                    if (state.masks[mask].isVisible(config, metaStates) === true &&
                            hotSpotHashes.hasOwnProperty(state.masks[mask].hash) === false) {
                        actions.push(new DummyAction(state.masks[mask]));
                        hotSpotHashes[state.masks[mask].hash] = true;
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
        .attr("id", function (d) { return "HotSpot" + d.hotSpot.hash; });
    
    previewHotSpots.each(function (d) {
        var h = jQuery("#HotSpot" + d.hotSpot.hash),
            eventString;
        if (d.isMask) {
            jQueryAddSvgClass(h, "mask");
        }
        
        if (Shape.SELECTED !== null) {
            h.on('mousedown', function (event) {
                Shape.ALL[d.hotSpot.hash].select(event);
            });
        } else {
            for (eventString in d.events) {
                if (d.events.hasOwnProperty(eventString)) {
                    jQuery('#HotSpot' + d.hotSpot.hash).on(eventString, function (event) {
                        event.preventDefault();
                        d.events[eventString](event, config, metaStates);
                        updateCallback();
                        return true;
                    }); // jshint ignore:line
                }
            }
        }
    });
    
    
    
    previewHotSpots.exit().remove();
}

// Hotspot showing / hiding depending on whether space is pressed
function hideHotSpots () {
    jQuery(window).on("keydown", function (event) {
        var hotSpotRule = getCSSRule('svg#hotSpots path');
        if (event.which === 32) {   // 32 is the key code for SPACE
            hotSpotRule.style['fill-opacity'] = 0.25;
        }
    });
    jQuery(window).on("keyup", function (event) {
        var hotSpotRule = getCSSRule('svg#hotSpots path');
        hotSpotRule.style['fill-opacity'] = 0.001;
    });
}

// Preload images and resize viewports
function loadImages () {
    var stateTree,
        state,
        temp,
        w = 0,
        h = 0,
        numImages = null,
        loadingImages = [];
    for (stateTree in config) {
        if (config.hasOwnProperty(stateTree)) {
            for (state in config[stateTree].states) {
                if (config[stateTree].states.hasOwnProperty(state)) {
                    temp = new Image();
                    temp.onload = function () {
                        var self = this;
                        if (self.width > w) {
                            w = self.width;
                        }
                        if (self.height > h) {
                            h = self.height;
                        }
                        if (numImages === null) {
                            numImages = loadingImages.length;
                        }
                        jQuery("#loadingBar div").css('width', (100 - (loadingImages.length / numImages * 100)) + '%');
                        loadingImages.pop(loadingImages.indexOf(self));
                    }; // jshint ignore:line
                    loadingImages.push(temp);
                    numImages += 1;
                    temp.src = 'data/' + config[stateTree].states[state].image.src;
                }
            }
        }
    }
    // Every two seconds, check if the images have finished loading...
    function finish () {
        var hash;
        //if (loadingImages.length > 0) {
        //    setTimeout(finish, 2000);
        //} else {
            jQuery('.viewport').attr({
                width : w,
                height : h
            });
            for (hash in Shape.ALL) {
                if (Shape.ALL.hasOwnProperty(hash) && Shape.ALL[hash].isFullScreen === true) {
                    Shape.ALL[hash].d = 'M0,0L' + w + ',0L' + w + ',' + h + 'L0,' + h + 'Z';
                    Shape.ALL[hash].setD(Shape.ALL[hash].extractSegments());
                    Shape.ALL[hash].finalizeD();
                }
            }
            jQuery('#loading').remove();
        //}
    }
    setTimeout(finish, 2000);
}

// config.js gets loaded next...
