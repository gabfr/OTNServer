var net = require('net');
var NetworkMessage = require('./../lib/networkmessage');

var gamePort = 7172;
function GameServer() {
    this.onDataReceive = (function(self) {
        return function(mBuf) {
            // look at: http://nodejs.org/api/buffer.html
            // TODO: implement encryption things
            var msg = new NetworkMessage(mBuf);
        };
    })(this);
    
    this.onConnect = (function(self) {
        return function() {
            console.log('First byte.');
        };
    })(this);
    
    this.onEnd = (function(self) {
        return function() {
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
        };
    })(this);
}

var mGame = new GameServer();

var gameServer = net.createServer();
gameServer.listen({port: gamePort}, mGame.Listen);