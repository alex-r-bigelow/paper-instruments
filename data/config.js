/* globals Image, Shape, empty_space, no_image, MetaActionStep, config:true, metaActions:true */
"use strict";

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
                            mousedown : function (event, config) {
                                if (event === null || event.which === 1) {
                                    config.desktop.currentState = 'dragging';
                                }
                            }
                        }
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
                            mouseup : function (event, config) {
                                if (event === null || event.which === 1) {
                                    config.desktop.currentState = 'untitled_folder';
                                }
                            }
                        }
                    },
                    trash : {
                        hotSpot : new Shape('M450,285L495,285L495,340L450,340Z'),
                        events : {
                            mouseup : function (event, config) {
                                if (event === null || event.which === 1) {
                                    config.desktop.currentState = 'full_trash';
                                }
                            }
                        }
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
                            mousedown : function (event, config) {
                                if (event === null || event.which === 1) {
                                    config.file_menu.currentState = 'showing';
                                }
                            }
                        }
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
                            }),
                        events : {
                            mouseup : function (event, config) {
                                if (event === null || event.which === 1) {
                                    config.file_menu.currentState = 'hidden';
                                    config.desktop.currentState = 'untitled_folder';
                                }
                            }
                        }
                    },
                    release : {
                        hotSpot : empty_space,
                        events : {
                            mouseup : function (event, config) {
                                if (event === null || event.which === 1) {
                                    config.file_menu.currentState = 'hidden';
                                }
                            }
                        }
                    }
                },
                masks : {
                    menu : new Shape('M50,0L150,0L150,400L50,400Z')
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
                            mousedown : function (event, config) {
                                if (event === null || event.which === 1) {
                                    config.special_menu.currentState = 'showing';
                                }
                            }
                        }
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
                            }),
                        events : {
                            mouseup : function (event, config) {
                                if (event === null || event.which === 1) {
                                    config.special_menu.currentState = 'dialog';
                                }
                            }
                        }
                    },
                    release : {
                        hotSpot : empty_space,
                        events : {
                            mouseup : function (event, config) {
                                if (event === null || event.which === 1) {
                                    config.special_menu.currentState = 'hidden';
                                }
                            }
                        }
                    }
                },
                masks : {
                    menu : new Shape('M150,0L250,0L250,400L150,400Z')
                }
            },
            dialog : {
                image : new Image('dialog.png', 2),
                actions : {
                    ok : {
                        hotSpot : new Shape('M365,130L435,130L435,165L365,165Z'),
                        events : {
                            click : function (event, config) {
                                config.special_menu.currentState = 'hidden';
                                config.desktop.currentState = 'empty_trash';
                            }
                        }
                    },
                    cancel : {
                        hotSpot : new Shape('M295,130L360,130L360,165L295,165Z'),
                        events : {
                            click : function (event, config) {
                                config.special_menu.currentState = 'hidden';
                            }
                        }
                    }
                },
                masks : {
                    everywhere : new Shape('M0,0L500,0L500,500L0,500Z')
                }
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