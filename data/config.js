/*globals Slide, Shape, no_image, MetaActionStep, console, metaStates:true, config:true, metaActions:true*/
metaStates = {
    
};

var layers = {
    widget : 0,
    menu : 2,
    dialog : 4
};

var currentRawFile = 'embedded_data_1',
    allSelectable = [5, 9, 15],
    currentSelection = {};

var visibility_functions = {
    dialog_is_hidden : function (config, metaStates) {
        "use strict";
        return config.dialog.currentState === 'hidden';
    },
    top_is_data_loader : function (config, metaStates) {
        "use strict";
        return config.dialog.currentState === 'hidden' && config.widget.currentState === 'data_loader';
    },
    top_is_data_preview : function (config, metaStates) {
        "use strict";
        return config.dialog.currentState === 'hidden' && config.widget.currentState === 'data_preview';
    },
    top_is_influence : function (config, metaStates) {
        "use strict";
        return config.dialog.currentState === 'hidden' && config.widget.currentState === 'influence';
    },
    is_data_file_menu_open : function (config, metaStates) {
        "use strict";
        return config.menu.currentState === 'data_file';
    },
    is_data_format_menu_open : function (config, metaStates) {
        "use strict";
        return config.menu.currentState === 'data_format';
    },
    is_excel_menu_open : function (config, metaStates) {
        "use strict";
        return config.menu.currentState === 'excel';
    },
    is_binding_menu_5_open : function (config, metaStates) {
        "use strict";
        return config.menu.currentState === 'binding_5';
    },
    is_binding_menu_9_open : function (config, metaStates) {
        "use strict";
        return config.menu.currentState === 'binding_9';
    },
    is_binding_menu_15_open : function (config, metaStates) {
        "use strict";
        return config.menu.currentState === 'binding_15';
    },
    is_binding_menu_advanced_open : function (config, metaStates) {
        "use strict";
        return config.menu.currentState === 'binding_advanced';
    }
};

function createToolTipFunction(tooltipName) {
    "use strict";
    
    return function (event, config, metaStates) {
        if (event.type === 'mouseover') {
            config.tooltip.currentState = tooltipName;
        } else {
            config.tooltip.currentState = 'hidden';
        }
    };
}

function createMenuFunction(menuName) {
    "use strict";
    
    return function (event, config, metaStates) {
        config.menu.currentState = menuName;
    };
}

function updateCurrentSelection(config, metaStates) {
    "use strict";
    var i;
    for (i = 0; i < allSelectable.length; i += 1) {
        if (currentSelection.hasOwnProperty(allSelectable[i]) === false) {
            config['selection_' + allSelectable[i]].currentState = 'hidden';
            config['selection_' + allSelectable[i] + '_data'].currentState = 'hidden';
        } else {
            config['selection_' + allSelectable[i]].currentState = 'showing';
            if (visibility_functions.top_is_data_preview(config, metaStates)) {
                config['selection_' + allSelectable[i] + '_data'].currentState = 'showing';
            } else {
                config['selection_' + allSelectable[i] + '_data'].currentState = 'hidden';
            }
        }
    }
}

function createSelectionSwitchFunction(selectionNumber) {
    "use strict";
    return function (event, config, metaStates) {
        if (currentSelection.hasOwnProperty(selectionNumber)) {
            if (event.shiftKey === true) {
                delete currentSelection[selectionNumber];
            } // else { do nothing; it's already selected (normally this would make it the key object) }
        } else {
            if (event.shiftKey !== true) {
                currentSelection = {};
            }
            currentSelection[selectionNumber] = true;
        }
        updateCurrentSelection(config, metaStates);
    };
}

var transition_functions = {
    switch_to_data_loader : function (event, config, metaStates) {
        "use strict";
        config.widget.currentState = 'data_loader';
        config.rawData.currentState = currentRawFile;
        updateCurrentSelection(config, metaStates);
    },
    switch_to_data_preview : function (event, config, metaStates) {
        "use strict";
        config.widget.currentState = 'data_preview';
        config.rawData.currentState = 'hidden';
        updateCurrentSelection(config, metaStates);
    },
    switch_to_influence : function (event, config, metaStates) {
        "use strict";
        config.widget.currentState = 'influence';
        config.rawData.currentState = 'hidden';
        updateCurrentSelection(config, metaStates);
    },
    
    // selection
    deselect_all : function (event, config, metaStates) {
        "use strict";
        currentSelection = {};
        updateCurrentSelection(config, metaStates);
    },
    select_5 : createSelectionSwitchFunction(5),
    select_9 : createSelectionSwitchFunction(9),
    select_15 : createSelectionSwitchFunction(15),
    
    // menus
    show_data_file_menu : createMenuFunction('data_file'),
    show_data_format_menu : createMenuFunction('data_format'),
    show_excel_menu : createMenuFunction('excel'),
    show_binding_menu_5 : createMenuFunction('binding_5'),
    show_binding_menu_9 : createMenuFunction('binding_9'),
    show_binding_menu_15 : createMenuFunction('binding_15'),
    show_binding_menu_advanced : createMenuFunction('binding_advanced'),
    hide_menus : function (event, config, metaStates) {
        "use strict";
        config.menu.currentState = 'hidden';
    },
    
    // data_loader tooltips
    toggle_successful_parse_tooltip : createToolTipFunction('successful_parse'),
    toggle_delete_textfile_tooltip : createToolTipFunction('delete_textfile'),
    toggle_new_textfile_tooltip : createToolTipFunction('new_textfile'),
    toggle_regex_search_tooltip : createToolTipFunction('regex_search'),
    toggle_refresh_stream_tooltip : createToolTipFunction('refresh_stream'),
    toggle_link_data_tooltip : createToolTipFunction('link_data'),
    
    // data_preview tooltips
    toggle_break_link_tooltip : createToolTipFunction('break_link'),
    toggle_scroll_link_tooltip : createToolTipFunction('scroll_link'),
    toggle_refresh_stream_tooltip_2 : createToolTipFunction('refresh_stream_2'),
    toggle_advanced_binding_tooltip : createToolTipFunction('advanced_binding')
};

function createRawSwitchFunction(filename) {
    "use strict";
    
    return function (event, config, metaStates) {
        currentRawFile = filename;
        config.rawData.currentState = filename;
        transition_functions.hide_menus(event, config, metaStates);
    };
}

var genericActions = {
    releaseMenu : {
        hotSpot : new Shape(null, true, layers.menu - 1),
        events : {
            mouseup : transition_functions.hide_menus
        },
        actionType : "GUI"
    }
};

var shapes = {
    // widget level
    data_loader_button : new Shape('M1244,639L1245,665L1276,666L1276,639Z', visibility_functions.dialog_is_hidden, layers.widget),
    data_preview_button : new Shape('M1246,667L1246,690L1276,691L1277,667Z', visibility_functions.dialog_is_hidden, layers.widget),
    influence_button : new Shape('M1246,692L1246,718L1276,718L1277,692Z', visibility_functions.dialog_is_hidden, layers.widget),
    data_loader_header : new Shape('M779,67L780,85L840,84L841,67Z', visibility_functions.dialog_is_hidden, layers.widget),
    data_preview_header : new Shape('M840,66L841,84L919,84L919,66Z', visibility_functions.dialog_is_hidden, layers.widget),
    influence_header : new Shape('M921,67L922,84L981,84L982,67Z', visibility_functions.dialog_is_hidden, layers.widget),
    
    deselect_area : new Shape('M74,114L778,113L776,700L75,701Z', visibility_functions.dialog_is_hidden, layers.widget - 1),
    selection_5 : new Shape('M539,537L559,538L558,557L538,557Z', visibility_functions.dialog_is_hidden, layers.widget),
    selection_9 : new Shape('M344,472L364,473L363,492L343,492Z', visibility_functions.dialog_is_hidden, layers.widget),
    selection_15 : new Shape('M490,380L510,381L509,400L489,400Z', visibility_functions.dialog_is_hidden, layers.widget),
    
    // per-widget: data_loader
    successful_parse_icon : new Shape('M1206,97L1229,97L1229,119L1206,120Z', visibility_functions.top_is_data_loader, layers.widget),
    delete_textfile_button : new Shape('M834,666L854,667L854,685L832,685Z', visibility_functions.top_is_data_loader, layers.widget),
    new_textfile_button : new Shape('M808,667L828,668L828,686L806,686Z', visibility_functions.top_is_data_loader, layers.widget),
    regex_search_button : new Shape('M782,667L802,668L802,686L780,686Z', visibility_functions.top_is_data_loader, layers.widget),
    refresh_stream_button : new Shape('M859,666L879,667L879,685L857,685Z', visibility_functions.top_is_data_loader, layers.widget),
    link_data_checkbox : new Shape('M937,98L982,97L982,117L935,117Z', visibility_functions.top_is_data_loader, layers.widget),
    data_file_select_menu : new Shape('M795,98L927,98L927,117L796,117Z', visibility_functions.top_is_data_loader, layers.widget),
    data_format_select_menu : new Shape('M1119,97L1202,97L1202,116L1120,116Z', visibility_functions.top_is_data_loader, layers.widget),
    
    // per-widget: data_preview
    break_link_button : new Shape('M782,667L802,668L802,686L780,686Z', visibility_functions.top_is_data_preview, layers.widget),
    scroll_link_button : new Shape('M808,667L828,668L828,686L806,686Z', visibility_functions.top_is_data_preview, layers.widget),
    refresh_stream_button_2 : new Shape('M834,666L854,667L854,685L832,685Z', visibility_functions.top_is_data_preview, layers.widget),
    
    advanced_binding_link : new Shape('M802,172L829,172L829,191L802,191Z', visibility_functions.top_is_data_preview, layers.widget),
    
    selection_5_data : new Shape('M801,298L828,298L828,317L801,317Z', visibility_functions.top_is_data_preview, layers.widget),
    selection_9_data : new Shape('M801,370L828,370L828,389L801,389Z', visibility_functions.top_is_data_preview, layers.widget),
    selection_15_data : new Shape('M800,478L827,478L827,497L800,497Z', visibility_functions.top_is_data_preview, layers.widget),
    
    group_binding_link : new Shape('M802,605L829,605L829,624L802,624Z', visibility_functions.top_is_data_preview, layers.widget),
    
    excel_menu_button : new Shape('M949,210L972,210L971,226L950,226Z', visibility_functions.top_is_data_preview, layers.widget),
    
    // per-widget: influence
    
    // menu level
    data_file_menu_mask : new Shape('M797,98L928,97L928,294L799,293Z', visibility_functions.top_is_data_loader, layers.menu),
    embedded_data_1_menuItem : new Shape('M796,119L928,119L928,138L797,138Z', visibility_functions.is_data_file_menu_open, layers.menu + 1),
    someFlowers_csv_menuItem : new Shape('M796,139L928,139L928,158L797,158Z', visibility_functions.is_data_file_menu_open, layers.menu + 1),
    allFlowers_csv_menuItem : new Shape('M796,160L928,160L928,179L797,179Z', visibility_functions.is_data_file_menu_open, layers.menu + 1),
    lesMiserables_json_menuItem : new Shape('M796,182L928,182L928,201L797,201Z', visibility_functions.is_data_file_menu_open, layers.menu + 1),
    data_format_menu_mask : new Shape('M1066,117L1119,117L1118,99L1200,99L1198,266L1067,266Z', visibility_functions.is_data_format_menu_open, layers.menu),
    excel_menu_mask : new Shape('M973,220L972,210L951,209L950,228L960,227L958,353L1204,353L1205,217Z', visibility_functions.is_excel_menu_open, layers.menu),
    binding_menu_5_mask : new Shape('M827,309L826,299L805,298L804,317L814,316L813,432L973,431L973,310Z', visibility_functions.is_binding_menu_5_open, layers.menu),
    binding_menu_9_mask : new Shape('M826,380L825,370L804,369L803,388L813,387L812,503L972,502L972,381Z', visibility_functions.is_binding_menu_9_open, layers.menu),
    binding_menu_15_mask : new Shape('M827,490L826,480L806,479L804,498L814,497L814,608L804,608L804,625L831,623L829,613L973,612L973,491Z', visibility_functions.is_binding_menu_15_open, layers.menu),
    binding_menu_advanced_mask : new Shape('M827,183L826,173L805,172L804,191L814,190L813,306L973,305L973,184Z', visibility_functions.is_binding_menu_advanced_open, layers.menu)
};

config = {
    background : {
        states : {
            clear : {
                image : new Slide('background_clear.png'),
                actions : {
                    data_loader_button : {
                        hotSpot : shapes.data_loader_button,
                        events : {
                            click : transition_functions.switch_to_data_loader
                        },
                        actionType : 'GUI'
                    },
                    data_preview_button : {
                        hotSpot : shapes.data_preview_button,
                        events : {
                            click : transition_functions.switch_to_data_preview
                        },
                        actionType : 'GUI'
                    },
                    influence_button : {
                        hotSpot : shapes.influence_button,
                        events : {
                            click : transition_functions.switch_to_influence
                        },
                        actionType : 'GUI'
                    },
                    data_loader_header : {
                        hotSpot : shapes.data_loader_header,
                        events : {
                            click : transition_functions.switch_to_data_loader
                        },
                        actionType : 'GUI'
                    },
                    data_preview_header : {
                        hotSpot : shapes.data_preview_header,
                        events : {
                            click : transition_functions.switch_to_data_preview
                        },
                        actionType : 'GUI'
                    },
                    influence_header : {
                        hotSpot : shapes.influence_header,
                        events : {
                            click : transition_functions.switch_to_influence
                        },
                        actionType : 'GUI'
                    },
                    deselect_all : {
                        hotSpot : shapes.deselect_area,
                        events : {
                            click : transition_functions.deselect_all
                        },
                        actionType : 'Direct Manipulation'
                    },
                    selection_5 : {
                        hotSpot : shapes.selection_5,
                        events : {
                            click : transition_functions.select_5
                        },
                        actionType : 'Direct Manipulation'
                    },
                    selection_9 : {
                        hotSpot : shapes.selection_9,
                        events : {
                            click : transition_functions.select_9
                        },
                        actionType : 'Direct Manipulation'
                    },
                    selection_15 : {
                        hotSpot : shapes.selection_15,
                        events : {
                            click : transition_functions.select_15
                        },
                        actionType : 'Direct Manipulation'
                    }
                },
                masks : {}
            }
        }
    },
    chart : {
        states : {
            initial : {
                image : new Slide('chart_initial.png'),
                actions : {},
                masks : {}
            }
        }
    },
    widget : {
        states : {
            data_loader : {
                image : new Slide('widget_data_loader.png'),
                actions : {
                    // menus
                    data_file_menu : {
                        hotSpot : shapes.data_file_select_menu,
                        events : {
                            mousedown : transition_functions.show_data_file_menu
                        },
                        actionType : 'GUI'
                    },
                    data_format_menu : {
                        hotSpot : shapes.data_format_select_menu,
                        events : {
                            mousedown : transition_functions.show_data_format_menu
                        },
                        actionType : 'GUI'
                    },
                    
                    // tooltips
                    successful_parse_tooltip : {
                        hotSpot : shapes.successful_parse_icon,
                        events : {
                            mouseover : transition_functions.toggle_successful_parse_tooltip,
                            mouseout : transition_functions.toggle_successful_parse_tooltip
                        },
                        actionType : 'GUI'
                    },
                    delete_textfile_tooltip : {
                        hotSpot : shapes.delete_textfile_button,
                        events : {
                            mouseover : transition_functions.toggle_delete_textfile_tooltip,
                            mouseout : transition_functions.toggle_delete_textfile_tooltip
                        },
                        actionType : 'GUI'
                    },
                    new_textfile_tooltip : {
                        hotSpot : shapes.new_textfile_button,
                        events : {
                            mouseover : transition_functions.toggle_new_textfile_tooltip,
                            mouseout : transition_functions.toggle_new_textfile_tooltip
                        },
                        actionType : 'GUI'
                    },
                    regex_search_tooltip : {
                        hotSpot : shapes.regex_search_button,
                        events : {
                            mouseover : transition_functions.toggle_regex_search_tooltip,
                            mouseout : transition_functions.toggle_regex_search_tooltip
                        },
                        actionType : 'GUI'
                    },
                    refresh_stream_tooltip : {
                        hotSpot : shapes.refresh_stream_button,
                        events : {
                            mouseover : transition_functions.toggle_refresh_stream_tooltip,
                            mouseout : transition_functions.toggle_refresh_stream_tooltip
                        },
                        actionType : 'GUI'
                    },
                    link_data_checkbox_tooltip : {
                        hotSpot : shapes.link_data_checkbox,
                        events : {
                            mouseover : transition_functions.toggle_link_data_tooltip,
                            mouseout : transition_functions.toggle_link_data_tooltip
                        },
                        actionType : 'GUI'
                    }
                },
                masks : {}
            },
            data_preview : {
                image : new Slide('widget_data_preview.png'),
                actions : {
                    // tooltips
                    break_link_tooltip : {
                        hotSpot : shapes.break_link_button,
                        events : {
                            mouseover : transition_functions.toggle_break_link_tooltip,
                            mouseout : transition_functions.toggle_break_link_tooltip
                        },
                        actionType : 'GUI'
                    },
                    scroll_link_tooltip : {
                        hotSpot : shapes.scroll_link_button,
                        events : {
                            mouseover : transition_functions.toggle_scroll_link_tooltip,
                            mouseout : transition_functions.toggle_scroll_link_tooltip
                        },
                        actionType : 'GUI'
                    },
                    refresh_stream_tooltip_2 : {
                        hotSpot : shapes.refresh_stream_button_2,
                        events : {
                            mouseover : transition_functions.toggle_refresh_stream_tooltip_2,
                            mouseout : transition_functions.toggle_refresh_stream_tooltip_2
                        },
                        actionType : 'GUI'
                    },
                    advanced_binding_tooltip : {
                        hotSpot : shapes.advanced_binding_link,
                        events : {
                            mouseover : transition_functions.toggle_advanced_binding_tooltip,
                            mouseout : transition_functions.toggle_advanced_binding_tooltip,
                            contextmenu : transition_functions.show_binding_menu_advanced
                        },
                        actionType : 'GUI'
                    },
                    
                    // selection
                    selection_5_data : {
                        hotSpot : shapes.selection_5_data,
                        events : {
                            click : transition_functions.select_5,
                            contextmenu : transition_functions.show_binding_menu_5
                        },
                        actionType : 'Direct Manipulation'
                    },
                    selection_9_data : {
                        hotSpot : shapes.selection_9_data,
                        events : {
                            click : transition_functions.select_9,
                            contextmenu : transition_functions.show_binding_menu_9
                        },
                        actionType : 'Direct Manipulation'
                    },
                    selection_15_data : {
                        hotSpot : shapes.selection_15_data,
                        events : {
                            click : transition_functions.select_15,
                            contextmenu : transition_functions.show_binding_menu_15
                        },
                        actionType : 'Direct Manipulation'
                    },
                    
                    // menus
                    excel_menu : {
                        hotSpot : shapes.excel_menu_button,
                        events : {
                            mousedown : transition_functions.show_excel_menu
                        },
                        actionType : 'GUI'
                    },
                    binding_menu_group : {
                        hotSpot : shapes.group_binding_link,
                        events : {
                            contextmenu : transition_functions.show_binding_menu_15 // binding menu 15 happens to overlap the group, so I double-dip
                        },
                        actionType : 'GUI'
                    }
                },
                masks : {}
            },
            influence : {
                image : new Slide('widget_influence.png'),
                actions : {},
                masks : {}
            }
        }
    },
    rawData : {
        states : {
            hidden : {
                image : no_image,
                actions : {},
                masks : {}
            },
            embedded_data_1 : {
                image : new Slide('embedded_data_1.png'),
                actions : {},
                masks : {}
            },
            someFlowers_csv : {
                image : new Slide('someFlowers_csv.png'),
                actions : {},
                masks : {}
            },
            allFlowers_csv : {
                image : new Slide('allFlowers_csv.png'),
                actions : {},
                masks : {}
            },
            lesMiserables_json : {
                image : new Slide('lesMiserables_json.png'),
                actions : {},
                masks : {}
            }
        }
    },
    selection_5 : {
        states : {
            hidden : {
                image : no_image,
                actions : {},
                masks : {}
            },
            showing : {
                image : new Slide('selection_5.png'),
                actions : {},
                masks : {}
            }
        }
    },
    selection_9 : {
        states : {
            hidden : {
                image : no_image,
                actions : {},
                masks : {}
            },
            showing : {
                image : new Slide('selection_9.png'),
                actions : {},
                masks : {}
            }
        }
    },
    selection_15 : {
        states : {
            hidden : {
                image : no_image,
                actions : {},
                masks : {}
            },
            showing : {
                image : new Slide('selection_15.png'),
                actions : {},
                masks : {}
            }
        }
    },
    selection_5_data : {
        states : {
            hidden : {
                image : no_image,
                actions : {},
                masks : {}
            },
            showing : {
                image : new Slide('selection_5_data.png'),
                actions : {},
                masks : {}
            }
        }
    },
    selection_9_data : {
        states : {
            hidden : {
                image : no_image,
                actions : {},
                masks : {}
            },
            showing : {
                image : new Slide('selection_9_data.png'),
                actions : {},
                masks : {}
            }
        }
    },
    selection_15_data : {
        states : {
            hidden : {
                image : no_image,
                actions : {},
                masks : {}
            },
            showing : {
                image : new Slide('selection_15_data.png'),
                actions : {},
                masks : {}
            }
        }
    },
    dialog : {
        states : {
            hidden : {
                image : no_image,
                actions : {},
                masks : {}
            },
            showing : {
                image : new Slide('dialog.png'),
                actions : {},
                masks : {}
            }
        }
    },
    tooltip : {
        states : {
            hidden : {
                image : no_image,
                actions : {},
                masks : {}
            },
            
            // data_loader tooltips
            successful_parse : {
                image : new Slide('successful_parse_tooltip.png'),
                actions : {},
                masks : {}
            },
            delete_textfile : {
                image : new Slide('delete_textfile_tooltip.png'),
                actions : {},
                masks : {}
            },
            new_textfile : {
                image : new Slide('new_textfile_tooltip.png'),
                actions : {},
                masks : {}
            },
            regex_search : {
                image : new Slide('regex_search_tooltip.png'),
                actions : {},
                masks : {}
            },
            refresh_stream : {
                image : new Slide('refresh_stream_tooltip.png'),
                actions : {},
                masks : {}
            },
            link_data : {
                image : new Slide('link_data_tooltip.png'),
                actions : {},
                masks : {}
            },
            
            // data_preview tooltips
            break_link : {
                image : new Slide('break_link_tooltip.png'),
                actions : {},
                masks : {}
            },
            scroll_link : {
                image : new Slide('scroll_link_tooltip.png'),
                actions : {},
                masks : {}
            },
            refresh_stream_2 : {
                image : new Slide('refresh_stream_tooltip_2.png'),
                actions : {},
                masks : {}
            },
            advanced_binding : {
                image : new Slide('advanced_binding_tooltip.png'),
                actions : {},
                masks : {}
            }
        }
    },
    menu : {
        states : {
            hidden : {
                image : no_image,
                actions : {},
                masks : {}
            },
            data_file : {
                image : new Slide('data_file_menu.png'),
                actions : {
                    release : genericActions.releaseMenu,
                    embedded_data_1 : {
                        hotSpot : shapes.embedded_data_1_menuItem,
                        events : {
                            mouseup : createRawSwitchFunction('embedded_data_1')
                        },
                        actionType : 'GUI'
                    },
                    someFlowers_csv : {
                        hotSpot : shapes.someFlowers_csv_menuItem,
                        events : {
                            mouseup : createRawSwitchFunction('someFlowers_csv')
                        },
                        actionType : 'GUI'
                    },
                    allFlowers_csv : {
                        hotSpot : shapes.allFlowers_csv_menuItem,
                        events : {
                            mouseup : createRawSwitchFunction('allFlowers_csv')
                        },
                        actionType : 'GUI'
                    },
                    lesMiserables_json : {
                        hotSpot : shapes.lesMiserables_json_menuItem,
                        events : {
                            mouseup : createRawSwitchFunction('lesMiserables_json')
                        },
                        actionType : 'GUI'
                    }
                },
                masks : {
                    menu : shapes.data_file_menu_mask
                }
            },
            data_format : {
                image : new Slide('data_format_menu.png'),
                actions : {
                    release : genericActions.releaseMenu
                },
                masks : {
                    menu : shapes.data_format_menu_mask
                }
            },
            excel : {
                image : new Slide('excel_menu.png'),
                actions : {
                    release : genericActions.releaseMenu
                },
                masks : {
                    menu : shapes.excel_menu_mask
                }
            },
            binding_5 : {
                image : new Slide('binding_menu_5.png'),
                actions : {
                    release : genericActions.releaseMenu
                },
                masks : {
                    menu : shapes.binding_menu_5_mask
                }
            },
            binding_9 : {
                image : new Slide('binding_menu_9.png'),
                actions : {
                    release : genericActions.releaseMenu
                },
                masks : {
                    menu : shapes.binding_menu_9_mask
                }
            },
            binding_15 : {
                image : new Slide('binding_menu_15.png'),
                actions : {
                    release : genericActions.releaseMenu
                },
                masks : {
                    menu : shapes.binding_menu_15_mask
                }
            },
            binding_advanced : {
                image : new Slide('binding_menu_advanced.png'),
                actions : {
                    release : genericActions.releaseMenu
                },
                masks : {
                    menu : shapes.binding_menu_advanced_mask
                }
            },
            binding_group : {
                image : new Slide('binding_menu_15.png'),   // double-dipping
                actions : {
                    release : genericActions.releaseMenu
                },
                masks : {
                    menu : shapes.binding_menu_15_mask  // double-dipping
                }
            }
        }
    }
};

config.background.currentState = 'clear';
config.chart.currentState = 'initial';
config.widget.currentState = 'data_preview'; // note to self: if I start with data_preview, rawData needs to start as 'hidden' instead of currentRawFile
config.rawData.currentState = 'hidden'; // currentRawFile
config.dialog.currentState = 'hidden';
config.menu.currentState = 'hidden';
config.tooltip.currentState = 'hidden';
config.selection_5.currentState = 'hidden';
config.selection_9.currentState = 'hidden';
config.selection_15.currentState = 'hidden';
config.selection_5_data.currentState = 'hidden';
config.selection_9_data.currentState = 'hidden';
config.selection_15_data.currentState = 'hidden';

metaActions = {
    
};