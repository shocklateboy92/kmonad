
/*********************** DEBUG OUTPUT ***********************/

print(workspace.clientArea(workspace.MaximizeArea,workspace.activeScreen,workspace.currentDesktop).width);
print(workspace.clientArea(workspace.MaximizeArea,workspace.activeScreen,workspace.currentDesktop).height);

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

    this.addClient = function(pc) {
        if (pc.specialWindow) {
            print("Skipping special window '" + pc.caption + "'");
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
        var index = this.__all_clients[ec.desktop][ec.screen].indexOf(ec);
        if (index !== -1) {
            this.__all_clients[ec.desktop][ec.screen].splice(index, 1);
        }
    }

    this.repopulateList = function() {
        this.__all_clients = [];
        var potentialClients = workspace.clientList();
        for (w in potentialClients) {
            this.addClient(potentialClients[w]);
        }
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
    var remainingClients = clients.slice(0);
    var main = remainingClients.shift();
    print(main.caption);
    mainGeom = geom;
    mainGeom.width = geom.width / 2;
    main.geometry = mainGeom;
    mainGeom.x += mainGeom.width;
    stackVertically(remainingClients, mainGeom);
}

function relayout(screen, desktop) {
    var screenGeom = workspace.clientArea(workspace.MaximizeArea, screen, desktop);

//    tallMode(allClients[desktop], screenGeom);
}

/************************** SET UP **************************/

registerShortcut("Retile Windows",
                 "Force Kmonad to recalculate window positions",
                 "Meta+U",
                 function() {
                     managedClients.repopulateList();
                     relayout(workspace.activeScreen,
                              workspace.currentDesktop);
                 });


/**************** WORK-SPACE SIGNAL HANDLERS ****************/

workspace.clientAdded.connect(function(client) {
    print("Window '" + client.caption + "' added to the workspace");
    managedClients.addClient(client);
});

workspace.clientRemoved.connect(function(client) {
    print("Window '" + client.caption + "' removed from workspace");
    managedClients.removeClient(client);
});

/************************** START ***************************/

var managedClients = new ClientList();
managedClients.repopulateList();
managedClients.printAllClients();
