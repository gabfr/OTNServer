var net = require('net');
var NetworkMessage = require('./../lib/networkmessage');
var Adler = require('./../lib/adler');
var gamePort = 7171;
function GameServer() {
    this.onDataReceive = (function(self) {
        return function(mBuf) { // Socket environment.
            // look at: http://nodejs.org/api/buffer.html
            // TODO: implement encryption things
            console.log('Packet encrypted received!');
            //var msg = new NetworkMessage(mBuf);
            
            // ON LOGIN
            var msg = new NetworkMessage();
            msg.m_MsgBuf = mBuf;
            var packSize = msg.DecodeHeader();
            if (packSize <= 0 || packSize >= msg.NETWORKMESSAGE_MAXSIZE - 16) {
                console.log('Packet with wrong size! Possibly attack?');
            }
            console.log('Packet size: ' + packSize);
            if (msg.Checksum()) {
                console.log('ok!');
            } else {
                console.log('n');
            }
        };
    })(this);
    
    this.onConnect = (function(self) {
        return function() { // Socket environment.
            console.log('First byte.');
        };
    })(this);
    
    this.onEnd = (function(self) {
        return function() { // Socket environment.
            console.log('Connection closed.');
        };
    })(this);
    
    this.ConnectionHandler = (function(self) {
        return function(mSocket) {
            mSocket.on('connect', self.onConnect);
            mSocket.on('data', self.onDataReceive);
            mSocket.on('end', self.onEnd);
            //look at: http://nodejs.org/api/net.html
        };
    })(this);
    
    this.Listen = (function(self) {
        return function() {
            this.on('connection', self.ConnectionHandler);
            var addr = this.address();
            console.log('Game Server listening on: ' + addr.address + ':' + addr.port);
        };
    })(this);
}

var mGame = new GameServer();

var gameServer = net.createServer();
gameServer.listen(gamePort, mGame.Listen);