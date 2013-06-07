

print(workspace.clientArea(workspace.MaximizeArea,workspace.activeScreen,workspace.currentDesktop).width);
print(workspace.clientArea(workspace.MaximizeArea,workspace.activeScreen,workspace.currentDesktop).height);

registerShortcut("Retile Windows", "Forces Kmonad to recalculate window positions", "Meta+U", function() {
    printList();
    relayout(workspace.activeScreen,workspace.currentDesktop);
});

function printList() {
    print("Layout List");
    for (d in allClients) {
        for (e in allClients[d]) {
            print (d + " : " + allClients[d][e].caption);
        }
    }
}

var potentialClients = workspace.clientList();
var allClients = [];
for (w in potentialClients) {
    addNewClient(potentialClients[w]);
}

printList();

workspace.clientMinimized.connect(function() {

});



workspace.clientAdded.connect(function(client) {
    print("Window '" + client.caption + "' added to the workspace");
    addNewClient(client);
});

workspace.clientRemoved.connect(function(client) {
    print("Window '" + client.caption + "' removed from workspace");
    removeClient(client);
});

function addNewClient(pc) {
    if (pc.specialWindow) {
        print("Skipping special window '" + pc.caption + "'");
        return;
    } else {
        if (typeof(allClients[pc.desktop]) == 'undefined') {
            allClients[pc.desktop] = [];
        }
        allClients[pc.desktop].push(pc);
        printList();
    }
}

function removeClient(ec) {
    var index = allClients[ec.desktop].indexOf(ec);
    if (index !== -1) {
        allClients[ec.desktop].splice(index, 1);
    }
}

function relayout(screen, desktop) {
    var screenGeom = workspace.clientArea(workspace.MaximizeArea, screen, desktop);

//    tallMode(allClients[desktop], screenGeom);
}

// function spiral(clients,geom) {
//     if(clients.length > 0) {
//         var wnd = clients.shift();
//         print(wnd.caption + ":" + wnd.windowRole);
//         if (wnd.windowRole != "panel_1" ) {
//             if (geom.width > geom.height) {
//                 geom.width = (geom.width/2);
//                 wnd.geometry = geom;
//                 geom.x = geom.x + wnd.width;
//             } else{
//                 geom.height = (geom.height/2);
//                 wnd.geometry = geom;
//                 geom.y = geom.y + wnd.height;
//             }
//         }
//         spiral(clients,geom);
//     }
// }
// // spiral(clients, screenGeom);
//
// //tallMode(clients, screenGeom);


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

function stackVertically(clients, geom) {
    var height = geom.height / clients.length;
    var vOffset = geom.y;

    for (w in clients) {
        geom.y = (height * w) + vOffset;
        geom.height = height;
        clients[w].geometry = geom;
    }
}
