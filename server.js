const WebSocket = require('ws');
const Cloudinary = require('cloudinary');

const wss = new WebSocket.Server({port: 8080}, () => {
  console.log('Server started...');
});

let ws;
let clients = {};

wss.on('connection', (server) => {
  ws = server;
  const client = ws.upgradeReq.headers['sec-websocket-key'];
  clients[client] = ws;
  ws.on('message', (msg, data) => receive(msg, data, client));
  ws.on('close', (socket, number, reason) =>
    console.log('Closed: ', client, socket, number, reason),
  );
});

const send = (msg, client) => {
  console.log('Sending: ', msg);
  clients[client].send(JSON.stringify(msg), (error) => {
    if (error) {
      delete clients[client];
    } else {
      console.log(`Sent: ${msg}, to ${client}`);
    }
  });
};

const receive = (msg, data, sender) => {
  console.log(`Received: ${msg.substring(0, 500)}, from ${sender}`);
  broadcast(msg, sender);
};

const broadcast = (msg, sender) => {
  msg = JSON.parse(msg);
  Object.keys(clients).map((client) => {
    if (client === sender) {
      return;
    } else if (msg.image !== undefined) {
      Cloudinary.v2.uploader.unsigned_upload(
        `data:image/jpeg;base64,${msg.image}`,
        'myPreset',
        {cloud_name: 'zafer'},
        (_err, result) => {
          console.log('Uploaded URL: ' + result.url);
          msg.image = result.url;
          msg.text = undefined;
          msg.timestamp = new Date().getTime();
          send(msg, client);
        },
      );
    } else {
      send(msg, client);
    }
  });
};
