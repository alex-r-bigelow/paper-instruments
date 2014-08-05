"use strict";

function Image(src,z) {
    var self = this;
    self.src = src;
    if (z === undefined) {
        z = 1;
    }
    self.zIndex = z;
}

function Shape(d,z) {
    var self = this;
    self.d = d;
    if (z === undefined) {
        z = 1;
    }
    self.zIndex = z;
}
Shape.findShape = function (domTarget) {
    // TODO: use jquery data() ?
};

var no_image = new Image(''),
    empty_space = {},   // TODO: make this a mask
    config;

// config.js gets loaded next