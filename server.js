const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on("connection", (socket) => {
  console.log("Jugador conectado:", socket.id);

  socket.on("createRoom", () => {
    const roomCode = generateRoomCode();

    rooms[roomCode] = {
      hostId: socket.id,
      players: [
        {
          id: socket.id,
          playerNumber: 1
        }
      ]
    };

    socket.join(roomCode);

    socket.emit("roomCreated", {
      roomCode,
      playerNumber: 1
    });

    console.log(`Sala creada: ${roomCode}`);
  });

  socket.on("joinRoom", (roomCode) => {
    roomCode = String(roomCode).toUpperCase().trim();

    const room = rooms[roomCode];

    if (!room) {
      socket.emit("joinError", "La sala no existe.");
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("joinError", "La sala está llena.");
      return;
    }

    room.players.push({
      id: socket.id,
      playerNumber: 2
    });

    socket.join(roomCode);

    socket.emit("roomJoined", {
      roomCode,
      playerNumber: 2
    });

    io.to(roomCode).emit("playersReady", {
      roomCode,
      players: room.players
    });

    console.log(`Jugador 2 entró a sala: ${roomCode}`);
  });

  socket.on("playerInput", (data) => {
    const { roomCode, input } = data;

    if (!roomCode || !rooms[roomCode]) return;

    const player = rooms[roomCode].players.find(p => p.id === socket.id);
    if (!player) return;

    socket.to(roomCode).emit("remoteInput", {
      playerNumber: player.playerNumber,
      input
    });
  });
 socket.on("lobbyUpdate", (data) => {
  const { roomCode, playerNumber, playerData, ready, difficulty } = data;

  if (!roomCode || !rooms[roomCode]) return;

  io.to(roomCode).emit("lobbyState", {
    playerNumber,
    playerData,
    ready,
    difficulty
  });
});

socket.on("startOnlineGame", (data) => {
  const { roomCode, players, difficulty } = data;

  if (!roomCode || !rooms[roomCode]) return;

  io.to(roomCode).emit("onlineGameStarted", {
    players,
    difficulty
  });
});

  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);

    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);

      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);

        io.to(roomCode).emit("playerDisconnected");

        if (room.players.length === 0) {
          delete rooms[roomCode];
          console.log(`Sala eliminada: ${roomCode}`);
        }

        break;
      }
    }
  });
  socket.on("hostFrame", (data) => {
    const { roomCode, frame } = data;

    if (!roomCode || !rooms[roomCode]) return;

    socket.to(roomCode).emit("guestFrame", {
      frame
    });
  });
  socket.on("onlineGameEnded", (data) => {
  const { roomCode, victory } = data;

  if (!roomCode || !rooms[roomCode]) return;

  io.to(roomCode).emit("showEndOnlineScreen", {
    victory
  });
});

socket.on("backToLobby", (data) => {
  const { roomCode } = data;

  if (!roomCode || !rooms[roomCode]) return;

  io.to(roomCode).emit("returnToLobby");
});
});


server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});