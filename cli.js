args = process.argv.slice(2);
exports.port = false;
exports.portNum = 8080;

exports.requestCritical = false;
exports.reqInterval = 5000;
exports.connect = false;
exports.connectAddr = []//'0.0.0.0';
exports.connectPort = []//8080;

exports.testBroadcast = false;
exports.monitor = false;

var i = 0
while (i < args.length)
{
  if (args[i+1])
  {
    switch(args[i])
    {
      case 'port':
        exports.portNum = (args[i+1]+"").search("^\\d+&") != 1 ? args[i+1] : 8080;
        exports.port = (args[i+1]+"").search("^\\d+&") != 1 ? true : false ;
        i++;
      break;
      case 'name':
        exports.name = args[i+1];
    }
  }

  // if (args[i+2] && args[i+1])
  // {
    // switch(args[i])
    // {
      // case 'connect':
        // exports.connectAddr = (args[i+1]+"").search("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$") != 1 ? args[i+1] : '0.0.0.0';
        // exports.connectPort = (args[i+2]+"").search("^\\d+&") != 1 ? args[i+2] : 8080;
        // exports.connect = true;
      // break;
    // }
  // }

  switch (args[i])
  {
    case 'request':
      exports.requestCritical = true;
      if (args[i+1] && !isNaN(Number(args[i+1])) ) {
        exports.reqInterval = Number(args[i+1]) || 1000;
        i++;
      }
    break;
    case 'connect':
        exports.connectAddr.push( (args[i+1]+"").search("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$") != 1 ? args[i+1] : '0.0.0.0');
        exports.connectPort.push( (args[i+2]+"").search("^\\d+&") != 1 ? args[i+2] : 8080);
        exports.connect = true;
        i += 2;
    break;
  }
  i++;
}
