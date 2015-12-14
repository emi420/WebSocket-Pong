(function () {

  "use strict";

  var Socket = function(options) {
    var self = this,
      socket,
      connectionId = options.connectionId || "none"

    socket = self.socket = new WebSocket("ws://" + options.host + ":" + options.port);

    self.isOpen = false;

    socket.onopen = function() {
       console.log("Connected!");
       self.isopen = true;
    }
    socket.onclose = function(e) {
       console.log("Connection closed.");
       socket = null;
       self.isopen = false;
    }

  }

  Socket.prototype = {
    send: function(data) {
        console.log("send :" + data)
        var self = this;
        if (self.isopen) {
           self.socket.send(data);
        } else {
           console.log("Connection not opened.");
        }
     }
  }

  window.Socket = Socket;

}());

