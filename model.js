var events = require('events');
var clock = 0;
exports.nodes = [];
var nodes = exports.nodes;
var queue = [];
var id = Math.floor(Math.random()*7) + 1;
var ordering = false;
var inCritical = false;
var criticalTime = 2500;
var criticalTimeoutId = 0;
var okCounter = Infinity;

exports.ip = "127.0.0.1";
exports.port = 8000;
exports.eventManager = new events.EventEmitter();
exports.criticalTask = function() {
  console.log('Sekcja krytyczna');
};
var eventManager = exports.eventManager;


eventManager.on('data', function(params) {
  var sender = params.getSender();
  switch (params.data.type) {
    case 'order':
      //console.log('order: ' + sender.ip + ':' + sender.port);
      var sendOk = true;
      if (inCritical) {
        queue.push(params);
        sendOk = false;
      }
      if (ordering) {
        if (Number(params.data.clock) > clock) {
          sendOk = false;
          queue.push(params);
          console.log(clock + '\t' + params.data.clock + ' queue');
        }
        if (Number(params.data.clock) == clock) {
          var sender = params.getSender();
          if (exports.compareAddresses(sender.ip, sender.port, exports.ip, exports.port) == -1) {
            sendOk = false;
          }
        }
      }
      if (sendOk === true) {
        console.log(clock + '\t' + params.data.clock + '\tyield: ' + sender.ip + ':' + sender.port);
        params.send(JSON.stringify({clock: clock, type: "ok" }));
      }
    break;
    case 'ok':
      okCounter--;
      console.log('collecting: ' + sender.ip + ':' + sender.port + ', counter:' + okCounter);
      if (okCounter <= 0) {
        clearTimeout(criticalTimeoutId);
        inCritical = true;
        ordering = false;
        setTimeout(exports.criticalTask, 0);
        setTimeout(function() {
          inCritical = false;
          clock++;
          eventManager.emit('releaseQueue');
        }, criticalTime);
      }
    break;
  }
  clock = Math.max(clock, Number(params.data.clock))
});


eventManager.on('addNode', function(node) {
  node.push(node);
});


eventManager.on('requestCritical', function() {
  if (inCritical || 0 === nodes.length || ordering)
    return;
  clock++;
  okCounter = nodes.length;
  console.log('counter: ' + okCounter);
  ordering = true;
  console.log(clock + '\tProsba o wejscie do sekcji...');
  nodes.forEach(function(node) {
    node.write(JSON.stringify({clock: clock, type: "order"}));
  });
  clearTimeout(criticalTimeoutId);
  criticalTimeoutId = setTimeout(function() {
    console.log('Albo nieważne...');
    okCounter = Infinity;
    ordering = false;
  }, criticalTime * (nodes.length + 1) );
});


eventManager.on('releaseQueue', function() {
  queue.forEach(function(item) {
    eventManager.emit('data', item);
  });
  queue = [];
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
  if (Number(port1) > Number(port2)) {
    return 1;
  }
  if (Number(port1) < Number(port2)) {
    return -1;
  }
  return 0;
}
