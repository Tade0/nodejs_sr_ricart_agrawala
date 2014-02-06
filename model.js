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
var okNodes = [];

exports.ip = "127.0.0.1";
exports.port = 8000;
exports.eventManager = new events.EventEmitter();
exports.criticalTask = function() {
  console.log('\x1b[34;1mEntering section');
};
var eventManager = exports.eventManager;


eventManager.on('data', function(params) {
  var sender = params.getSender();
  switch (params.data.type) {
    case 'order':
      var sendOk = true;
      if (inCritical) {
        console.log('Deferring ' + params.getSender().ip);
        queue.push(params);
        sendOk = false;
      }
      if (ordering) {
        if (Number(params.data.clock) > clock) {
          sendOk = false;
          console.log('Deferring ' + params.getSender().ip);
          queue.push(params);
        }
        if (Number(params.data.clock) == clock) {
          var sender = params.getSender();
          if (exports.compareAddresses(sender.ip, sender.port, exports.ip, exports.port) == -1) {
            sendOk = false;
            console.log('Deferring ' + params.getSender().ip);
            queue.push(params);
          }
        }
      }
      if (sendOk === true) {
        debugger;
        var node = nodes.filter(function(n) { console.log(n.remoteAddress); return n.remoteAddress == sender.ip; })[0];
        if (node) {
          console.log('Sending message to: ' + node.remoteAddress + "\n" + JSON.stringify({clock: clock, type: "ok" }));
          node.write(JSON.stringify({clock: clock, type: "ok" }));
        } else {
          console.log('trouble: ' + sender.ip + ' ' + sender.port + ' ' + sender.lip + ' ' + sender.lp);
        }
      }
    break;
    case 'ok':
      okCounter--;
      okNodes.splice(okNodes.indexOf(params.getSender().ip),1);
      var log = 'Waiting for:';
      okNodes.forEach(function(node) {
        log += ' ' + node;
      });
      if (okNodes.length > 0) {
        console.log(log);
      } else {
        console.log(log + ' nobody');
      }
      if (okNodes.length == 0) {
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
  ordering = true;
  okNodes = [];
  nodes.forEach(function(node) {
    okNodes.push(node.remoteAddress);
    console.log('Sending message to: ' + node.remoteAddress + "\n" + JSON.stringify({clock: clock, type: "order"}));
    node.write(JSON.stringify({clock: clock, type: "order"}));
  });

  clearTimeout(criticalTimeoutId);
  criticalTimeoutId = setTimeout(function() {
    okCounter = Infinity;
    ordering = false;
  }, criticalTime * (nodes.length + 1) );
});


eventManager.on('releaseQueue', function() {
  console.log('Leaving section\x1b[0m');
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
