var net = require('net');
var cli = require('./cli.js');
var model = require('./model.js');
var eventManager = model.eventManager;

if (cli.port) {
  model.port = cli.portNum;
}

function main() {
  server = net.createServer(function(socket) {
    //model.nodes.push(socket);
    var remoteAddress = socket.remoteAddress +':' + socket.remotePort;
    //eventManager.emit('addNode', {ip: socket.remoteAddress, port: socket.remotePort});

    socket.on('data', function(json) {
      json = correctJSON(json.toString());
      ////console.log(json + ' ' + socket.remoteAddress + ':' + socket.remotePort);
      json.forEach(function(jsonData) {
        var data = JSON.parse(jsonData);
        eventManager.emit('data', {
          data: data,
          send: function(data) {
            socket.write(data);
          },
          getSender: function() {
            return {ip: socket.remoteAddress, port: socket.remotePort};
          }
        });
      });
    });
    
    socket.on('error', function(e) {
      console.log(remoteAddress + ' disconnected');
    });

  });

  server.on('error', function(e) {
		if (e.code == 'EADDRINUSE') {
			//console.log('\x1b[33;1mAddress in use, retrying...\x1b[0m');
			model.port++;
      setTimeout(function () {
				server.listen(model.port);
			}, 500);
		}
	});


  server.on('listening', function() { //'listening' listener
    //console.log('Address: ' + model.ip + ':' + model.port);
    //console.log('Listening...');

    if (cli.connect) {
      var connect = function(addr, index) {
        var socket = new net.Socket();
        //console.log('Connecting: ' + addr + ':' + cli.connectPort[index]);
        socket.connect(cli.connectPort[index], addr, function() {
          model.nodes.push(socket);
          //console.log('Connected: ' + addr + ':' + cli.connectPort[index]);
          socket.on('data', function(json) {
            json = correctJSON(json.toString());
            ////console.log(json + ' ' + socket.remoteAddress + ':' + socket.remotePort);
            json.forEach(function(jsonData) {
              var data = JSON.parse(jsonData);
              eventManager.emit('data', {
                data: data,
                send: function(data) {
                  socket.write(data);
                },
                getSender: function() {
                  return {ip: socket.remoteAddress, port: socket.remotePort};
                }
              });
            });

          });
        });
        socket.on('error', function(e) {
          if (model.nodes.indexOf(socket) != -1)
            model.nodes.splice(model.nodes.indexOf(socket), 1);
          //console.log(e);
          console.log('Ponawianie...');
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
  server.listen(cli.portNum);
}


function correctJSON(json) {
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
