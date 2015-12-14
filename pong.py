
from autobahn.twisted.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory
import json
import hashlib

class MyServerProtocol(WebSocketServerProtocol):

    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        print("WebSocket connection open.")
        self.factory.register(self)

    def onMessage(self, payload, isBinary):
        #print("Text message received: {0}".format(payload.decode('utf8')))
        msgObj = json.loads(payload)
        if 'registerId' in msgObj:
            self.factory.join(self, msgObj['registerId'])
        else:
            self.factory.broadcast(msgObj, self)

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {0}".format(reason))


class MyServerFactory(WebSocketServerFactory):

    """
    Simple broadcast server broadcasting any message it receives to all
    currently connected clients.
    """

    def __init__(self, url, debug=False, debugCodePaths=False):
        WebSocketServerFactory.__init__(self, url, debug=debug, debugCodePaths=debugCodePaths)
        self.clients = {}

    def register(self, client):
        if client not in self.clients:
            print("registered client {}".format(client.peer))
            connectionId = hashlib.md5("{}".format(client.peer)).hexdigest()
            client.connectionId = connectionId
            if not connectionId in self.clients:
                self.clients[connectionId] = []
            if not client in self.clients[connectionId]:
                self.clients[connectionId].append(client)
            response = {}
            response['hello'] = connectionId
            client.sendMessage(json.dumps(response).encode('utf8'))

    def join(self, client, connectionId):
        if client not in self.clients[connectionId]:
            client.connectionId = connectionId
            self.clients[connectionId].append(client)
            response = {}
            response['joined to'] = connectionId
            client.sendMessage(json.dumps(response).encode('utf8'))

    def unregister(self, client):
        if client in self.clients:
            print("unregistered client {}".format(client.peer))
            self.clients.remove(client)

    def broadcast(self, msg, client):
        #print("broadcasting message '{}' ..".format(msg))
        connectionId = msg['connectionId']
        for c in self.clients[connectionId]:
            if c is not client:
                del msg['connectionId']
                c.sendMessage(json.dumps(msg).encode('utf8'))

        

if __name__ == '__main__':

    import sys

    from twisted.python import log
    from twisted.internet import reactor

    log.startLogging(sys.stdout)

    ServerFactory = MyServerFactory
    factory = ServerFactory("ws://127.0.0.1:9000",
                            debug=False)
    factory.protocol = MyServerProtocol
    # factory.setProtocolOptions(maxConnections=2)

    reactor.listenTCP(9000, factory)
    reactor.run()
