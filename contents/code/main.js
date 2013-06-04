

var clients = workspace.clientList(); 
print(clients[0].caption);

print(workspace.clientArea(workspace.MaximizeArea,workspace.activeScreen,workspace.currentDesktop).width);
print(workspace.clientArea(workspace.MaximizeArea,workspace.activeScreen,workspace.currentDesktop).height);
var screenGeom = 
workspace.clientArea(workspace.MaximizeArea,workspace.activeScreen,workspace.currentDesktop);

for (w in clients){
  if (clients[w].windowRole == "panel_1" ){
    print("removing: " + clients[w].caption)
    clients.splice(w,1); 
  }
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
      }else{
	geom.height = (geom.height/2);
	wnd.geometry = geom;
	geom.y = geom.y+wnd.height;
      }
    } 
    spiral(clients,geom);
  }
}
// spiral(clients, screenGeom);

 tallMode(clients, screenGeom);


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

  for (w in clients) {
    geom.y = height * w;
    geom.height = height;
    
    clients[w].geometry = geom;
  }
}
