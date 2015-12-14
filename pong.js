(function () {

 "use strict";

  var Player,
    Ball,
    Field,
    Pong,
    Score,
    Events;

  Score = function(options) {
    this.el = options.el;
    return this;
  }

  Score.prototype = {
    playersScore: [0,0],
    point: function(player) {
      this.playersScore[player]++
    },
    getPlayer: function(player) {
      return this.playersScore[player]
    },
    reset: function() {
      this.playersScore = [0,0]
    }
  }

  Field = function(options) {
    this.w = options.el.offsetWidth ;
    this.h = options.el.offsetHeight;
    this.el = options.el;
    this.center = {
      x: this.w / 2,
      y: this.h / 2,        
    }
    return this;
  }

  Player = function(options) {
    this.el = options.el;
    this.w = options.el.offsetWidth ;
    this.h = options.el.offsetHeight;
    return this;
  }

  Player.prototype = {
    setXY: function(x,y) {
      this.x = x;
      this.y = y;
    },
    setX: function(x) {
      this.x = x;
    },
    moveLeft: function() {
      if (this.x - 10 > 0) {
        this.x -= 10;
        Events.fire("refreshplayer", {});
      }
    },
    moveRight: function(limit) {
      if (this.x + this.w + 10 < limit) {
        this.x += 10;
        Events.fire("refreshplayer", {});
      }
    },

  }

  Ball = function(options) {
    var self = this;
    self.el = options.el
    self.setXY({x: options.x, y:options.y})
    self.directionX = 1;
    self.directionY = 1;
    self.resetAngle();
    self.resetVelocity();

    return self;
  }
  
  Ball.prototype = {
    setXY: function(xy) {
      this.x = xy.x;
      this.y = xy.y;
    },

    calculateAngle: function(collisionObject) {
      var angle = -((collisionObject.x + collisionObject.w/2 - this.x)/100);
      return angle
    },
    updatePosition: function() {
      this.setXY({
        x: this.x + this.velocity * this.angle,
        y: this.y + this.velocity * this.directionY,
      })
    },
    resetAngle: function() {
      this.angle = 0
    },
    resetVelocity: function() {
      this.velocity = 5
    },
    invertDirectionY: function() {
      this.directionY = this.directionY * -1;
    },
    invertDirectionX: function() {
      this.angle = -this.angle
    },
              
  }

  var Point = function(container, x, y, color) {
    var el = document.createElement("div");
    el.setAttribute("class", "point");
    container.appendChild(el);
    this.el = el;
    this.x = x;
    this.y = y;
    this.el.style.left = x + "px";
    this.el.style.top = y + "px";
    this.el.style.background = color ||"blue" ;
    Point.points.push(el)
    return this
  }

  Pong = function(options) {
    Pong.setEventListeners(this);
    this.isServer = options.isServer;
    this.field = Pong.createField(this, options.fieldElement);
    this.ball = Pong.createBall(this, options.ballElement);
    this.players = Pong.createPlayers(this, options.player1Element, options.player2Element);
    this.currentPlayer = Pong.setCurrentPlayer(this);
    this.score = Pong.createScore(this, options.scoreElement);
    this.refreshScore();
    this.refreshBall();
    this.pause();
    return this;
  }

  Pong.setEventListeners = function(self) {
      window.addEventListener("keydown", function(e) {
          self.keydown(e.keyCode);
      });
  }  
  Pong.createScore = function(self, scoreElement) {
    return new Score({
      el: scoreElement
    });  
  }  
  Pong.createField = function(self, fieldElement) {
    return new Field({
      el: fieldElement
    });  
  }
  Pong.createBall = function(self, ballElement) {
    var position = self.field.center;
    return new Ball({
      x: position.x,
      y: position.y,
      el: ballElement
    })
  }
  Pong.createPlayers = function(self, player1Element, player2Element) {
    var players = [];
    players.push(new Player({
      el: player1Element
    }));
    players.push(new Player({
      el: player2Element
    }));

    players[0].setXY(self.field.w  / 2 - players[0].w/2, self.field.h - players[0].h - 10);
    players[1].setXY(self.field.w  / 2 - players[1].w/2, 10);

    self.refreshPlayers(players);
    return players;
  }
  Pong.setCurrentPlayer = function(self) {
    if (self.isServer) {
      return self.players[0]
    } else {
      return self.players[1]
    } 
  }

  Pong.prototype = {

    paused: false,

    onRefresh: [],
    onPauseOrPlay: [],
    onRefreshBall: [],

    play: function() {
      this.paused = false;
    },

    pause: function() {
      this.paused = true;
    },

    playBall: function() {
      var self = this;
      self.ball.el.className = "ball moving";
      if (this.isServer) {
          var move = function() {
            var fieldCollision,
              playerCollision;
          
            self.ball.updatePosition();
            self.refreshBall();

            playerCollision = self.isCollision({x: self.ball.x, y: self.ball.y});
            if (playerCollision !== false) { 
              self.ball.invertDirectionY();
              self.ball.angle = self.ball.calculateAngle(self.players[playerCollision]);
            } else {
              fieldCollision = self.isFieldCollision();
              if (fieldCollision == "top") {
                self.pointForPlayer(0);
              } else if (fieldCollision == "bottom") {
                self.pointForPlayer(1);
              } else if (fieldCollision == "left") {
                self.ball.invertDirectionX();
              } else if (fieldCollision == "right") {
                self.ball.invertDirectionX();
              }        
            }
            if (!self.paused) {
              window.setTimeout(move, 50);
            } else {
              self.ball.el.className = "ball";
            }
          }
        }
        move();
    },


    resetScore:  function() {
      this.score.reset();
      this.refreshScore();
    },

    refreshScore:  function() {
      this.score.el.innerHTML = "Player 1: " + this.score.getPlayer(0) + " - Player 2: " + this.score.getPlayer(1);
    },
    refreshPlayers: function(players) {
      var i;
      for (i = 0; i < players.length; i++) {
        this.refreshPlayerX(players[i]);
        this.refreshPlayerY(players[i]);
      } 
    },
    refreshPlayerX: function(player) { 
        player.el.style.left = player.x + "px";      
    },
    refreshPlayerY: function(player) { 
        player.el.style.top = player.y + "px";      
    },

    isFieldCollision: function() {
       if (this.ball.y > this.field.h) {
          return "bottom"
       } else if (this.ball.y < 0) {
          return "top"
       } else if (this.ball.x < 0) {
          return "left"
       } else if (this.ball.x > this.field.w) {
          return "right"
       } else {
        return false
       }
    },

    refreshBall: function() {
       this.ball.el.style.left = this.ball.x + "px";
       this.ball.el.style.top = this.ball.y + "px";   
       if (this.isServer) {
          Events.fire("refreshball", {});
       }
    },

    isCollision: function(xy) {
       var ball = xy,
        players = this.players;
       if (ball.y >= players[0].y && ball.y <= players[0].y + players[0].h + 25
          && ball.x >= players[0].x  && ball.x <= players[0].x + players[0].w) {
          return 0
        } else if(ball.y >= players[1].y -25 && ball.y <= players[1].y + players[1].h 
          && ball.x >= players[1].x && ball.x <= players[1].x + players[1].w ) {
          return 1
       } else {
          return false
       }
    },

    centerBall: function() {
      var center = this.field.center;
      this.ball.setXY({
        x: center.x,
        y: center.y
      })
    },

    pointForPlayer: function(playerNumber) {
      var self = this;
      self.score.point(playerNumber);
      self.refreshScore();
      self.ball.resetAngle();
      self.centerBall();
      self.refreshBall();
      self.pause();
      Events.fire("changescore", playerNumber);
      window.setTimeout(function() {
        self.play();
        self.playBall();
      }, 2000)
    },

    on: function(e, callback) {
      Events.on(e, callback);
    },

    keydown: function(keycode) {
      var i,
        player = this.currentPlayer;

      if (keycode == 37) {
        player.moveLeft();
        this.refreshPlayerX(player);
      } else if (keycode == 39) {
        player.moveRight(this.field.w);
        this.refreshPlayerX(player);
      } else
      if (keycode == 32) {
        if (this.paused) {
          this.play();
          this.playBall();
        } else {
          this.pause();
        }
      }
    }

  }

  Events = {
    _events: {},
    fire: function(e, params) {
      var i;
      if (Events._events[e]) {
        for (i = 0; i < Events._events[e].length; i++) {
          Events._events[e][i](params)
        }
      }
    },
    on: function(e, callback) {
      if (!Events._events[e]) {
        Events._events[e] = []
      }
      Events._events[e].push(callback);
    }
  }

  window.Pong = Pong; 

}());
