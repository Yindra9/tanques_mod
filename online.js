
const socket = io();

let onlineRoomCode = null;
let onlinePlayerNumber = null;
let isOnlineMode = false;

let onlinePlayers = {
  p1: { name: "", color: null },
  p2: { name: "", color: null }
};

let onlineReady = {
  p1: false,
  p2: false
};
let hostScreenSyncInterval = null;

function stopHostScreenSync() {
  if (hostScreenSyncInterval) {
    clearInterval(hostScreenSyncInterval);
    hostScreenSyncInterval = null;
  }
}
function showElement(id, display = "flex") {
  const el = document.getElementById(id);
  if (el) el.style.display = display;
}

function hideElement(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

function setStatus(message) {
  const status = document.getElementById("online-status");
  if (status) status.textContent = message || "";
}

function createOnlineRoom() {
  isOnlineMode = true;
  socket.emit("createRoom");
}

function joinOnlineRoom(roomCode) {
  isOnlineMode = true;
  socket.emit("joinRoom", roomCode);
}

function applyPlayerPermissions() {
  const p1Name = document.getElementById("online-p1-name");
  const p2Name = document.getElementById("online-p2-name");
  const p1Colors = document.querySelectorAll(".online-p1-color");
  const p2Colors = document.querySelectorAll(".online-p2-color");
  const difficulty = document.getElementById("online-difficulty");
  const btnPlay = document.getElementById("btn-online-play");

  const isP1 = onlinePlayerNumber === 1;
  const isP2 = onlinePlayerNumber === 2;

  if (p1Name) p1Name.disabled = !isP1;
  if (p2Name) p2Name.disabled = !isP2;

  p1Colors.forEach(btn => btn.disabled = !isP1);
  p2Colors.forEach(btn => btn.disabled = !isP2);

  if (difficulty) difficulty.disabled = !isP1;
  if (btnPlay) btnPlay.style.display = isP1 ? "inline-block" : "none";

  updateReadyButtons();
}

function updateLobbyButton() {
  const btnPlay = document.getElementById("btn-online-play");

  const validNames =
    onlinePlayers.p1.name &&
    onlinePlayers.p2.name;

  const validColors =
    onlinePlayers.p1.color &&
    onlinePlayers.p2.color &&
    onlinePlayers.p1.color !== onlinePlayers.p2.color;

  const bothReady = onlineReady.p1 && onlineReady.p2;

  if (btnPlay) {
    btnPlay.disabled = !(validNames && validColors && bothReady);
  }
}

function updateReadyButtons() {
  const btnP1 = document.getElementById("online-p1-ready");
  const btnP2 = document.getElementById("online-p2-ready");

  if (btnP1) {
    btnP1.textContent = onlineReady.p1 ? "Listo" : "No listo";
    btnP1.style.background = onlineReady.p1 ? "#1b5e20" : "#d32f2f";
    btnP1.disabled = onlinePlayerNumber !== 1;
  }

  if (btnP2) {
    btnP2.textContent = onlineReady.p2 ? "Listo" : "No listo";
    btnP2.style.background = onlineReady.p2 ? "#1b5e20" : "#d32f2f";
    btnP2.disabled = onlinePlayerNumber !== 2;
  }

  updateLobbyButton();
}

function syncLobby() {
  if (!onlineRoomCode || !onlinePlayerNumber) return;

  const difficulty = document.getElementById("online-difficulty")?.value || "recluta";

  socket.emit("lobbyUpdate", {
    roomCode: onlineRoomCode,
    playerNumber: onlinePlayerNumber,
    playerData: onlinePlayers,
    ready: onlineReady,
    difficulty: difficulty
  });
}

function goToOnlineLobby() {
  window.onlinePlayers = onlinePlayers;

  hideElement("online-screen");
  showElement("online-duo-screen");

  applyPlayerPermissions();
  updateReadyButtons();
  updateLobbyButton();
}

function selectOnlineColor(player, color, button) {
  onlinePlayers[player].color = color;

  const selector = player === "p1" ? ".online-p1-color" : ".online-p2-color";

  document.querySelectorAll(selector).forEach((btn) => {
    btn.style.outline = "none";
  });

  if (button) {
    button.style.outline = "3px solid #000";
  }

  onlineReady[player] = false;
  updateReadyButtons();
  syncLobby();
}

socket.on("roomCreated", (data) => {
  onlineRoomCode = data.roomCode;
  onlinePlayerNumber = data.playerNumber;

  const shareBox = document.getElementById("online-share");
  const roomInput = document.getElementById("online-room-url");

  if (shareBox) shareBox.style.display = "flex";
  if (roomInput) roomInput.value = onlineRoomCode;

  setStatus("Sala creada. Comparte este código con el jugador 2.");
});

socket.on("roomJoined", (data) => {
  onlineRoomCode = data.roomCode;
  onlinePlayerNumber = data.playerNumber;

  setStatus("Te uniste a la sala: " + onlineRoomCode);
});

socket.on("joinError", (message) => {
  alert(message);
});

socket.on("playersReady", () => {
  goToOnlineLobby();
});

socket.on("lobbyState", (data) => {
  if (!data || !data.playerData) return;

  onlinePlayers = data.playerData;
  window.onlinePlayers = onlinePlayers;

  if (data.ready) {
    onlineReady = data.ready;
  }

  const p1Name = document.getElementById("online-p1-name");
  const p2Name = document.getElementById("online-p2-name");
  const difficulty = document.getElementById("online-difficulty");

  if (p1Name && onlinePlayerNumber !== 1) {
    p1Name.value = onlinePlayers.p1.name || "";
  }

  if (p2Name && onlinePlayerNumber !== 2) {
    p2Name.value = onlinePlayers.p2.name || "";
  }

  if (difficulty && data.difficulty && onlinePlayerNumber !== 1) {
    difficulty.value = data.difficulty;
  }

  updateReadyButtons();
  updateLobbyButton();
  applyPlayerPermissions();
});


socket.on("onlineGameStarted", (data) => {
  onlinePlayers = data.players;
  window.onlinePlayers = onlinePlayers;
  window.player1 = onlinePlayers.p1;
  window.player2 = onlinePlayers.p2;
  window.localMode = null;

  hideElement("online-duo-screen");
  hideElement("online-screen");
  hideElement("start-screen");

  if (onlinePlayerNumber === 1) {
    startGame(data.difficulty || "recluta");
    startHostScreenSync();
    const originalEndGame = window.end_game || end_game;

window.end_game = function(victory) {
  originalEndGame(victory);

  socket.emit("onlineGameEnded", {
    roomCode: onlineRoomCode,
    victory
  });
};
  } else {
  isOnlineMode = true;

  let waiting = document.getElementById("player2-waiting-screen");

  if (!waiting) {
    waiting = document.createElement("div");
    waiting.id = "player2-waiting-screen";
    waiting.style.position = "fixed";
    waiting.style.inset = "0";
    waiting.style.background = "#111";
    waiting.style.color = "white";
    waiting.style.display = "flex";
    waiting.style.alignItems = "center";
    waiting.style.justifyContent = "center";
    waiting.style.fontFamily = "sans-serif";
    waiting.style.zIndex = "9999";
    waiting.style.flexDirection = "column";
    waiting.style.gap = "0";

    waiting.innerHTML = `
      <h2>Jugador 2 conectado</h2>
      <p>Esperando la sincronización de la partida...</p>
      <p>Usa flechas para moverte y espacio para disparar.</p>
    `;

    document.body.appendChild(waiting);
  }

  waiting.style.display = "flex";
}});

socket.on("playerDisconnected", () => {
  alert("El otro jugador se desconectó.");
});
socket.on("remoteInput", (data) => {
  if (onlinePlayerNumber !== 1) return;
  if (!window.myGameArea) return;

  if (!window.myGameArea.keys) {
    window.myGameArea.keys = [];
  }

  const input = data.input;
  if (!input) return;

  if (input.type === "reset") {
    [87, 83, 65, 68, 70].forEach(code => {
      window.myGameArea.keys[code] = false;
    });
    return;
  }

  const isDown = input.type === "keydown";

  const map = {
    UP: 87,
    DOWN: 83,
    LEFT: 65,
    RIGHT: 68,
    SHOOT: 70
  };

  const code = map[input.key];

  if (code) {
    window.myGameArea.keys[code] = isDown;
  }
});
function startHostScreenSync() {
  if (onlinePlayerNumber !== 1) return;

  stopHostScreenSync();

  hostScreenSyncInterval = setInterval(() => {
    if (!window.myGameArea || !window.myGameArea.canvas) return;

    const frame = window.myGameArea.canvas.toDataURL("image/jpeg", 0.6);

    socket.emit("hostFrame", {
      roomCode: onlineRoomCode,
      frame
    });
  }, 120);
}
socket.on("showEndOnlineScreen", (data) => {
  showEndOnlineScreen(data.victory);
});

socket.on("returnToLobby", () => {
  returnToLobbyOnline();
});

socket.on("playerDisconnected", () => {
  alert("El otro jugador abandonó la partida.");
  returnToLobbyOnline();
});
socket.on("guestFrame", (data) => {
  if (onlinePlayerNumber !== 2) return;
  if (!data || !data.frame) return;

  let img = document.getElementById("guest-frame-img");

  if (!img) {
    img = document.createElement("img");
    img.id = "guest-frame-img";
    img.style.width = "100vw";
    img.style.height = "100vh";
    img.style.objectFit = "contain";
    img.style.imageRendering = "pixelated";

    const waiting = document.getElementById("player2-waiting-screen");
    if (waiting) {
      waiting.innerHTML = `
  <div style="
    position: fixed;
    top: 8px;
    left: 12px;
    color: white;
    background: rgba(0,0,0,0.55);
    padding: 6px 10px;
    border-radius: 6px;
    font-family: sans-serif;
    z-index: 100000;
  ">
    ${onlinePlayers.p2.name || "Jugador 2"}
  </div>
`;

waiting.appendChild(img);
      waiting.appendChild(img);
    }
  }

  img.src = data.frame;
});

function sendOnlineInput(input) {
  if (!isOnlineMode || !onlineRoomCode) return;

  socket.emit("playerInput", {
    roomCode: onlineRoomCode,
    input
  });
}

document.addEventListener("keydown", (event) => {
  if (onlinePlayerNumber !== 2) return;

  const map = {
    ArrowUp: "UP",
    ArrowDown: "DOWN",
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
    " ": "SHOOT"
  };

  const key = map[event.key];
  if (!key) return;

  event.preventDefault();

  sendOnlineInput({
    type: "keydown",
    key
  });
});

document.addEventListener("keyup", (event) => {
  if (onlinePlayerNumber !== 2) return;

  const map = {
    ArrowUp: "UP",
    ArrowDown: "DOWN",
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
    " ": "SHOOT"
  };

  const key = map[event.key];
  if (!key) return;

  event.preventDefault();

  sendOnlineInput({
    type: "keyup",
    key
  });
});
function returnToOnlineLobby() {
  hideElement("player2-waiting-screen");
  hideElement("win-screen");
  hideElement("lose-screen");

  showElement("online-duo-screen");

  onlineReady.p1 = false;
  onlineReady.p2 = false;

  updateReadyButtons();
  updateLobbyButton();
  syncLobby();
}
function showEndOnlineScreen(victory) {
  const waiting = document.getElementById("player2-waiting-screen");
  if (waiting) waiting.remove();

  hideElement("online-duo-screen");
  hideElement("online-screen");
  hideElement("start-screen");

  let screen = document.getElementById("online-end-screen");

  if (!screen) {
    screen = document.createElement("div");
    screen.id = "online-end-screen";
    screen.style.position = "fixed";
    screen.style.inset = "0";
    screen.style.background = "#111";
    screen.style.color = "white";
    screen.style.display = "flex";
    screen.style.flexDirection = "column";
    screen.style.alignItems = "center";
    screen.style.justifyContent = "center";
    screen.style.gap = "16px";
    screen.style.fontFamily = "sans-serif";
    screen.style.zIndex = "99999";

    screen.innerHTML = `
      <h1 id="online-end-title"></h1>
      <button id="btn-online-play-again" style="padding:10px 18px; font-size:16px;">
        Volver a jugar
      </button>
    `;

    document.body.appendChild(screen);
  }

  document.getElementById("online-end-title").textContent =
    victory ? "¡Partida terminada! Ganaron." : "Partida terminada. Perdieron.";

  screen.style.display = "flex";

  const btnAgain = document.getElementById("btn-online-play-again");

    if (btnAgain) {
      btnAgain.onclick = () => {
        socket.emit("backToLobby", {
          roomCode: onlineRoomCode
        });

        returnToLobbyOnline();
      };
    }
}

function returnToLobbyOnline() {
  stopHostScreenSync();

  const endScreen = document.getElementById("online-end-screen");
  if (endScreen) endScreen.remove();

  const waiting = document.getElementById("player2-waiting-screen");
  if (waiting) waiting.remove();

  const img = document.getElementById("guest-frame-img");
  if (img) img.remove();

  if (window.myGameArea) {
    try {
      clearInterval(window.myGameArea.interval);
      window.myGameArea.keys = [];
      window.myGameArea.gameOver = false;
      window.myGameArea.paused = false;

      if (window.myGameArea.canvas && window.myGameArea.canvas.parentNode) {
        window.myGameArea.canvas.remove();
      }
    } catch (e) {}
  }

  onlineReady.p1 = false;
  onlineReady.p2 = false;

  window.onlinePlayers = onlinePlayers;
  window.player1 = onlinePlayers.p1;
  window.player2 = onlinePlayers.p2;
  window.localMode = null;

  hideElement("online-screen");
  hideElement("start-screen");
  hideElement("win-screen");
  hideElement("lose-screen");

  showElement("online-duo-screen");

  updateReadyButtons();
  updateLobbyButton();
  syncLobby();
}
window.addEventListener("blur", () => {
  if (onlinePlayerNumber !== 2) return;

  sendOnlineInput({
    type: "reset"
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const btnOnline = document.getElementById("btn-online");
  const btnOnlineBack = document.getElementById("btn-online-back");

  const btnCreate = document.getElementById("btn-online-create");
  const btnJoin = document.getElementById("btn-online-join-start");
  const inputCode = document.getElementById("online-join-code");

  const btnCopy = document.getElementById("online-copy-link");
  const roomInput = document.getElementById("online-room-url");
  const shareBox = document.getElementById("online-share");

  const p1Name = document.getElementById("online-p1-name");
  const p2Name = document.getElementById("online-p2-name");
  const btnPlay = document.getElementById("btn-online-play");
  const difficultySelect = document.getElementById("online-difficulty");
  const btnLobbyBack = document.getElementById("btn-online-duo-back");

  const btnP1Ready = document.getElementById("online-p1-ready");
  const btnP2Ready = document.getElementById("online-p2-ready");

  if (btnOnline) {
    btnOnline.onclick = () => {
      hideElement("start-screen");
      showElement("online-screen");
      setStatus("Crea una sala o ingresa un código para unirte.");
    };
  }

  if (btnOnlineBack) {
    btnOnlineBack.onclick = () => {
      hideElement("online-screen");
      showElement("start-screen");
    };
  }

  if (btnCreate) {
    btnCreate.onclick = () => {
      createOnlineRoom();
    };
  }

  if (btnJoin) {
    btnJoin.onclick = () => {
      const code = inputCode ? inputCode.value.trim().toUpperCase() : "";

      if (!code) {
        alert("Escribe el código de sala.");
        return;
      }

      joinOnlineRoom(code);
    };
  }

  if (btnCopy && roomInput) {
    btnCopy.onclick = async () => {
      await navigator.clipboard.writeText(roomInput.value);
      alert("Código copiado.");
    };
  }

  if (shareBox) shareBox.style.display = "none";

  if (p1Name) {
    p1Name.oninput = () => {
      onlinePlayers.p1.name = p1Name.value.trim();
      onlineReady.p1 = false;
      updateReadyButtons();
      syncLobby();
    };
  }

  if (p2Name) {
    p2Name.oninput = () => {
      onlinePlayers.p2.name = p2Name.value.trim();
      onlineReady.p2 = false;
      updateReadyButtons();
      syncLobby();
    };
  }

  if (difficultySelect) {
    difficultySelect.onchange = () => {
      onlineReady.p1 = false;
      updateReadyButtons();
      syncLobby();
    };
  }

  document.querySelectorAll(".online-p1-color").forEach((btn) => {
    btn.onclick = () => {
      selectOnlineColor("p1", btn.dataset.color, btn);
    };
  });

  document.querySelectorAll(".online-p2-color").forEach((btn) => {
    btn.onclick = () => {
      selectOnlineColor("p2", btn.dataset.color, btn);
    };
  });

  if (btnP1Ready) {
    btnP1Ready.onclick = () => {
      if (onlinePlayerNumber !== 1) return;
      onlineReady.p1 = !onlineReady.p1;
      updateReadyButtons();
      syncLobby();
    };
  }

  if (btnP2Ready) {
    btnP2Ready.onclick = () => {
      if (onlinePlayerNumber !== 2) return;
      onlineReady.p2 = !onlineReady.p2;
      updateReadyButtons();
      syncLobby();
    };
  }

  if (btnPlay) {
    btnPlay.onclick = () => {
      const difficulty = difficultySelect ? difficultySelect.value : "recluta";

      if (!onlinePlayers.p1.name || !onlinePlayers.p2.name) {
        alert("Ambos jugadores deben escribir su nombre.");
        return;
      }

      if (!onlinePlayers.p1.color || !onlinePlayers.p2.color) {
        alert("Ambos jugadores deben escoger un color.");
        return;
      }

      if (onlinePlayers.p1.color === onlinePlayers.p2.color) {
        alert("Los jugadores no pueden usar el mismo color.");
        return;
      }

      if (!onlineReady.p1 || !onlineReady.p2) {
        alert("Ambos jugadores deben marcarse como listos.");
        return;
      }

      socket.emit("startOnlineGame", {
        roomCode: onlineRoomCode,
        players: onlinePlayers,
        difficulty: difficulty
      });
    };
  }

  if (btnLobbyBack) {
    btnLobbyBack.onclick = () => {
      hideElement("online-duo-screen");
      showElement("online-screen");
    };
  }
});