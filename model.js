var events = require('events');
var clock = 0;
var nodes = [];
var queue = [];
var id = Math.floor(Math.random()*7) + 1;
var ordering = false;
var inCritical = false;
var criticalTime = 500;
var criticalTimeoutId = 0;
var okCounter = Infinity;

exports.eventManager = new events.EventEmitter();
exports.criticalTask = function() {
  console.log('Sekcja krytyczna');
};

var eventManager = exports.eventManager;

eventManager.on('data', function(params) {
  if (Number(params.data.clock) > clock) {
    clock = Number(params.data.clock);
  }
  switch (params.data.type) {
    case 'order':
      if (ordering) {
        queue.push(params);
      } else {
        params.send(JSON.stringify({clock: clock, type: "ok" }));
      }
    break;
    case 'ok':
      okCounter--;
      if (okCounter <= 0) {
        clearTimeout(criticalTimeoutId);
        inCritical = true;

        setTimeout(exports.criticalTask, 0);
        setTimeout(function() {
          inCritical = false;
          clock++;
          eventManager.emit('releaseQueue');
        }, criticalTime);
      }
    break;
  }
});

eventManager.on('addNode', function(node) {
  node.push(node);
};

eventManager.on('requestCritical', function() {
  clock++;
  okCounter = nodes.length;
  ordering = true;
  nodes.forEach(function(node) {
    node.write(JSON.stringify({clock: clock, type: "order"}));
  });
  criticalTimeoutId = setTimeout(function() {
    okCounter = Infinity;
    ordering = false;
  }, criticalTime * (nodes.length + 1) );
});

eventManager.on('releaseQueue', function() {
  nodes.forEach(function(node) {
    node.write(JSON.stringify({clock: clock, type: "ok"}));
  });
});


exports.compareAddresses = function(ip1, port1, ip2, port2 ) {
  ip1n = ip1.split('.');
  ip2n = ip2.split('.');
  ip1n = ip1n.map(function(s) { return Number(s) });
  ip2n = ip2n.map(function(s) { return Number(s) });
  for (var i = 0; i < ip1.length; i++) {
    if (ip1n[i] > ip2n[i])
      return 1;
    if (ip1n[i] < ip2n[i])
      return -1;
  }
  if (Number(port1) > Number(port)) {
    return 1;
  }
  if (Number(port1) < Number(port)) {
    return -1;
  }
  return 0;
}
