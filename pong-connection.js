(function () {

 "use strict";

 var PongConnection = function(options, pongOptions, Pong) {
    var self = this;
    self.isServer = options.isServer;
    self.connectionId = options.connectionId || ""
    self.socket = new Socket({
      host: options.host,
      port: options.port,
      connectionId: self.connectionId
    })
    pongOptions.isServer = self.isServer;
    self.pong = new Pong(pongOptions);
    PongConnection.init(self);
 }

 PongConnection.prototype = {
    connectionId: ""
 }

 PongConnection.init = function(self) {

    var pong = self.pong,
      pongSocket = self.socket;

    pong.on("refreshplayer", function() {
      var dataToSend;
      if (self.isServer) {
       dataToSend = {
        player1: {
          x: pong.players[0].x
        }
       }
      } else {
       dataToSend = {
        player2: {
          x: pong.players[1].x
       }
      }
      }
      dataToSend.connectionId = self.connectionId 
      pongSocket.send( 
        JSON.stringify(
          dataToSend
        )
      )
    });

    pong.on("pauseorplay", function() {
      pongSocket.send(
        JSON.stringify({
          paused: pong.paused,
          connectionId: self.connectionId
        })
      )
    })

    pong.on("changescore", function(playernumber) {
      pongSocket.send(
        JSON.stringify({
          changescore: playernumber,
          connectionId: self.connectionId
        })
      )
    })

    if (self.isServer) {
      pong.on("refreshball", function() {
        pongSocket.send(
          JSON.stringify({
            ball: {
              x: pong.ball.x,
              y: pong.ball.y
            },
            connectionId: self.connectionId
          })
        )
      })            
    }

    pongSocket.socket.addEventListener("message",  function(e) {
      //console.log(e.data)
       var data = JSON.parse(e.data)
       if ("player1" in data) {
         pong.players[0].setX(data.player1.x);
         pong.refreshPlayerX(pong.players[0]);
       } else if ("player2" in data) {
         pong.players[1].setX(data.player2.x);
         pong.refreshPlayerX(pong.players[1]);
       } else if ("paused" in data) {
         pong.pause();
       } else if ("changescore" in data) {
         pong.score.point(data.changescore);
         pong.refreshScore();
       } else if ("ball" in data) {
         pong.ball.setXY({
            x: data.ball.x,
            y: data.ball.y
         })
         pong.refreshBall();
       } else if ("hello" in data) {
          console.log(data)
          if (!self.isServer) {
            pongSocket.send(
              JSON.stringify({
                registerId: self.connectionId,
              })
            )
          } else {
            document.getElementById("connectionId").value = data.hello;
            self.connectionId = data.hello; 
          }
       }
    })



  }

  window.PongConnection = PongConnection;


}());

