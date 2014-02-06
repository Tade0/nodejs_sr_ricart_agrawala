var net = require('net');
var cli = require('./cli.js');
var model = require('./model.js');
var eventManager = model.eventManager;
var inputBuffers = {};

if (cli.port) {
  model.port = cli.portNum;
}

function main() {
  server = net.createServer(function(socket) {
    var remoteAddress = socket.remoteAddress +':' + socket.remotePort;
    //eventManager.emit('addNode', {ip: socket.remoteAddress, port: socket.remotePort});
    socket.on('data', function(json) {
      console.log('Received message from: ' + socket.remoteAddress + "\n" + json);
      json = correctJSON(json.toString(), socket.remoteAddress );
      json.forEach(function(jsonData) {
        var data = JSON.parse(jsonData);
        eventManager.emit('data', {
          data: data,
          send: function(data) {
            console.log('Sending message to: ' + socket.remoteAddress + "\n" + data);
            socket.write(data);
          },
          getSender: function() {
            return {lip: socket.localAddress, ip: socket.remoteAddress, port: socket.remotePort, lp: socket.localPort};
          }
        });
      });
    });
    
    socket.on('error', function(e) {
    });

  });

  server.on('error', function(e) {
		if (e.code == 'EADDRINUSE') {
			model.port++;
      setTimeout(function () {
				server.listen(model.port);
			}, 500);
		}
	});

  server.on('listening', function() {

    if (cli.connect) {
      var connect = function(addr, index) {
        var socket = new net.Socket();
        socket.connect(cli.connectPort[index], addr, function() {
          model.nodes.push(socket);
          socket.on('data', function(json) {
            console.log('Received message from: ' + socket.remoteAddress + "\n" + json);
            json = correctJSON(json.toString(), socket.remoteAddress);
            json.forEach(function(jsonData) {
              var data = JSON.parse(jsonData);
              eventManager.emit('data', {
                data: data,
                send: function(data) {
                  console.log('Sending message to: ' + socket.remoteAddress + "\n" + data);
                  socket.write(data);
                },
                getSender: function() {
                  return {lip: socket.localAddress, ip: socket.remoteAddress, port: socket.remotePort, lp: socket.localPort};
                }
              });
            });

          });
        });
        socket.on('error', function(e) {
          if (model.nodes.indexOf(socket) != -1)
            model.nodes.splice(model.nodes.indexOf(socket), 1);
          setTimeout(function() {connect(addr, index); }, 1500 + Math.random()*5000);
        });
      }
      cli.connectAddr.forEach(connect);
    }
    
    if (cli.requestCritical) {
      setInterval(function () {
        eventManager.emit('requestCritical');
      }, (Math.random()*0.5+0.5)*cli.reqInterval);
    }
  });

  if (cli.address) {
    server.listen(cli.portNum, cli.address);
  } else {
    server.listen(cli.portNum);
  }
}

function correctJSON(json, address) {
  if (!inputBuffers[address])
    inputBuffers[address] = '';
  inputBuffers[address] += json;
  var match = inputBuffers[address].search('}');
  if ( match != -1 /*.match(/\{[^.\n]*\}/g)*/ ) {
    match = inputBuffers[address].substr(0, match + 1);
    inputBuffers[address] = inputBuffers[address].substr(match.length);
    return [match];
  } else {
    return [];
  }

  var result = [];
  if ( json.search("}{") > -1 )
  {
    while ( ( frameBreak = json.search("}{") ) > -1 )
    {
      jsonChunk = json.substr(0,frameBreak+1);
      json = json.substr(frameBreak+1);
      jsonChunk = jsonChunk.replace(/(\w+):/,'"$1":').replace(/(\w+)\:/,'"$1":').replace(/\}.*/,'}');
      result.push(jsonChunk);
    }
  }
  json = json.replace(/(\w+):/,'"$1":').replace(/(\w+)\:/,'"$1":').replace(/\}.*/,'}');
  result.push(json);
  return result;
}

main();
