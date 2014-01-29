var net = require('net');
var cli = require('cli.js');
var model = require('model.js');
var eventManager = model.eventManager;

function main() {
  var server = net.createServer(function(socket) {

    addSocket(socket);
    socket.on('data', function(json) {
      var data = JSON.parse(json);
      model.eventManager.emit('data', {data: data});
    });

  });

  server.listen(cli.portNum), function() { //'listening' listener
    console.log('Running...');
  });
}

main();
