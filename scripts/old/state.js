/*globals $, console*/

function OrderedDict() {
    "use strict";
    var self = this;
    self.hashLookup = {};
    self.order = [];
}
OrderedDict.prototype.has_key = function (hash) {
    "use strict";
    var self = this;
    return self.hashLookup.hasOwnProperty(hash);
};
OrderedDict.prototype.getItem = function (hash) {
    "use strict";
    var self = this;
    return self.hashLookup[hash];
};
OrderedDict.prototype.setItem = function (hash, value) {
    "use strict";
    var self = this;
    if (self.hashLookup.hasOwnProperty(hash) === false) {
        self.order.append(hash);
    }
    self.hashLookup[hash] = value;
};
OrderedDict.prototype.deleteItem = function (hash) {
    "use strict";
    var self = this;
    delete self.hashLookup[hash];
    self.order.remove(hash);
};

function Action(name) {
    "use strict";
    var self = this;
    if (Action.ALL.has_key(name)) {
        throw "Duplicate Action name: " + name;
    }
    self.name = name;
    self.effects = [];
    Action.ALL.setItem(self.name, self);
}
Action.ALL = new OrderedDict();
Action.prototype.addEffect = function (e) {
    "use strict";
    var self = this;
    self.effects.append(e);
};
Action.prototype.performAction = function () {
    "use strict";
    var self = this,
        i = 0;
    for (i = 0; i < self.effects.length; i += 1) {
        self.effects[i]();
    }
};

function State(name) {
    "use strict";
    var self = this;
    if (State.ALL.hasOwnProperty(name)) {
        throw "Duplicate State name: " + name;
    }
    self.name = name;
    self.actions = {};
    State.ALL.setItem(self.name, self);
}
State.ALL = new OrderedDict();
State.prototype.addAction = function (a) {
    "use strict";
    var self = this;
    self.actions[a.name] = a;
};

function StateTree(name) {
    "use strict";
    var self = this;
    if (StateTree.ALL.hasOwnProperty(name)) {
        throw "Duplicate StateTree name: " + name;
    }
    self.name = name;
    self.states = {};
    StateTree.ALL.setItem(self.name, self);
}
StateTree.ALL = new OrderedDict();
StateTree.prototype.addState = function (s) {
    "use strict";
    var self = this;
    self.states[s.name] = s;
};

function explorePermutations() {
    "use strict";
    var graph = {
            nodes : [],
            links : []
        },
        visited = {},
        i = 0,
        s = "",
        actionList = [];
    while (true) {
        s = "";
        actionList = [];
        for (i = 0; i < StateTree.ALL.order.length; i += 1) {
            s += StateTree.ALL.getItem(StateTree.ALL.order[i]).currentState;
            
        }
        visited[s] = true;
        
    }
}

function loadConfig() {
    "use strict";
    $.ajax({
        url: "data/config.json",
        success: function (config) {
            var tree,
                states,
                state,
                actions,
                action,
                effects,
                effect,
                dummy;
            for (tree in config.stateTrees) {
                if (config.stateTrees.hasOwnProperty(tree)) {
                    dummy = new StateTree(tree);
                    states = config.stateTrees[tree].states;
                    for (state in states) {
                        if (states.hasOwnProperty(state)) {
                            StateTree.ALL.getItem(tree).addState(new State(state));
                            actions = states[state].actions;
                            for (action in actions) {
                                if (actions.hasOwnProperty(action)) {
                                    State.ALL.getItem(state).addAction(new Action(action));
                                    effects = actions[action].effects;
                                    for (effect in effects) {
                                        if (effects.hasOwnProperty(effect)) {
                                            Action.ALL.getItem(action).addEffect(eval(effects[effect])); // jshint ignore:line
                                        }
                                    }
                                }
                            }
                        }
                    }
                    StateTree.ALL.getItem(tree).currentState = State.ALL.getItem(config.startingStates[tree]);
                }
            }
            explorePermutations();
        },
        error: function (o, e1, e2) {
            // jshint unused:true
            throw e2;
        },
        dataType: "json",
        async: false
    });
}