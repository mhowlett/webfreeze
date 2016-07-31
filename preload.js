
function getDisplayType (element) {
    // CharacterData.
    if (!(element instanceof HTMLElement)) {
      return 'not element';
    }
    var cStyle = element.currentStyle || window.getComputedStyle(element, ""); 
    return cStyle.display;
}

function traverse(node, parentBoundingRect) {
  if (!node.childNodes) {
    return;
  }
  
  var hasBlockChild = function() {
    for (var i=0; i<node.childNodes.length; ++i) {
      if (getDisplayType(node.childNodes[i]) === 'block') {
        return true;
      }
    }
    return false;
  }
  
  var newChildren = [];
  for (var i=0; i<node.childNodes.length; ++i) {
    var n = node.childNodes[i];

    if (n.getBoundingClientRect) {
      var br = n.getBoundingClientRect();
      var newNode = n.cloneNode(false);
      var disp = getDisplayType(n);
      
      if (disp === 'inline' || disp === 'inline-block') {
        // nothing?
      }
      else if (disp === 'none') {
        // scripts end up here.
        // definitely nothing.
      }
      else if (disp === 'block') {
        newNode.style.position = 'absolute';
        newNode.style.left = (br.left - parentBoundingRect.left) + 'px';
        newNode.style.top = (br.top - parentBoundingRect.top) + 'px';
        newNode.style.width = br.width + 'px';
        newNode.style.height = br.height + 'px';
        newNode.style.margin = '0';
        newNode.style.display = 'block';
      } 
      else {
        console.log("unknown display type: " + disp)
      }
      
      if (disp !== 'none') {
        var cldn = traverse(n, br);
        for (var j=0; j<cldn.length; ++j) {
          newNode.appendChild(cldn[j]);
        }
        newChildren.push(newNode);
      }
    }
    else {
      if (hasBlockChild()) {
        var newnode = document.createElement('div');
        newnode.appendChild(n.cloneNode(false));
        newChildren.push(newnode);
      }
      else {
        newChildren.push(n.cloneNode(false));
      }
    }
  }
  
  return newChildren;
}

var lastOver = null;

var overlays = [];

function mouseMoveHandler(ev) {

  if (ev.buttons === 1) {
    // dragging.
    for (var i=0; i<4; ++i) {
      overlays[i].style.display = 'none';
    }
    
    var dx = ev.clientX - lastX;
    var dy = ev.clientY - lastY;
    lastX = ev.clientX;
    lastY = ev.clientY;
    
    if (lastOver !== null) {
      if (lastOver.getBoundingClientRect) {
        var currentLeft = parseFloat(lastOver.style.left.substring(0, lastOver.style.left.length-2));
        var currentTop = parseFloat(lastOver.style.top.substring(0, lastOver.style.top.length-2));
        lastOver.style.left = (currentLeft + dx) + 'px';
        lastOver.style.top = (currentTop + dy) + 'px';
      }
    }
    
    ev.preventDefault();
    return;
  }
  
  var x = ev.clientX, y = ev.clientY,
  el = document.elementFromPoint(x, y);
  if (el !== lastOver) {
    if (el === null) {
      for (var i=0; i<4; ++i) {
        overlays[i].style.display = 'none';
      }    
      ev.preventDefault();
      return;
    }
    if (el.getBoundingClientRect) {
      lastOver = el;
      var br = el.getBoundingClientRect();
      for (var i=0; i<4; ++i) {
        overlays[i].style.display = 'block';
      }
      overlays[0].style.left = (br.left-2) + 'px';
      overlays[0].style.top = (br.top-2) + 'px';
      overlays[0].style.height = (br.height+4) + 'px';
      overlays[0].style.width = 2 + 'px';
      
      overlays[1].style.left = br.right + 'px';
      overlays[1].style.top = (br.top-2) + 'px';
      overlays[1].style.height = (br.height+4) + 'px';
      overlays[1].style.width = 2 + 'px';
      
      overlays[2].style.left = br.left + 'px';
      overlays[2].style.top = (br.top-2) + 'px';
      overlays[2].style.height = 2 + 'px';
      overlays[2].style.width = br.width + 'px';  
      
      overlays[3].style.left = br.left + 'px';
      overlays[3].style.top = br.bottom + 'px';
      overlays[3].style.height = 2 + 'px';
      overlays[3].style.width = br.width + 'px';
    }
  }
  ev.preventDefault();
}

var lastX;
var lastY;
function mouseDownHandler(ev) {
  lastX = ev.clientX;
  lastY = ev.clientY;
}

function mouseUpHandler(ev) {
}

require('electron').ipcRenderer.on('freezeDocument', function(event) {
  
  document.body.removeEventListener('mousemove', mouseMoveHandler, true);

  var bodyChildren = traverse(
    document.body, 
    { left: 0, top: 0, width: 1000, height: 1000 }
  );
  
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }

  for (var i=0; i<bodyChildren.length; ++i) {
    var node = bodyChildren[i];
    document.body.appendChild(node);
  }
  
  console.log(document.body);
  
    
  overlays = [];
  for (var i=0; i<4; ++i) {
    var overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.display = 'none';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    overlay.pointerEvents = 'none';
    document.body.appendChild(overlay);
    overlays.push(overlay);
  }
  
  document.body.addEventListener('mousemove', mouseMoveHandler, true);
  document.body.addEventListener('mousedown', mouseDownHandler, true);
  document.body.addEventListener('mouseup', mouseUpHandler, true);
});
