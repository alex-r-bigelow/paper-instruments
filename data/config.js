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
                            'M0,0L100,0L100,100L0,100Z',
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
                        hotSpot : new Shape('M300,300L400,300L400,400L300,400Z'),
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
                        hotSpot : new Shape('M50,0L100,0L100,50L50,50Z',
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
                        hotSpot : new Shape('M50,250L150,250L150,275L50,275Z',
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
                        hotSpot : new Shape('M150,0L200,0L200,50L150,50Z',
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
                        hotSpot : new Shape('M150,250L250,250L250,275L150,275Z',
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
                        hotSpot : new Shape('M200,200L250,200L250,250L200,250Z'),
                        events : {
                            click : function (event, config) {
                                config.special_menu.currentState = 'hidden';
                                config.desktop.currentState = 'empty_trash';
                            }
                        }
                    },
                    cancel : {
                        hotSpot : new Shape('M150,200L200,200L200,250L150,250Z'),
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
    delete_folder : [
        new MetaActionStep("desktop", "dragging", "trash"),
        new MetaActionStep("special_menu", "hidden", "click"),
        new MetaActionStep("special_menu", "showing", "select"),
        new MetaActionStep("special_menu", "dialog", "ok")
    ],
    create_folder : [
        new MetaActionStep("file_menu", "hidden", "click"),
        new MetaActionStep("file_menu", "showing", "select")
    ]
};