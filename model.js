var events = require('events');
var clock = 0;
var nodes = [];

exports.eventManager = new events.EventEmitter();

var eventManager = exports.eventManager;

eventManager.on('data', function() {

});

function addNode(node) {
  node.push(node);
};
