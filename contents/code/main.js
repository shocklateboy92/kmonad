

print(workspace.clientArea(workspace.MaximizeArea,workspace.activeScreen,workspace.currentDesktop).width);
print(workspace.clientArea(workspace.MaximizeArea,workspace.activeScreen,workspace.currentDesktop).height);

registerShortcut("Retile Windows", "Forces Kmonad to recalculate window positions", "Meta+U", function() {
  print("cvg");
  relayout(workspace.activeScreen,workspace.currentDesktop);
});

function relayout(screen,desktop){
var screenGeom =workspace.clientArea(workspace.MaximizeArea,screen,desktop);
var potentialClients = workspace.clientList();
var clients = new Array();
  for (w in potentialClients){
    if (!potentialClients[w].specialWindow &&
        potentialClients[w].desktop == workspace.currentDesktop) {
        clients.push(potentialClients[w]);
    } else {
        print("Skipping special window '" + potentialClients[w].caption + "'");
    }
  }
  tallMode(clients,screenGeom);
}

function spiral(clients,geom){
    if(clients.length > 0){
        var wnd = clients.shift();
        print(wnd.caption + ":" + wnd.windowRole);
        if (wnd.windowRole != "panel_1" ){
            if (geom.width > geom.height){
                geom.width = (geom.width/2);
                wnd.geometry = geom;
                geom.x = geom.x+wnd.width;
            } else{
                geom.height = (geom.height/2);
                wnd.geometry = geom;
                geom.y = geom.y+wnd.height;
            }
        }
        spiral(clients,geom);
    }
}
// spiral(clients, screenGeom);

//tallMode(clients, screenGeom);


function tallMode(clients, geom) {
    var main = clients.shift();
    print(main.caption);
    mainGeom = geom;
    mainGeom.width = geom.width / 2;
    main.geometry = mainGeom;
    mainGeom.x += mainGeom.width;
    stackVertically(clients, mainGeom);
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
