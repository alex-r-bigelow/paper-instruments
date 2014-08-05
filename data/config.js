/* globals Image, Shape, empty_space, no_image, config:true */
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
                        hotSpot : new Shape('M0,0L100,0L100,100L0,100Z'),
                        events : {
                            mousedown : function (event) {
                                return event.which === 0;
                            }
                        },
                        effects : function (config) {
                            config.desktop.currentState = 'dragging';
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
                            mouseup : function (event) {
                                return event.which === 0;
                            }
                        },
                        effects : function (config) {
                            config.desktop.currentState = 'untitled_folder';
                        }
                    },
                    trash : {
                        hotSpot : new Shape('M300,300L400,300L400,400L300,400Z'),
                        events : {
                            mouseup : function (event) {
                                return event.which === 0;
                            }
                        },
                        effects : function (config) {
                            config.desktop.currentState = 'full_trash';
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
                        hotSpot : new Shape('M50,0L100,0L100,50L50,50Z'),
                        events : {
                            mousedown : function (event) {
                                return event.which === 0;
                            }
                        },
                        effects : function (config) {
                            config.file_menu.currentState = 'showing';
                        }
                    }
                },
                masks : {}
            },
            showing : {
                image : new Image('file_menu.png'),
                actions : {
                    click : {
                        hotSpot : new Shape('M50,250L150,250L150,275L50,275Z'),
                        events : {
                            mouseup : function (event, config) {
                                return event.which === 0 && config.desktop.currentState === 'empty_trash';
                            }
                        },
                        effects : function (config) {
                            config.file_menu.currentState = 'hidden';
                            config.desktop.currentState = 'untitled_folder';
                        }
                    },
                    release : {
                        hotSpot : empty_space,
                        events : {
                            mouseup : function (event, config) {
                                return event.which === 0 && Shape.findShape(event.target) !== 'showing'.actions.click.hotSpot;
                            }
                        },
                        effects : function (config) {
                            config.file_menu.currentState = 'hidden';
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
                        hotSpot : new Shape('M150,0L200,0L200,50L150,50Z'),
                        events : {
                            mousedown : function (event, config) {
                                return event.which === 0;
                            }
                        },
                        effects : function (config) {
                            config.special_menu.currentState = 'showing';
                        }
                    }
                },
                masks : {}
            },
            showing : {
                image : new Image('special_menu.png'),
                actions : {
                    click : {
                        hotSpot : new Shape('M150,250L250,250L250,275L150,275Z'),
                        events : {
                            mouseup : function (event, config) {
                                return event.which === 0 && config.desktop.currentState === 'full_trash';
                            }
                        },
                        effects : function (config) {
                            config.special_menu.currentState = 'dialog';
                        }
                    },
                    release : {
                        hotSpot : empty_space,
                        events : {
                            mouseup : function (event, config) {
                                return event.which === 0 && Shape.findShape(event.target) !== 'showing'.actions.click.hotSpot;
                            }
                        },
                        effects : function (config) {
                            config.special_menu.currentState = 'hidden';
                        }
                    }
                },
                masks : {
                    menu : new Shape('M150,0L250,0L250,400L150,400Z')
                }
            },
            dialog : {
                image : new Image('dialog.png'),
                actions : {
                    ok : {
                        hotSpot : new Shape('M200,200L250,200L250,250L200,250Z'),
                        events : {
                            click : function (event, config) {
                                return true;
                            }
                        },
                        effects : function (config) {
                            config.special_menu.currentState = 'hidden';
                            config.desktop.currentState = 'empty_trash';
                        }
                    },
                    cancel : {
                        hotSpot : new Shape('M150,200L200,200L200,250L150,250Z'),
                        events : {
                            click : function (event, config) {
                                return true;
                            }
                        },
                        effects : function (config) {
                            config.special_menu.currentState = 'hidden';
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