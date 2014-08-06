"use strict";

function Image(src,z) {
    var self = this;
    self.src = src;
    if (z === undefined) {
        z = 1;
    }
    self.zIndex = z;
}

function Shape(d,zIndex,visible) {
    var self = this;
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
Shape.findShape = function (domTarget) {
    // TODO: use jquery data() ?
};

var no_image = new Image(''),
    empty_space = new Shape('M0,0L719,0L719,480LL0,480Z',0,true), // TODO: figure this out automatically
    config;

// config.js gets loaded next