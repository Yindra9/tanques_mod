const express = require('express');
const path = require('path');
const { ExpressPeerServer } = require('peer');

const app = express();
const PORT = process.env.PORT || 3000;

// Sirve el juego original completo sin mover carpetas ni cambiar rutas.
app.use(express.static(__dirname));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor listo en puerto ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
});

// Servidor PeerJS para que dos jugadores puedan conectarse desde redes diferentes.
app.use('/peerjs', ExpressPeerServer(server, {
  debug: true,
  path: '/'
}));
