var net = require('net');
var cli = require('cli.js');
var model = require('model.js');
var eventManager = model.eventManager;

function main() {
  var port = 8000;
  var server = net.createServer(function(socket) {
    eventManager.emit('addNode', socket);

    socket.on('data', function(json) {
      json = correctJSON(json);
      var data = JSON.parse(json);
      model.eventManager.emit('data', {
        data: data,
        send: function(data) {
          socket.write(data);
        },
        getSender: function() {
          return {address: socket.remoteAddress, port: socket.remotePort};
        }
      });
    });

  });

  server.on('error', function(e) {
		if (e.code == 'EADDRINUSE') {
			console.log('\x1b[33;1mAddress in use, retrying...\x1b[0m');
			port++;
			setTimeout(function () {
				server.listen(port);
			}, 100);
		}
	});

  server.listen(cli.portNum), function() { //'listening' listener
    console.log('Running...');
  });
}

function correctJSON(json) {
  return json.replace(/(\w+):/,'"$1":').replace(/(\w+)\:/,'"$1":');
}

main();
