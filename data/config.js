/* globals Image, Shape, empty_space, no_image, MetaActionStep, metaStates:true, config:true, metaActions:true */
"use strict";

metaStates = {
    folder : "Doesn't Exist"
};

config = {
    desktop : {
        states : {
            empty_trash : {
                image : new Image('empty_trash.png'),
                actions : {},
                masks : {}
            },
            untitled_folder : {
                image : new Image('untitled_folder.png'),
                actions : {
                    drag : {
                        hotSpot : new Shape(
                            'M435,85L510,85L510,125L435,125Z',
                            function (config) {
                                return config.file_menu.currentState === 'hidden' && config.special_menu.currentState === 'hidden';
                            }),
                        events : {
                            mousedown : function (event, config, metaStates) {
                                if (event === null || event.which === 1) {
                                    config.desktop.currentState = 'dragging';
                                }
                            }
                        },
                        actionType : "Direct Manipulation"
                    }
                },
                masks : {}
            },
            dragging : {
                image : new Image('dragging.png'),
                actions : {
                    elsewhere : {
                        hotSpot : empty_space,
                        events : {
                            mouseup : function (event, config, metaStates) {
                                if (event === null || event.which === 1) {
                                    config.desktop.currentState = 'untitled_folder';
                                }
                            }
                        },
                        actionType : "Direct Manipulation"
                    },
                    trash : {
                        hotSpot : new Shape('M450,285L495,285L495,340L450,340Z'),
                        events : {
                            mouseup : function (event, config, metaStates) {
                                if (event === null || event.which === 1) {
                                    config.desktop.currentState = 'full_trash';
                                    metaStates.folder = 'In trash';
                                }
                            }
                        },
                        actionType : "Direct Manipulation"
                    }
                },
                masks : {}
            },
            full_trash : {
                image : new Image('full_trash.png'),
                actions : {},
                masks : {}
            }
        }
    },
    file_menu : {
        states : {
            hidden : {
                image : no_image,
                actions : {
                    click : {
                        hotSpot : new Shape('M30,0L75,0L75,20L30,20Z',
                            function (config) {
                                return config.special_menu.currentState === 'hidden' && config.desktop.currentState !== 'dragging';
                            }),
                        events : {
                            mousedown : function (event, config, metaStates) {
                                if (event === null || event.which === 1) {
                                    config.file_menu.currentState = 'showing';
                                }
                            }
                        },
                        actionType : "GUI"
                    }
                },
                masks : {}
            },
            showing : {
                image : new Image('file_menu.png', 2),
                actions : {
                    select : {
                        hotSpot : new Shape('M30,20L180,20L180,40L30,40Z',
                            function (config) {
                                return config.desktop.currentState === 'empty_trash';
                            }, 2),
                        events : {
                            mouseup : function (event, config, metaStates) {
                                if (event === null || event.which === 1) {
                                    config.file_menu.currentState = 'hidden';
                                    config.desktop.currentState = 'untitled_folder';
                                    metaStates.folder = "On Desktop";
                                }
                            }
                        },
                        actionType : "GUI"
                    },
                    release : {
                        hotSpot : empty_space,
                        events : {
                            mouseup : function (event, config, metaStates) {
                                if (event === null || event.which === 1) {
                                    config.file_menu.currentState = 'hidden';
                                }
                            }
                        },
                        actionType : "GUI"
                    }
                },
                masks : {
                    menu : new Shape('M30,0L180,0L180,280L30,280Z', true, 1)
                }
            }
        }
    },
    special_menu : {
        states : {
            hidden : {
                image : no_image,
                actions : {
                    click : {
                        hotSpot : new Shape('M205,0L260,0L260,20L205,20Z',
                            function (config) {
                                return config.file_menu.currentState === 'hidden' && config.desktop.currentState !== 'dragging';
                            }),
                        events : {
                            mousedown : function (event, config, metaStates) {
                                if (event === null || event.which === 1) {
                                    config.special_menu.currentState = 'showing';
                                }
                            }
                        },
                        actionType : "GUI"
                    }
                },
                masks : {}
            },
            showing : {
                image : new Image('special_menu.png', 2),
                actions : {
                    select : {
                        hotSpot : new Shape('M205,35L340,35L340,55L205,55Z',
                            function (config) {
                                return config.desktop.currentState === 'full_trash';
                            }, 2),
                        events : {
                            mouseup : function (event, config, metaStates) {
                                if (event === null || event.which === 1) {
                                    config.special_menu.currentState = 'dialog';
                                }
                            }
                        },
                        actionType : "GUI"
                    },
                    release : {
                        hotSpot : empty_space,
                        events : {
                            mouseup : function (event, config, metaStates) {
                                if (event === null || event.which === 1) {
                                    config.special_menu.currentState = 'hidden';
                                }
                            }
                        },
                        actionType : "GUI"
                    }
                },
                masks : {
                    menu : new Shape('M205,0L340,0L340,150L205,150Z', true, 1)
                }
            },
            dialog : {
                image : new Image('dialog.png', 2),
                actions : {
                    ok : {
                        hotSpot : new Shape('M365,130L435,130L435,165L365,165Z'),
                        events : {
                            click : function (event, config, metaStates) {
                                config.special_menu.currentState = 'hidden';
                                config.desktop.currentState = 'empty_trash';
                                metaStates.folder = "Doesn't Exist";
                            }
                        },
                        actionType : "GUI"
                    },
                    cancel : {
                        hotSpot : new Shape('M295,130L360,130L360,165L295,165Z'),
                        events : {
                            click : function (event, config, metaStates) {
                                config.special_menu.currentState = 'hidden';
                            }
                        },
                        actionType : "GUI"
                    }
                },
                masks : {}
            }
        }
    }
};

config.desktop.currentState = 'empty_trash';
config.file_menu.currentState = 'hidden';
config.special_menu.currentState = 'hidden';

metaActions = {
    folder : {
        "delete" : [
            [
                new MetaActionStep("desktop", "dragging", "trash", "direct manipulation"),
                new MetaActionStep("special_menu", "hidden", "click", "gui"),
                new MetaActionStep("special_menu", "showing", "select", "gui"),
                new MetaActionStep("special_menu", "dialog", "ok", "gui")
            ]
        ],
        "create" : [
            [
                new MetaActionStep("file_menu", "hidden", "click", "gui"),
                new MetaActionStep("file_menu", "showing", "select", "gui")
            ]
        ]
    }
};