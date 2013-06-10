
/*********************** DEBUG OUTPUT ***********************/

print(workspace.clientArea(workspace.MaximizeArea,
                           workspace.activeScreen,
                           workspace.currentDesktop).width);
print(workspace.clientArea(workspace.MaximizeArea,
                           workspace.activeScreen,
                           workspace.currentDesktop).height);

/****************** CLIENTS LIST FUNCTIONS ******************/

function ClientList() {
    var __all_clients = [];

    this.printAllClients = function() {
        for (desktop in __all_clients) {
            for (screen in __all_clients[desktop]) {
                for (client in __all_clients[desktop][screen])
                print("\t(" + desktop + "," + screen + "): '" +
                      __all_clients[desktop][screen][client].caption + "'");
            }
        }
    }

    this.shouldIgnore = function(pc) {
        if (!pc.normalWindow) {
            return true;
        }

        // to avoid things like Yakuake
        if (pc.skipPager || pc.skipTaskbar) {
            return true;
        }

        return false;
    }

    this.addClient = function(pc) {
        if (this.shouldIgnore(pc)) {
            print("Ignoring special window '" + pc.caption + "'");
            return;
        } else {
            __get_list(pc.desktop, pc.screen).push(pc);

            var handler = {
                client: pc,
                list: __all_clients,
                prevDesktop: pc.desktop,
                prevScreen: pc.screen,
                updateLocation: function() {
                    var prevList = __get_list(this.prevDesktop,this.prevScreen);
                    var index = prevList.indexOf(this.client);

                    if (index === -1) {
                        print("ERROR: client doesn't exist in previous screen!");
                    } else {
                        prevList.splice(index, 1);
                    }

                    __get_list(this.client.desktop,
                               this.client.screen).push(this.client);

                    relayout(this.prevDesktop, this.prevScreen);
                    __delayed_relayout(this.client.desktop,
                                       this.client.screen);

                    this.prevDesktop = this.client.desktop;
                    this.prevScreen  = this.client.screen;
                }
            };

            pc.desktopChanged.connect(handler, 'updateLocation');
            if (pc.screenChanged !== undefined) {
                // It seems this signal is only available in KWin 4.11
                pc.screenChanged.connect(handler, 'updateLocation');
            }
        }
    }

    // Slight HACK to get around a bug in KWin
    function __delayed_relayout(desktop, screen) {
        var timer = new QTimer();
        timer.interval = 0;
        timer.singleShot = true;
        timer.timeout.connect(function(){
            relayout(desktop, screen);
        });
        timer.start();
    }

    function __get_list(desktop, screen) {
        /* In case this is the first window of desktop/screen,
         * initialize the appropriate sublist.
         */
        if (typeof(__all_clients[desktop]) == 'undefined') {
            __all_clients[desktop] = [];
        }
        if (typeof(__all_clients[desktop][screen]) == 'undefined') {
            __all_clients[desktop][screen] = [];
        }

        return __all_clients[desktop][screen];
    }

    this.removeClient = function(ec) {
        if (this.shouldIgnore(ec)) {
            print("Ignoring special window '" + ec.caption + "'");
            return;
        } else {
            var index = __get_list(ec.desktop, ec.screen).indexOf(ec);
            if (index !== -1) {
                __all_clients[ec.desktop][ec.screen].splice(index, 1);
            }
        }
    }

    this.repopulateList = function() {
        __all_clients = [];
        var potentialClients = workspace.clientList();
        for (w in potentialClients) {
            this.addClient(potentialClients[w]);
        }
    }

    this.clientsToTileOn = function(desktop, screen) {
        var newList = [];

        var clients = __get_list(desktop, screen);

        for (i in clients) {
            var client = clients[i];

            if (!client.minimized) {
                newList.push(client);
            }
        }
        return newList;
    }

    function __current_list() {
        return __get_list(workspace.currentDesktop,
                          workspace.activeScreen);
    }

    this.swapMaster = function() {
        var clients = __current_list();
        var index = clients.indexOf(workspace.activeClient);
        if (index === -1) {
            print("ERROR: Active client not on screen!");
            return;
        }

        if (index !== 0) {
            var prevMaster = clients[0];
            clients[0] = clients[index];
            clients[index] = prevMaster;
        }
    }

    this.moveActive = function(offset) {
        var clients = __current_list();
        var index = clients.indexOf(workspace.activeClient);
        if (index === -1) {
            print("ERROR: Active client not on screen!");
            return;
        }

        var newIndex = index + offset;

        if (newIndex < 0) {
            newIndex += clients.length;
        }
        if (newIndex >= clients.length) {
            newIndex -= clients.length;
        }

        var old = clients[index];
        clients[index] = clients[newIndex];
        clients[newIndex] = old;
    }
}

/********************* TILING FUNCTIONS *********************/

function spiral(clients,geom) {
    if(clients.length > 0) {
        var wnd = clients.shift();
        print(wnd.caption + ":" + wnd.windowRole);
        if (wnd.windowRole !== "panel_1" ) {
            if (geom.width > geom.height) {
                geom.width = (geom.width/2);
                wnd.geometry = geom;
                geom.x = geom.x + wnd.width;
            } else {
                geom.height = (geom.height/2);
                wnd.geometry = geom;
                geom.y = geom.y + wnd.height;
            }
        }
        spiral(clients,geom);
    }
}

function stackVertically(clients, geom) {
    var height = geom.height / clients.length;
    var vOffset = geom.y;

    for (w in clients) {
        geom.y = (height * w) + vOffset;
        geom.height = height;
        clients[w].geometry = geom;
    }
}

function tallMode(clients, geom) {
    if (clients.length === 0) {
        return;
    }
    if (clients.length === 1) {
        clients[0].geometry = geom;
        return;
    }

    var mainClient = clients.shift();

    var mainGeom = geom;
    mainGeom.width = geom.width / 2;

    mainClient.geometry = mainGeom;
    mainGeom.x += mainGeom.width;

    stackVertically(clients, mainGeom);
}

function relayout(desktop, screen) {
    var screenGeom = workspace.clientArea(workspace.MaximizeArea,
                                          screen, desktop);
    var clientsToTile = managedClients.clientsToTileOn(desktop, screen);

    tallMode(clientsToTile, screenGeom);
}

function relayoutAll() {
    for (var desktop = 0; desktop < workspace.desktops; desktop++) {
        for (var screen = 0; screen < workspace.numScreens; screen++) {
            relayout(desktop, screen);
        }
    }
}

/************************** SET UP **************************/

registerShortcut("Retile Windows",
                 "Force Kmonad to recalculate window positions",
                 "Meta+U",
                 function() {
                     managedClients.repopulateList();
                     relayout(workspace.currentDesktop,
                              workspace.activeScreen);
                 });

registerShortcut("Swap Master Window",
                 "Swap the current window with the master window",
                 "Meta+Return",
                 function() {
                     managedClients.swapMaster();
                     relayout(workspace.currentDesktop,
                              workspace.activeScreen);
                 });

registerShortcut("Move Window Up",
                 "Swap current window with the one before it",
                 "Meta+Shift+K",
                 function() {
                     managedClients.moveActive(-1);
                     relayout(workspace.currentDesktop,
                              workspace.activeScreen);
                 });

registerShortcut("Move Window Down",
                 "Swap current window with the one after it",
                 "Meta+Shift+J",
                 function() {
                     managedClients.moveActive(1);
                     relayout(workspace.currentDesktop,
                              workspace.activeScreen);
                 });

/**************** WORK-SPACE SIGNAL HANDLERS ****************/

workspace.clientAdded.connect(function(client) {
    print("Window '" + client.caption + "' added to the workspace");
    managedClients.addClient(client);
    relayout(client.desktop,
             client.screen);
});

workspace.clientRemoved.connect(function(client) {
    print("Window '" + client.caption + "' removed from workspace");
    managedClients.removeClient(client);
    relayout(client.desktop,
             client.screen);
});

workspace.clientMinimized.connect(function(client) {
    relayout(client.desktop, client.screen);
});

workspace.clientUnminimized.connect(function(client) {
    relayout(client.desktop, client.screen);
});

/************************** START ***************************/

var managedClients = new ClientList();
managedClients.repopulateList();
managedClients.printAllClients();
