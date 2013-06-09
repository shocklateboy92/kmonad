
/*********************** DEBUG OUTPUT ***********************/

print(workspace.clientArea(workspace.MaximizeArea,
                           workspace.activeScreen,
                           workspace.currentDesktop).width);
print(workspace.clientArea(workspace.MaximizeArea,
                           workspace.activeScreen,
                           workspace.currentDesktop).height);

/****************** CLIENTS LIST FUNCTIONS ******************/

function ClientList() {
    this.__all_clients = [];

    this.printAllClients = function() {
        for (desktop in this.__all_clients) {
            for (screen in this.__all_clients[desktop]) {
                for (client in this.__all_clients[desktop][screen])
                print("\t(" + desktop + "," + screen + "): '" +
                      this.__all_clients[desktop][screen][client].caption +
                      "'");
            }
        }
    }

    this.shouldIgnore = function(pc) {
        if (pc.specialWindow) {
            return true;
        }

        return false;
    }

    this.addClient = function(pc) {
        if (this.shouldIgnore(pc)) {
            print("Ignoring special window '" + pc.caption + "'");
            return;
        } else {
            /* In case this is the first window of desktop/screen,
             * initialize the appropriate sublist.
             */
            if (typeof(this.__all_clients[pc.desktop]) == 'undefined') {
                this.__all_clients[pc.desktop] = [];
            }
            if (typeof(this.__all_clients[pc.desktop][pc.screen]) == 'undefined') {
                this.__all_clients[pc.desktop][pc.screen] = [];
            }

            this.__all_clients[pc.desktop][pc.screen].push(pc);
        }
    }

    this.removeClient = function(ec) {
        if (this.shouldIgnore(ec)) {
            print("Ignoring special window '" + ec.caption + "'");
            return;
        } else {
            var index = this.__all_clients[ec.desktop][ec.screen].indexOf(ec);
            if (index !== -1) {
                this.__all_clients[ec.desktop][ec.screen].splice(index, 1);
            }
        }
    }

    this.repopulateList = function() {
        this.__all_clients = [];
        var potentialClients = workspace.clientList();
        for (w in potentialClients) {
            this.addClient(potentialClients[w]);
        }
    }

    this.clientsToTileOn = function(desktop, screen) {
        var newList = [];
        for (i in this.__all_clients[desktop][screen]) {
            var client = this.__all_clients[desktop][screen][i];

            if (!client.minimized) {
                newList.push(client);
            }
        }
        return newList;
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

    mainGeom = geom;
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

/************************** SET UP **************************/

registerShortcut("Retile Windows",
                 "Force Kmonad to recalculate window positions",
                 "Meta+U",
                 function() {
                     managedClients.repopulateList();
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
