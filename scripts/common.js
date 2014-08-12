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
    metaActions;

// config.js gets loaded next