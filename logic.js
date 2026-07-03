//se define la cantidad de pixeles por las que un tanque salta
skip = 4;
const CELL_SIZE = 35;
const GRID_SIZE = 20;
const GRID_BOUNDARY = GRID_SIZE - 1;
const GRID_INNER_MAX = GRID_BOUNDARY - 1;
const GRID_HALF = Math.floor(GRID_SIZE / 2);
const MAP_PIXEL_SIZE = GRID_SIZE * CELL_SIZE;
const HUD_PADDING = 15;
const RADAR_CELL_SIZE = 10;
const RADAR_CELL_STEP = 11;
const RADAR_SIZE = GRID_SIZE * RADAR_CELL_STEP;
const HUD_X = MAP_PIXEL_SIZE + HUD_PADDING;
const HUD_RADAR_Y = 15;
const HUD_CANVAS_WIDTH = HUD_X + RADAR_SIZE + HUD_PADDING;
const HUD_CANVAS_HEIGHT = MAP_PIXEL_SIZE;
const HUD_STATS_ICON_Y = HUD_RADAR_Y + RADAR_SIZE + 50;
const HUD_STATS_TEXT_Y = HUD_STATS_ICON_Y - 10;
const HUD_OBJECTIVE_ICON_Y = HUD_STATS_ICON_Y + 60;
const HUD_OBJECTIVE_TEXT_Y = HUD_OBJECTIVE_ICON_Y - 10;
const HUD_ICON_COLUMNS = [
    HUD_X,
    HUD_X + 45,
    HUD_X + 90,
    HUD_X + 135,
    HUD_X + 180,
    HUD_X + 225
];
const BASE_ROW = GRID_BOUNDARY - 1;
const BASE_COL = Math.floor(GRID_SIZE / 2);
const ENEMY_MIN_ROWS_FROM_BOTTOM = 8; // enemigos deben aparecer al menos 9 casillas arriba del borde inferior
const BASE_CONFIG = {
    playerStart: { row: BASE_ROW, col: BASE_COL - 3 },
    eagle: { row: BASE_ROW, col: BASE_COL },
    shield: [
        { row: BASE_ROW - 1, col: BASE_COL - 1 },
        { row: BASE_ROW - 1, col: BASE_COL },
        { row: BASE_ROW - 1, col: BASE_COL + 1 },
        { row: BASE_ROW, col: BASE_COL - 1 },
        { row: BASE_ROW, col: BASE_COL + 1 }
    ]
};

// Deshabilita tipos de enemigos por clave
const DISABLED_ENEMY_TYPES = {
    type1: false,
    type2: false,
    type3: false,
    type4: false,
    definitivo: false
};

const MULTIPLAYER_TINT_ALPHA = 0.5;
// Asegura que un color dado tenga un valor de opacidad (alpha) válido, y lo devuelve en formato rgba(r,g,b,a).
function ensureTintOpacity(color, alpha = MULTIPLAYER_TINT_ALPHA) {
    if (!color || typeof color !== 'string') return color;
    const trimmed = color.trim();
    if (!trimmed) return color;
    const parsedAlpha = typeof alpha === 'number' && !Number.isNaN(alpha)
        ? Math.max(0, Math.min(1, alpha))
        : MULTIPLAYER_TINT_ALPHA;

    const buildRgba = (r, g, b) => {
        const rr = Number.isNaN(r) ? 0 : Math.max(0, Math.min(255, r));
        const gg = Number.isNaN(g) ? 0 : Math.max(0, Math.min(255, g));
        const bb = Number.isNaN(b) ? 0 : Math.max(0, Math.min(255, b));
        return `rgba(${rr}, ${gg}, ${bb}, ${parsedAlpha})`;
    };

    if (/^rgba\s*\(/i.test(trimmed)) {
        const parts = trimmed.replace(/^rgba\s*\(|\)\s*$/gi, '').split(',').map(p => p.trim());
        if (parts.length >= 3) {
            const r = parseInt(parts[0], 10);
            const g = parseInt(parts[1], 10);
            const b = parseInt(parts[2], 10);
            if (![r, g, b].some(Number.isNaN)) {
                return buildRgba(r, g, b);
            }
        }
        return trimmed;
    }

    if (/^rgb\s*\(/i.test(trimmed)) {
        const parts = trimmed.replace(/^rgb\s*\(|\)\s*$/gi, '').split(',').map(p => p.trim());
        if (parts.length >= 3) {
            const r = parseInt(parts[0], 10);
            const g = parseInt(parts[1], 10);
            const b = parseInt(parts[2], 10);
            if (![r, g, b].some(Number.isNaN)) {
                return buildRgba(r, g, b);
            }
        }
        return trimmed;
    }

    if (trimmed[0] === '#') {
        let hex = trimmed.slice(1);
        if (hex.length === 3 || hex.length === 4) {
            hex = hex.split('').map(ch => ch + ch).join('');
        }
        if (hex.length === 8) {
            hex = hex.slice(0, 6);
        }
        if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            if (![r, g, b].some(Number.isNaN)) {
                return buildRgba(r, g, b);
            }
        }
        return trimmed;
    }

    return trimmed;
}

try {
    if (typeof window !== 'undefined') {
        window.ensureTintOpacity = ensureTintOpacity;
        window.MULTIPLAYER_TINT_ALPHA = MULTIPLAYER_TINT_ALPHA;
    }
} catch (e) {}//
// Construye un objeto de configuración de dificultad basado en el nivel y los valores opcionales de anulación.
function buildDifficulty(level, overrides = {}) {
    const density = Math.max(20, 100 - level * 20);
    const base = {
        level,
        densidadX: density,
        densidadY: density,
        cantObj_contacto: level * 2,
        cantObj_distancia: level * 3,
        tankPlan: {
            type1: Math.max(0, level),
            type2: 0,
            type3: Math.max(1, level * 2),
            type4: Math.max(0, level - 1),
            definitivo: 0,
            type12Total: null
        },
        basicTierSequence: null,
        basicTierCounts: null,
        maxActiveEnemies: 10,
        respawnDelayMs: 2000
    };
    const merged = { ...base, ...overrides };
    const overridePlan = overrides.tankPlan || {};
    merged.tankPlan = { ...base.tankPlan, ...overridePlan };
    if (Array.isArray(overrides.basicTierSequence)) {
        merged.basicTierSequence = overrides.basicTierSequence.slice();
    }
    if (overrides.basicTierCounts) {
        merged.basicTierCounts = { ...overrides.basicTierCounts };
    }
    return merged;
}

const DIFFICULTY_PRESETS = {
    recluta: {
        key: 'recluta',
        label: 'Fácil',
        ...buildDifficulty(1, {
            tankPlan: { type12Total: 20, type3: 10, type4: 5, definitivo: 0 },
            basicTierCounts: null,
            maxActiveEnemies: 6
        })
    },
    soldado: {
        key: 'soldado',
        label: 'Intermedio',
        ...buildDifficulty(2, {
            tankPlan: { type12Total: 10, type3: 15, type4: 10, definitivo: 0 },
            basicTierCounts: null,
            maxActiveEnemies: 8
        })
    },
    comandante: {
        key: 'comandante',
        label: 'Difícil',
        ...buildDifficulty(3, {
            tankPlan: { type12Total: 10, type3: 20, type4: 20, definitivo: 0 },
            basicTierCounts: null,
            maxActiveEnemies: 10
        })
    },
    legendario: {
        key: 'legendario',
        label: 'Pesadilla',
        ...buildDifficulty(4, {
            tankPlan: { type12Total: 0, type3: 0, type4: 40, definitivo: 10 },
            basicTierCounts: null,
            maxActiveEnemies: 15
        })
    }
};
//  
function resolveDifficulty(selection) {
    if (typeof selection === 'string') {
        const key = selection.toLowerCase();
        if (DIFFICULTY_PRESETS[key]) return DIFFICULTY_PRESETS[key];
    }
    if (typeof selection === 'number') {
        const preset = Object.values(DIFFICULTY_PRESETS).find(p => p.level === selection);
        if (preset) return preset;
    }
    return DIFFICULTY_PRESETS.recluta;
}

// Bloquea entradas del J2 locales en modo Online real (host),
// para que en la pantalla del Jugador 1 solo controle su propio tanque.
try {
    if (typeof window !== 'undefined' && !window.__tank1990BlockLocalP2__) {
        window.addEventListener('message', function (ev) {
            try {
                if (!ev || !ev.data || !ev.data.type) return;
                if (window.onlinePlayers && (!window.localMode || window.localMode !== 'duo')) {
                    if (ev.data.type === 'TANK1990_P2_KEY' || ev.data.type === 'TANK1990_P2_RESET' || ev.data.type === 'TANK1990_P2_CMD') {
                        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
                        return;
                    }
                }
            } catch (e) {}
        }, true); // en captura para interceptar antes que otros listeners
        window.__tank1990BlockLocalP2__ = true;
    }
} catch (e) {}
const myGameArea = {
    canvas: document.createElement("canvas"),
    start: function (densidadX, densidadY, cantObj_contacto, cantObj_distancia, tankPlan, basicTierSequence, spawnSettings) {
        //variables del entorno del area de juego, recibidas por parametro
        this.cantObj_contacto = cantObj_contacto;
        this.cantObj_distancia = cantObj_distancia;

        const plan = (typeof tankPlan === 'object' && tankPlan !== null) ? tankPlan : {};
        const sanitize = (value) => {
            const parsed = Number(value);
            if (Number.isNaN(parsed)) return 0;
            return Math.max(0, Math.floor(parsed));
        };
        const totalType12 = Object.prototype.hasOwnProperty.call(plan, 'type12Total') ? sanitize(plan.type12Total) : null;
        let type1Count = sanitize(plan.type1);
        let type2Count = sanitize(plan.type2);
        if (totalType12 !== null) {
            if (totalType12 <= 0) {
                type1Count = 0;
                type2Count = 0;
            } else if (totalType12 === 1) {
                if (Math.random() < 0.5) {
                    type1Count = 1;
                    type2Count = 0;
                } else {
                    type1Count = 0;
                    type2Count = 1;
                }
            } else {
                const minEach = 1;
                const minType1 = minEach;
                const maxType1 = Math.max(minType1, totalType12 - minEach);
                const span = Math.max(1, maxType1 - minType1 + 1);
                const draw = Math.floor(Math.random() * span) + minType1;
                type1Count = Math.min(maxType1, draw);
                type2Count = Math.max(0, totalType12 - type1Count);
                if (type2Count < minEach) {
                    type2Count = minEach;
                    type1Count = Math.max(0, totalType12 - type2Count);
                }
            }
        }
        const type3Count = sanitize(plan.type3);
        const type4Count = sanitize(plan.type4);
        const definitiveCount = sanitize(plan.definitivo);

        this.tank_counter = {
            type1: type1Count,
            type2: type2Count,
            type3: type3Count,
            type4: type4Count,
            definitivo: definitiveCount
        };
        // Guardar conteo inicial para historial de puntuación
        this.initial_tank_counter = { ...this.tank_counter };

        const totalEnemies = type1Count + type2Count + type3Count + type4Count + definitiveCount;
        this.spawnSettings = (typeof spawnSettings === 'object' && spawnSettings !== null) ? spawnSettings : {};
        this.enemySpawnLimit = this.spawnSettings.maxActiveEnemies || totalEnemies;
        if (this.enemySpawnLimit < 1) {
            this.enemySpawnLimit = 1;
        }
        this.enemyRespawnDelay = typeof this.spawnSettings.respawnDelay === 'number' ? this.spawnSettings.respawnDelay : (typeof this.spawnSettings.respawnDelayMs === 'number' ? this.spawnSettings.respawnDelayMs : 2000);
        const defaultTierCounts = {
            type1: type1Count,
            type2: type2Count,
            definitivo: definitiveCount
        };
        this.basicTierCounts = this.spawnSettings.basicTierCounts ? { ...this.spawnSettings.basicTierCounts } : defaultTierCounts;
        // Preferencias de HUD de enemigos
        this.showEnemyIcons = false;           // grilla de múltiples íconos por tipo (off)
        this.showEnemyRemainingText = false;   // texto "Enemigos restantes: N" (off)
        this.showSingleEnemyIcon = false;      // icono único con número blanco (off)
        this.clearEnemySpawnTimers();
        this.enemyPool = [];
        this.gameOver = false;
        this.paused = false;
        // Vidas de jugadores (3 cada uno)
        this.p1Lives = 3;
        this.p2Lives = 3;
        //dimensiones del canvas
        this.canvas.width = HUD_CANVAS_WIDTH;
        this.canvas.height = HUD_CANVAS_HEIGHT;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        try { if (typeof window !== 'undefined' && typeof window.showGameControls === 'function') window.showGameControls(); } catch (e) {}
        try {
            // Acomodar el canvas principal en línea para soportar vista dual
            this.canvas.style.display = 'inline-block';
            this.canvas.style.verticalAlign = 'top';
            this.canvas.style.marginRight = '8px';
        } catch (e) {}
        try {
            // Si estamos en modo Online (dos jugadores) preparar un segundo canvas espejo
            // Solo si el host lo habilita explícitamente con window.__hostAllowExtraView = true
            if (typeof window !== 'undefined' && window.onlinePlayers && window.onlinePlayers.p1 && window.onlinePlayers.p2 && window.__hostAllowExtraView === true) {
                // limpiar canvas previo si existiera
                if (this.canvasMirror && this.canvasMirror.parentNode) {
                    this.canvasMirror.parentNode.removeChild(this.canvasMirror);
                }
                this.canvasMirror = document.createElement('canvas');
                this.canvasMirror.width = HUD_CANVAS_WIDTH;
                this.canvasMirror.height = HUD_CANVAS_HEIGHT;
                this.contextMirror = this.canvasMirror.getContext('2d');
                this.canvasMirror.style.display = 'inline-block';
                this.canvasMirror.style.verticalAlign = 'top';
                // insertar justo después del canvas principal
                if (this.canvas.nextSibling) {
                    this.canvas.parentNode.insertBefore(this.canvasMirror, this.canvas.nextSibling);
                } else {
                    this.canvas.parentNode.appendChild(this.canvasMirror);
                }

                // Crear barra de pestañas para alternar vistas (no lado a lado)
                const self = this;
                let tabs = document.getElementById('online-tabs-bar');
                if (!tabs) {
                    tabs = document.createElement('div');
                    tabs.id = 'online-tabs-bar';
                    tabs.style.display = 'flex';
                    tabs.style.gap = '8px';
                    tabs.style.margin = '8px 0';
                    tabs.style.alignItems = 'center';
                    tabs.style.fontFamily = 'sans-serif';
                    const lab = document.createElement('span');
                    lab.textContent = 'Vista:';
                    lab.style.color = '#333';
                    lab.style.fontSize = '14px';
                    const b1 = document.createElement('button');
                    b1.id = 'tab-online-p1';
                    b1.textContent = (window.onlinePlayers.p1 && window.onlinePlayers.p1.name) ? `Jugador 1: ${window.onlinePlayers.p1.name}` : 'Jugador 1';
                    const b2 = document.createElement('button');
                    b2.id = 'tab-online-p2';
                    b2.textContent = (window.onlinePlayers.p2 && window.onlinePlayers.p2.name) ? `Jugador 2: ${window.onlinePlayers.p2.name}` : 'Jugador 2';
                    tabs.appendChild(lab);
                    tabs.appendChild(b1);
                    tabs.appendChild(b2);
                    // insertar pestañas antes del canvas principal
                    document.body.insertBefore(tabs, self.canvas);
                    // estado inicial
                    if (!window.onlineActiveView) window.onlineActiveView = 'p1';
                    function applyView() {
                        const view = window.onlineActiveView || 'p1';
                        try {
                            // mostrar solo una "pantalla" a la vez
                            if (view === 'p1') {
                                self.canvas.style.display = 'block';
                                self.canvas.style.marginRight = '0px';
                                if (self.canvasMirror) self.canvasMirror.style.display = 'none';
                            } else {
                                if (self.canvasMirror) self.canvasMirror.style.display = 'block';
                                if (self.canvas) self.canvas.style.display = 'none';
                            }
                        } catch (e) {}
                        // resaltar pestañas
                        try {
                            b1.disabled = (view === 'p1');
                            b2.disabled = (view !== 'p1');
                        } catch (e) {}
                    }
                    b1.addEventListener('click', function(){ window.onlineActiveView = 'p1'; applyView(); });
                    b2.addEventListener('click', function(){ window.onlineActiveView = 'p2'; applyView(); });
                    applyView();
                } else {
                    // si ya existe barra, asegurar que esté visible y aplicar la vista actual
                    tabs.style.display = 'flex';
                    if (!window.onlineActiveView) window.onlineActiveView = 'p1';
                    const view = window.onlineActiveView;
                    try {
                        if (view === 'p1') {
                            this.canvas.style.display = 'block';
                            this.canvas.style.marginRight = '0px';
                            if (this.canvasMirror) this.canvasMirror.style.display = 'none';
                        } else {
                            if (this.canvasMirror) this.canvasMirror.style.display = 'block';
                            if (this.canvas) this.canvas.style.display = 'none';
                        }
                    } catch (e) {}
                }

                // Abrir una segunda pestaña/ventana HTML para la vista del Jugador 2
                try {
                    // crear si no existe o si fue cerrada
                    if (!this.viewerWin || this.viewerWin.closed) {
                        this.viewerWin = window.open('', 'Tank1990_Online_P2');
                        if (this.viewerWin) {
                            const title = (window.onlinePlayers.p2 && window.onlinePlayers.p2.name) ? `Jugador 2: ${window.onlinePlayers.p2.name}` : 'Jugador 2';
                            const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${title}</title><style>html,body{margin:0;padding:0;background:#111;color:#eee;font-family:sans-serif}#bar{display:flex;align-items:center;gap:8px;padding:6px 8px;background:#222;border-bottom:1px solid #333}#name{font-weight:bold;color:#fff}#wrap{display:flex;justify-content:center;padding:8px}button{background:#0af;color:#001;border:none;border-radius:6px;padding:6px 10px;cursor:pointer}button:focus{outline:2px solid #fff}</style></head><body><div id="bar">Vista: <span id="name">${title}</span> <button id="focus">Tomar Controles</button> <button id="p2-pause">Pausar</button> <button id="p2-end">Terminar</button></div><div id="wrap"><canvas id="viewer-canvas" width="${HUD_CANVAS_WIDTH}" height="${HUD_CANVAS_HEIGHT}" style="border:1px solid #0af;background:#000"></canvas></div><script>(function(){function send(type,p){try{if(window.opener){window.opener.postMessage(Object.assign({type:type},p||{}),'*');}}catch(e){}}function isP2(c){return c===65||c===68||c===87||c===83||c===70;}window.addEventListener('keydown',function(e){var c=e.keyCode||e.which;if(isP2(c)){e.preventDefault();send('TANK1990_P2_KEY',{code:c,down:true});}});window.addEventListener('keyup',function(e){var c=e.keyCode||e.which;if(isP2(c)){e.preventDefault();send('TANK1990_P2_KEY',{code:c,down:false});}});window.addEventListener('blur',function(){send('TANK1990_P2_RESET',{});});window.addEventListener('beforeunload',function(){send('TANK1990_P2_RESET',{});});try{document.body.tabIndex=0;document.body.focus();}catch(e){}var fb=document.getElementById('focus');if(fb){fb.addEventListener('click',function(){try{document.body.focus();window.focus();}catch(e){}});}var pb=document.getElementById('p2-pause');if(pb){pb.addEventListener('click',function(){send('TANK1990_P2_CMD',{cmd:'pauseToggle'});});}var eb=document.getElementById('p2-end');if(eb){eb.addEventListener('click',function(){send('TANK1990_P2_CMD',{cmd:'endGame'});});}})();</script></body></html>`;
                            this.viewerWin.document.open();
                            this.viewerWin.document.write(html);
                            this.viewerWin.document.close();
                            this.viewerCanvas = this.viewerWin.document.getElementById('viewer-canvas');
                            this.viewerCtx = this.viewerCanvas ? this.viewerCanvas.getContext('2d') : null;
                        }
                    } else {
                        // refrescar referencias por si se recargó
                        this.viewerCanvas = this.viewerWin.document.getElementById('viewer-canvas');
                        this.viewerCtx = this.viewerCanvas ? this.viewerCanvas.getContext('2d') : null;
                    }
                    // si abrimos pestaña externa, ocultar barra de pestañas interna y canvas espejo
                    const tabsBar = document.getElementById('online-tabs-bar');
                    if (tabsBar) tabsBar.style.display = 'none';
                    if (this.canvasMirror) this.canvasMirror.style.display = 'none';
                    // asegurar que el canvas principal esté visible
                    this.canvas.style.display = 'block';
                    // Vincular recepción de eventos de teclado desde la pestaña externa (Jugador 2)
                    try {
                        if (!window.__tank1990P2MsgBound) {
                            window.addEventListener('message', function(ev){
                                if (!ev || !ev.data || !ev.data.type) return;
                                // aceptar solo mensajes de la ventana del visor si está definida
                                if (myGameArea.viewerWin && ev.source !== myGameArea.viewerWin) return;
                                if (!myGameArea.keys) myGameArea.keys = [];
                                if (ev.data.type === 'TANK1990_P2_KEY') {
                                    const code = ev.data.code;
                                    const down = !!ev.data.down;
                                    if (typeof code === 'number') { myGameArea.keys[code] = down; }
                                } else if (ev.data.type === 'TANK1990_P2_RESET') {
                                    [65,68,87,83,70].forEach(function(k){ myGameArea.keys[k] = false; });
                                } else if (ev.data.type === 'TANK1990_P2_CMD') {
                                    const cmd = ev.data.cmd;
                                    if (cmd === 'pauseToggle') {
                                        myGameArea.paused = !myGameArea.paused;
                                        try { if (typeof window !== 'undefined' && typeof window.showGameControls === 'function') { const overlay = document.getElementById('pause-overlay'); if (overlay) overlay.style.display = myGameArea.paused ? 'flex' : 'none'; const btn = document.getElementById('btn-pause-toggle'); if (btn) btn.textContent = myGameArea.paused ? 'Reanudar' : 'Pausar'; } } catch (e) {}
                                    } else if (cmd === 'endGame') {
                                        try { end_game(false); } catch (e) { if (window.end_game) window.end_game(false); }
                                    }
                                }
                            });
                            window.__tank1990P2MsgBound = true;
                        }
                    } catch (e) {}
                } catch (e) {}
            } else {
                // si no es online, asegurar limpiar referencias
                this.canvasMirror = null;
                this.contextMirror = null;
                // ocultar barra de pestañas si estuviera presente
                try {
                    const tabs = document.getElementById('online-tabs-bar');
                    if (tabs) tabs.style.display = 'none';
                } catch (e) {}
                // cerrar pestaña externa si existiera
                try {
                    if (this.viewerWin && !this.viewerWin.closed) this.viewerWin.close();
                } catch (e) {}
                this.viewerWin = null;
                this.viewerCanvas = null;
                this.viewerCtx = null;
            }
        } catch (e) {}
        //se declara el intervalo en el que se va a actualizar el area de juego "en milisegundos"
        this.interval = setInterval(myGameArea.updateGameArea, 12);
        //se declara el tanque jugador, con sus estadisticas
        this.eagle = null;
        this.eagleShield = [];
        this.jugador = new Tanque(10, 3, player, 0, BASE_CONFIG.playerStart.col * CELL_SIZE, BASE_CONFIG.playerStart.row * CELL_SIZE, "j", 0, [0, 1], 1, new Bala(100, 1, bullet, 0, 0, 0, 2, [0, 1], "j"));
        //se declaran las listas de elementos en el area de juego
        this.bloques = [];
        this.tanques = [];
        this.balas = [];
        this.minas = [];
        this.objs_contacto = [];
        this.objs_distancia = [];
        this.pendingAttackers = [];
        this.activeAttackers = [];
        this.attackGroupSize = 2;
        // Bonos
        this.bonos = [];
        const defaultBonusDurations = { shield: 10, power: 10, slow: 10, bomb: 0, baseShield: 10 };
        let configuredDurations = null;
        try {
            if (typeof window !== 'undefined' && window.bonusDurations && typeof window.bonusDurations === 'object') {
                configuredDurations = window.bonusDurations;
            }
        } catch (e) {}
        this.bonusDurations = { ...defaultBonusDurations, ...(configuredDurations || {}) }; // en segundos
        const spawnCfg = (typeof window !== 'undefined' && window.bonusSpawnSettings) ? window.bonusSpawnSettings : null;
        const maxItemsCfg = spawnCfg && typeof spawnCfg.maxItems === 'number' ? Math.floor(spawnCfg.maxItems) : null;
        const intervalCfg = spawnCfg && typeof spawnCfg.intervalMs === 'number' ? Math.floor(spawnCfg.intervalMs) : null;
        const jitterCfg = spawnCfg && typeof spawnCfg.jitterMs === 'number' ? Math.floor(spawnCfg.jitterMs) : null;
        const burstCfg = spawnCfg && typeof spawnCfg.burst === 'number' ? Math.floor(spawnCfg.burst) : null;
        this.maxBonusItems = Math.max(2, maxItemsCfg !== null ? maxItemsCfg : 4);
        this.bonusSpawnIntervalMs = Math.max(4000, intervalCfg !== null ? intervalCfg : 12000);
        this.bonusSpawnJitterMs = Math.max(0, jitterCfg !== null ? jitterCfg : 4000);
        this.bonusSpawnBurst = Math.max(1, burstCfg !== null ? burstCfg : 2);
        this.nextBonusSpawnAt = Date.now() + Math.max(3000, Math.floor(this.bonusSpawnIntervalMs * 0.5));
        this.enemyTimeStopUntil = 0;
        this.enemySlowUntil = 0;
        this.baseShieldActive = false;
        this.baseShieldUntil = 0;
        this.baseCellsSet = new Set();
        this.baseTargetCells = [];
        this.baseTargetSet = new Set();
        this.basicTierPattern = [];
        this.basicTierIndex = 0;
        if (this.basicTierCounts) {
            const baseTierTotal =
                (this.basicTierCounts.type1 || 0) +
                (this.basicTierCounts.type2 || 0) +
                (this.basicTierCounts.definitivo || 0);
            this.basicTierQueue = this.buildBasicTierDeckFromCounts(this.basicTierCounts, baseTierTotal);
        } else {
            this.basicTierQueue = Array.isArray(basicTierSequence) ? basicTierSequence.slice() : null;
        }
        this.basicTierLast = 'type1';
        //se integran todas las listas de elementos a actualizar en una sola lista
        this.updateList = [this.bloques, this.objs_contacto, this.minas, this.tanques, this.balas, this.objs_distancia];
        this.radar = [];//matriz logica q contendra el valor de cada posicion
        this.clock = 1;//reloj interno del juego, lleva el conteo de cada vez que se realiza un update
        this.context.font = "bolder 20px sans-serif";//fuente usada para las letras
        //se declaran los listener de las acciones del usuario
        let detectedLevel = 1;
        try {
            if (typeof window !== 'undefined' && window.lastLevel) {
                detectedLevel = window.lastLevel;
            } else if (this.level) {
                detectedLevel = this.level;
            }
        } catch (e) {
            if (this.level) {
                detectedLevel = this.level;
            }
        }
        this.level = detectedLevel;
        this.initBasicTierPattern(detectedLevel);
        window.addEventListener('keydown', function (e) {
            myGameArea.keys = (myGameArea.keys || []);
            const code = e.keyCode;
            try {
                // En modo Online real (no Duo local), ignorar teclas del Jugador 2 (A,D,W,S,F)
                if (typeof window !== 'undefined' && window.onlinePlayers && (!window.localMode || window.localMode !== 'duo')) {
                    if (code === 65 || code === 68 || code === 87 || code === 83 || code === 70) {
                        return;
                    }
                }
            } catch (err) {}
            myGameArea.keys[code] = true;
        });
        window.addEventListener('keyup', function (e) {
            const code = e.keyCode;
            try {
                // En modo Online real (no Duo local), ignorar teclas del Jugador 2 (A,D,W,S,F)
                if (typeof window !== 'undefined' && window.onlinePlayers && (!window.localMode || window.localMode !== 'duo')) {
                    if (code === 65 || code === 68 || code === 87 || code === 83 || code === 70) {
                        return;
                    }
                }
            } catch (err) {}
            myGameArea.keys[code] = false;
        });
        myGameArea.setRadar(densidadX, densidadY);//se inicializa el area de juego, con las densidades de bloques horizontales y verticales en un rango de 0-100%
        try {
            const initialBonus = Math.min(this.maxBonusItems || 1, 2);
            for (let i = 0; i < initialBonus; i++) {
                this.spawnBonus();
            }
        } catch (e) {}
        this.nextBonusSpawnAt = Date.now() + this.getBonusSpawnInterval();

        // Si el modo es Duo, crear un segundo jugador y aplicar colores elegidos
        try {
            if (typeof window !== 'undefined' && window.localMode === 'duo' && window.player1 && window.player2) {
                // aplicar color al jugador 1 si se definió
                if (window.player1.color) this.jugador._tint = ensureTintOpacity(window.player1.color);

                // buscar una casilla libre candidata para jugador 2
                const farCorner = GRID_BOUNDARY - 1;
                const nearEdge = 1;
                const candidatos = [
                    [farCorner, farCorner],
                    [farCorner, nearEdge],
                    [nearEdge, farCorner],
                    [farCorner - 1, farCorner - 1],
                    [farCorner - 1, nearEdge + 1],
                    [nearEdge + 1, farCorner - 1],
                    [GRID_HALF, GRID_HALF]
                ];
                let sx = farCorner, sy = farCorner;
                for (let i = 0; i < candidatos.length; i++) {
                    const c = candidatos[i];
                    if (this.radar[c[0]] && this.radar[c[0]][c[1]] === null) { sx = c[0]; sy = c[1]; break; }
                }
                this.jugador2 = new Tanque(10, 3, player, 0, sx * CELL_SIZE, sy * CELL_SIZE, 'j', 0, [0, -1], 1,
                    new Bala(100, 1, bullet, 0, 0, 0, 2, [0, 1], 'j'));
                if (window.player2.color) this.jugador2._tint = ensureTintOpacity(window.player2.color);
            } else if (typeof window !== 'undefined' && window.onlinePlayers && window.onlinePlayers.p1 && window.onlinePlayers.p2) {
                // Modo Online: dos jugadores con colores elegidos
                const p1 = window.onlinePlayers.p1;
                const p2 = window.onlinePlayers.p2;
                if (p1 && p1.color) this.jugador._tint = ensureTintOpacity(p1.color);

                // buscar una casilla libre candidata para jugador 2
                const farCorner = GRID_BOUNDARY - 1;
                const nearEdge = 1;
                const candidatos = [
                    [farCorner, farCorner],
                    [farCorner, nearEdge],
                    [nearEdge, farCorner],
                    [farCorner - 1, farCorner - 1],
                    [farCorner - 1, nearEdge + 1],
                    [nearEdge + 1, farCorner - 1],
                    [GRID_HALF, GRID_HALF]
                ];
                let sx = farCorner, sy = farCorner;
                for (let i = 0; i < candidatos.length; i++) {
                    const c = candidatos[i];
                    if (this.radar[c[0]] && this.radar[c[0]][c[1]] === null) { sx = c[0]; sy = c[1]; break; }
                }
                this.jugador2 = new Tanque(10, 3, player, 0, sx * CELL_SIZE, sy * CELL_SIZE, 'j', 0, [0, -1], 1,
                    new Bala(100, 1, bullet, 0, 0, 0, 2, [0, 1], 'j'));
                if (p2 && p2.color) this.jugador2._tint = ensureTintOpacity(p2.color);
            }
        } catch (e) {}
    },
    setAttackGroupSize: function (level) {
        let size = 2;
        if (level >= 3) {
            size = 4;
        } else if (level === 2) {
            size = 3;
        }
        this.attackGroupSize = size;
        this.updateAttackAssignments();
    },
    buildBasicTierDeckFromCounts: function (counts, fallbackTotal) {
        const safeCounts = counts ? {
            type1: counts.type1 || 0,
            type2: counts.type2 || 0,
            definitivo: counts.definitivo || 0
        } : { type1: 0, type2: 0, definitivo: 0 };
        let remaining = (typeof fallbackTotal === 'number' && fallbackTotal >= 0)
            ? fallbackTotal
            : (safeCounts.type1 + safeCounts.type2 + safeCounts.definitivo);
        const assigned = { type1: 0, type2: 0, definitivo: 0 };
        const order = ['type1', 'type2', 'definitivo'];
        for (let i = 0; i < order.length && remaining > 0; i++) {
            const key = order[i];
            const desired = Math.min(safeCounts[key], remaining);
            assigned[key] = desired;
            remaining -= desired;
        }
        if (remaining > 0) {
            assigned.type1 += remaining;
            remaining = 0;
        }
        const deck = [];
        for (let i = 0; i < order.length; i++) {
            const key = order[i];
            for (let j = 0; j < assigned[key]; j++) {
                deck.push(key);
            }
        }
        return shuffleArray(deck);
    },
    registerEnemy: function (tank) {
        if (!tank) return;
        if (!this.activeAttackers) this.activeAttackers = [];
        if (this.activeAttackers.indexOf(tank) === -1) {
            this.activeAttackers.push(tank);
        }
        if (!this.pendingAttackers) this.pendingAttackers = [];
        const pendingIdx = this.pendingAttackers.indexOf(tank);
        if (pendingIdx !== -1) {
            this.pendingAttackers.splice(pendingIdx, 1);
        }
        this.updateAttackAssignments();
    },
    removeEnemy: function (tank) {
        if (!tank) return;
        if (this.pendingAttackers) {
            const idx = this.pendingAttackers.indexOf(tank);
            if (idx !== -1) this.pendingAttackers.splice(idx, 1);
        }
        if (this.activeAttackers) {
            const idx = this.activeAttackers.indexOf(tank);
            if (idx !== -1) this.activeAttackers.splice(idx, 1);
        }
        this.updateAttackAssignments();
        if (!this.gameOver) {
            this.scheduleEnemyRefill();
        }
    },
    updateAttackAssignments: function () {
        if (!this.tanques) return;
        this.activeAttackers = this.tanques.slice();
        this.pendingAttackers = [];
    },
    isActiveAttacker: function (tank) {
        if (!this.tanques) return false;
        return this.tanques.indexOf(tank) !== -1;
    },
    prepareBaseTargets: function () {
        this.baseCellsSet = new Set();
        this.baseTargetCells = [];
        this.baseTargetSet = new Set();
        const baseCells = [BASE_CONFIG.eagle].concat(BASE_CONFIG.shield || []);
        for (let i = 0; i < baseCells.length; i++) {
            this.baseCellsSet.add(`${baseCells[i].row},${baseCells[i].col}`);
        }
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (let i = 0; i < baseCells.length; i++) {
            for (let j = 0; j < dirs.length; j++) {
                const nr = baseCells[i].row + dirs[j][0];
                const nc = baseCells[i].col + dirs[j][1];
                if (nr <= 0 || nr >= GRID_BOUNDARY || nc <= 0 || nc >= GRID_BOUNDARY) continue;
                const key = `${nr},${nc}`;
                if (this.baseCellsSet.has(key) || this.baseTargetSet.has(key)) continue;
                this.baseTargetCells.push({ row: nr, col: nc });
                this.baseTargetSet.add(key);
            }
        }
    },
    isBaseCell: function (row, col) {
        if (!this.baseCellsSet) return false;
        return this.baseCellsSet.has(`${row},${col}`);
    },
    isBaseTargetCell: function (row, col) {
        if (!this.baseTargetSet) return false;
        return this.baseTargetSet.has(`${row},${col}`);
    },
    directionTowardsBase: function (row, col) {
        if (!this.baseCellsSet) return null;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (let i = 0; i < dirs.length; i++) {
            const nr = row + dirs[i][0];
            const nc = col + dirs[i][1];
            if (this.baseCellsSet.has(`${nr},${nc}`)) {
                return [dirs[i][1], dirs[i][0]];
            }
        }
        const base = BASE_CONFIG.eagle;
        const dx = Math.sign(base.col - col);
        const dy = Math.sign(base.row - row);
        if (Math.abs(base.col - col) >= Math.abs(base.row - row)) {
            return [dx, 0];
        }
        return [0, dy];
    },
    cellToPixel: function (row, col, width) {
        const offset = (CELL_SIZE - width) / 2;
        return [col * CELL_SIZE + offset, row * CELL_SIZE + offset];
    },
    clear: function () {
        //funcion que limpia la pantalla de juego
        this.context.fillStyle = "#cccccc";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    initBasicTierPattern: function (level) {
        if (this.basicTierQueue && this.basicTierQueue.length > 0) {
            const unique = [];
            for (let i = 0; i < this.basicTierQueue.length; i++) {
                const tier = this.basicTierQueue[i];
                if (unique.indexOf(tier) === -1) {
                    unique.push(tier);
                }
            }
            this.basicTierPattern = unique.length > 0 ? unique : ['type1'];
            this.basicTierIndex = 0;
            this.basicTierLast = this.basicTierQueue[0] || 'type1';
            return;
        }
        let pattern = ['type1'];
        if (level === 2) {
            pattern = ['type1', 'type2'];
        } else if (level >= 3) {
            pattern = ['type1', 'type2', 'definitivo'];
        }
        this.basicTierPattern = pattern;
        this.basicTierIndex = 0;
        this.basicTierLast = pattern[0] || 'type1';
    },

    nextBasicTier: function () {
        if (this.basicTierQueue && this.basicTierQueue.length > 0) {
            const tierFromQueue = this.basicTierQueue.shift();
            if (tierFromQueue) {
                this.basicTierLast = tierFromQueue;
                return tierFromQueue;
            }
        }
        if (!this.basicTierPattern || this.basicTierPattern.length === 0) {
            this.basicTierPattern = ['type1'];
            this.basicTierIndex = 0;
        }
        const tier = this.basicTierPattern[this.basicTierIndex % this.basicTierPattern.length];
        this.basicTierIndex = (this.basicTierIndex + 1) % this.basicTierPattern.length;
        this.basicTierLast = tier;
        return tier;
    },

    applyEnemyAppearance: function (tank, tier) {
        if (!tank) return;
        const assignedTier = tier || 'type1';
        tank.enemyTier = assignedTier;
        let tint = null;
        switch (assignedTier) {
            case 'type2':
                tint = 'rgba(33, 150, 243, 0.3)';
                break;
            case 'type4':
                tint = 'rgba(76, 175, 80, 0.3)';
                break;
            case 'definitivo':
                tint = 'rgba(244, 67, 54, 0.3)';
                break;
            default:
                tint = null;
        }
        tank._tint = tint;
        if (assignedTier === 'type3') {
            if (typeof scout !== 'undefined' && scout) {
                tank._sprite = scout;
            }
        } else if (typeof basic !== 'undefined' && basic) {
            tank._sprite = basic;
        }
    },
    prepareEnemySpawnPool: function () {
        const pool = [];
        const baseCounts = {
            type1: (this.tank_counter && this.tank_counter.type1) || 0,
            type2: (this.tank_counter && this.tank_counter.type2) || 0,
            definitivo: (this.tank_counter && this.tank_counter.definitivo) || 0
        };
        const baseTotal = baseCounts.type1 + baseCounts.type2 + baseCounts.definitivo;
        let basicDeck = [];
        if (baseTotal > 0) {
            if (Array.isArray(this.basicTierQueue) && this.basicTierQueue.length >= baseTotal) {
                basicDeck = this.basicTierQueue.slice(0, baseTotal);
            } else {
                basicDeck = this.buildBasicTierDeckFromCounts(this.basicTierCounts, baseTotal);
            }
            if (!Array.isArray(this.basicTierQueue) || this.basicTierQueue.length === 0) {
                this.basicTierQueue = basicDeck.slice();
            }
            for (let i = 0; i < basicDeck.length; i++) {
                const tier = basicDeck[i];
                if (DISABLED_ENEMY_TYPES[tier]) continue;
                pool.push({ kind: tier });
            }
        }
        const type3Total = (this.tank_counter && this.tank_counter.type3) || 0;
        if (!DISABLED_ENEMY_TYPES.type3) {
            for (let i = 0; i < type3Total; i++) {
                pool.push({ kind: 'type3' });
            }
        }
        const type4Total = (this.tank_counter && this.tank_counter.type4) || 0;
        if (!DISABLED_ENEMY_TYPES.type4) {
            for (let i = 0; i < type4Total; i++) {
                pool.push({ kind: 'type4' });
            }
        }
        this.enemyPool = shuffleArray(pool);
    },
    getRandomSpawnCell: function (options) {
        const opts = options || {};
        const minDistance = typeof opts.minDistanceFromBase === 'number' ? Math.max(0, Math.floor(opts.minDistanceFromBase)) : 0;
        const attemptLimit = typeof opts.maxAttempts === 'number' ? Math.max(1, Math.floor(opts.maxAttempts)) : 200;
        const baseCell = (BASE_CONFIG && BASE_CONFIG.eagle) ? BASE_CONFIG.eagle : { row: BASE_ROW, col: BASE_COL };
        const minRowsFromBottom = typeof opts.minDistanceFromBottom === 'number'
            ? Math.max(0, Math.floor(opts.minDistanceFromBottom))
            : 0;
        const maxRowLimit = GRID_BOUNDARY - (minRowsFromBottom + 1);
        if (maxRowLimit < 0) {
            return null;
        }
        const maxRow = Math.min(GRID_INNER_MAX, maxRowLimit);
        for (let attempt = 0; attempt < attemptLimit; attempt++) {
            let row = getRandomByRange(0, maxRow);
            let col;
            if (row >= GRID_HALF) {
                col = getRandomByRange(0, GRID_INNER_MAX);
            } else {
                col = getRandomByRange(GRID_HALF, GRID_INNER_MAX);
            }
            if (!this.radar[row] || this.radar[row][col] !== null) {
                continue;
            }
            if (minDistance > 0) {
                const distance = Math.abs(row - baseCell.row) + Math.abs(col - baseCell.col);
                if (distance < minDistance) {
                    continue;
                }
            }
            const cell = { row, col };
            // mantener compatibilidad con los usos existentes que esperan px/py
            cell.px = col;
            cell.py = row;
            return cell;
        }
        return null;
    },
    spawnEnemyEntry: function (entry) {
        if (!entry) return false;
        const cell = this.getRandomSpawnCell({ minDistanceFromBase: 8, minDistanceFromBottom: ENEMY_MIN_ROWS_FROM_BOTTOM });
        if (!cell) {
            this.enemyPool.unshift(entry);
            return false;
        }
        const row = cell.row;
        const col = cell.col;
        this.radar[row][col] = 't';
        let tank;
        const baseX = col * CELL_SIZE;
        const baseY = row * CELL_SIZE;
        switch (entry.kind) {
            case 'type3':
                tank = new Tanque(1, 10, scout, 10, baseX, baseY, 'type3', 0, [0, 1], 1,
                    new Bala(200, 3, bullet, 0, 0, 0, 1, [0, -1], 'type3'));
                break;
            case 'type4':
                tank = new Tanque(8, 10, basic, 12, baseX, baseY, 'type4', 0, [0, 1], 1,
                    new Bala(600, 4, bullet, 0, 0, 0, 3, [0, 1], 'type4'));
                break;
            case 'definitivo':
                tank = new Tanque(10, 1, basic, 15, baseX, baseY, 'definitivo', 0, [0, 1], 1,
                    new Bala(700, 4, bullet, 0, 0, 0, 4, [0, 1], 'definitivo'));
                break;
            case 'type2':
            case 'type1':
            default:
                tank = new Tanque(6, 10, basic, 10, baseX, baseY, entry.kind || 'type1', 0, [0, 1], 1,
                    new Bala(500, 4, bullet, 0, 0, 0, 2, [0, 1], entry.kind || 'type1'));
                break;
        }
        this.applyEnemyAppearance(tank, entry.kind);
        this.tanques.push(tank);
        this.registerEnemy(tank);
        return true;
    },
    fillEnemySlots: function (maxToSpawn) {
        if (this.gameOver) return;
        if (!Array.isArray(this.enemyPool)) return;
        if (this.enemySpawnLimit < 1) {
            this.enemySpawnLimit = 1;
        }
        const limit = (typeof maxToSpawn === 'number' && maxToSpawn > 0) ? Math.floor(maxToSpawn) : Number.POSITIVE_INFINITY;
        let spawned = 0;
        while (this.tanques.length < this.enemySpawnLimit && this.enemyPool.length > 0 && spawned < limit) {
            const entry = this.enemyPool.shift();
            if (!this.spawnEnemyEntry(entry)) {
                break;
            }
            spawned++;
        }
    },
    scheduleEnemyRefill: function () {
        if (this.gameOver) return;
        if (!Array.isArray(this.enemyPool) || this.enemyPool.length === 0) {
            return;
        }
        const delay = (typeof this.enemyRespawnDelay === 'number' && this.enemyRespawnDelay >= 0) ? this.enemyRespawnDelay : 2000;
        const timer = setTimeout(() => {
            const idx = this.enemySpawnTimers ? this.enemySpawnTimers.indexOf(timer) : -1;
            if (idx !== -1) {
                this.enemySpawnTimers.splice(idx, 1);
            }
            if (this.gameOver) return;
            this.fillEnemySlots(1);
        }, delay);
        this.enemySpawnTimers.push(timer);
    },
    clearEnemySpawnTimers: function () {
        if (this.enemySpawnTimers && this.enemySpawnTimers.length) {
            for (let i = 0; i < this.enemySpawnTimers.length; i++) {
                clearTimeout(this.enemySpawnTimers[i]);
            }
        }
        this.enemySpawnTimers = [];
    },

    // Devuelve una celda disponible sugerida para respawn del Jugador 2
    getP2SpawnCell: function () {
        const farCorner = GRID_BOUNDARY - 1;
        const nearEdge = 1;
        const candidatos = [
            [farCorner, farCorner],
            [farCorner, nearEdge],
            [nearEdge, farCorner],
            [farCorner - 1, farCorner - 1],
            [farCorner - 1, nearEdge + 1],
            [nearEdge + 1, farCorner - 1],
            [GRID_HALF, GRID_HALF]
        ];
        let row = farCorner, col = farCorner;
        for (let i = 0; i < candidatos.length; i++) {
            const c = candidatos[i];
            if (this.radar[c[0]] && this.radar[c[0]][c[1]] === null) { row = c[0]; col = c[1]; break; }
        }
        return { row, col };
    },

    // Intenta reponer (respawn) al jugador indicado.
    // Modelo de vidas: el contador incluye la vida actual.
    // - Si quedaban >1 vidas: se decrementa y se reaparece.
    // - Si quedaba 1 vida: se decrementa a 0 y NO hay respawn.
    // Retorna true solo si realizó respawn.
    tryRespawnPlayer: function (playerIndex) {
        try {
            if (playerIndex === 1 && this.jugador) {
                if (this.p1Lives > 1) {
                    this.p1Lives--;
                    const pos = this.cellToPixel(BASE_CONFIG.playerStart.row, BASE_CONFIG.playerStart.col, this.jugador.sprite.width);
                    this.jugador.x = pos[0];
                    this.jugador.y = pos[1];
                    this.jugador.vida = (typeof this.jugador.vidaMax === 'number' && this.jugador.vidaMax > 0) ? this.jugador.vidaMax : 10;
                    this.jugador.recarga = 0;
                    this.jugador._direccion = [0, 1];
                    return true;
                } else if (this.p1Lives === 1) {
                    // última vida consumida, no hay respawn
                    this.p1Lives = 0;
                    return false;
                }
                return false;
            } else if (playerIndex === 2 && this.jugador2) {
                if (this.p2Lives > 1) {
                    this.p2Lives--;
                    const where = this.getP2SpawnCell();
                    const pos = this.cellToPixel(where.row, where.col, this.jugador2.sprite.width);
                    this.jugador2.x = pos[0];
                    this.jugador2.y = pos[1];
                    this.jugador2.vida = (typeof this.jugador2.vidaMax === 'number' && this.jugador2.vidaMax > 0) ? this.jugador2.vidaMax : 10;
                    this.jugador2.recarga = 0;
                    this.jugador2._direccion = [0, -1];
                    return true;
                } else if (this.p2Lives === 1) {
                    this.p2Lives = 0;
                    return false;
                }
                return false;
            }
        } catch (e) { }
        return false;
    },

    // Retorna conteo global de enemigos restantes por derrotar (según dificultad)
    getEnemiesRemaining: function () {
        if (!this.tank_counter) return 0;
        const counts = this.tank_counter;
        const c1 = typeof counts.type1 === 'number' ? counts.type1 : 0;
        const c2 = typeof counts.type2 === 'number' ? counts.type2 : 0;
        const c3 = typeof counts.type3 === 'number' ? counts.type3 : 0;
        const c4 = typeof counts.type4 === 'number' ? counts.type4 : 0;
        const cd = typeof counts.definitivo === 'number' ? counts.definitivo : 0;
        return c1 + c2 + c3 + c4 + cd;
    },

    // Calcula la cantidad de enemigos destruidos
    getEnemiesDestroyed: function () {
        const init = this.initial_tank_counter || { type1: 0, type2: 0, type3: 0, type4: 0, definitivo: 0 };
        const cur = this.tank_counter || { type1: 0, type2: 0, type3: 0, type4: 0, definitivo: 0 };
        const diff = (key) => Math.max(0, (init[key] || 0) - (cur[key] || 0));
        return diff('type1') + diff('type2') + diff('type3') + diff('type4') + diff('definitivo');
    },

    // Muestra con íconos (sprites existentes) la cantidad restante por tipo
    drawRemainingEnemiesIcons: function () {
        try {
            const ctx = this.context;
            const thumb = 12; // tamaño del icono
            const gap = 2;    // separación entre íconos
            const maxPerRow = Math.max(1, Math.floor(RADAR_SIZE / (thumb + gap)));
            let x = HUD_X;
            let y = HUD_OBJECTIVE_ICON_Y + 40; // debajo de objetivos

            const counts = this.tank_counter || {};
            const entries = [
                { sprite: basic, count: counts.type1 || 0, tint: null },
                { sprite: basic, count: counts.type2 || 0, tint: 'rgba(33, 150, 243, 0.3)' },
                { sprite: scout, count: counts.type3 || 0, tint: null },
                { sprite: basic, count: counts.type4 || 0, tint: 'rgba(76, 175, 80, 0.3)' },
                { sprite: basic, count: counts.definitivo || 0, tint: 'rgba(244, 67, 54, 0.3)' }
            ];

            for (let e = 0; e < entries.length; e++) {
                const spr = entries[e].sprite;
                let remaining = Math.max(0, entries[e].count | 0);
                if (!spr || remaining <= 0) {
                    // avanzar una fila vacía para mantener bloques alineados
                    y += (thumb + gap);
                    continue;
                }
                const img = spr.get_dir([0, -1]);
                const tint = entries[e].tint;
                let rowCount = 0;
                while (remaining > 0) {
                    if (tint) {
                        drawTintedImage(ctx, img, x, y, thumb, tint);
                    } else {
                        ctx.drawImage(img, x, y, thumb, thumb);
                    }
                    remaining--;
                    rowCount++;
                    if (rowCount >= maxPerRow) {
                        // siguiente fila
                        rowCount = 0;
                        x = HUD_X;
                        y += (thumb + gap);
                    } else {
                        x += (thumb + gap);
                    }
                }
                // al terminar un tipo, saltar a nueva fila para separar grupos
                if (rowCount !== 0) {
                    // cerrar fila parcial
                    rowCount = 0;
                    x = HUD_X;
                    y += (thumb + gap);
                } else {
                    // ya está al inicio de fila
                    x = HUD_X;
                }
            }
        } catch (e) { }
    },

    // Temporizador de partida: dibuja mm:ss y dispara tick por minuto
    drawGameTimer: function () {
        try {
            const ctx = this.context;
            const start = (typeof this.startTime === 'number') ? this.startTime : Date.now();
            const elapsed = Math.max(0, Math.floor((Date.now() - start) / 1000));
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const d2 = (n) => (n < 10 ? '0' + n : '' + n);
            // tick por minuto (útil para bonus cada minuto)
            if (typeof this.lastTimerMinute !== 'number') this.lastTimerMinute = -1;
            if (minutes > this.lastTimerMinute) {
                this.lastTimerMinute = minutes;
                try { if (typeof this.onMinuteTick === 'function') this.onMinuteTick(minutes, this); } catch (e) {}
            }
            ctx.save();
            ctx.fillStyle = '#005122';
            ctx.font = 'bold 18px sans-serif';
            // Posición: un poco más arriba debajo del radar
            const ty = HUD_RADAR_Y + RADAR_SIZE + 16;
            ctx.fillText('Tiempo: ' + d2(minutes) + ':' + d2(seconds), HUD_X, ty);
            ctx.restore();
        } catch (e) {}
    },

    // Obtiene el sprite asociado a un tipo de bonus
    getBonusSprite: function(kind) {
        try {
            if (kind === 'shield') {
                if (typeof bonus_shield !== 'undefined' && bonus_shield) return bonus_shield;
                return bonus_defense;
            }
            if (kind === 'power') {
                return target_0;
            }
            if (kind === 'slow') {
                if (typeof bonus_timeStop !== 'undefined' && bonus_timeStop) return bonus_timeStop;
                return bonus_bomb;
            }
            if (kind === 'bomb') {
                if (typeof bonus_bomb !== 'undefined' && bonus_bomb) return bonus_bomb;
                return bonus_timeStop;
            }
            if (kind === 'baseShield') {
                if (typeof bonus_defense !== 'undefined' && bonus_defense) return bonus_defense;
                return bonus_shield;
            }
        } catch (e) {}
        return (typeof bonus_shield !== 'undefined') ? bonus_shield : target_0;
    },

    activateEnemyTimeStop: function(seconds) {
        try {
            const baseSeconds = (typeof seconds === 'number' && !Number.isNaN(seconds)) ? seconds : (this.bonusDurations && typeof this.bonusDurations.slow === 'number' ? this.bonusDurations.slow : 10);
            const secs = Math.max(1, Math.floor(baseSeconds));
            const until = Date.now() + secs * 1000;
            const current = (typeof this.enemyTimeStopUntil === 'number' ? this.enemyTimeStopUntil : 0);
            const target = Math.max(current, until);
            this.enemyTimeStopUntil = target;
            this.enemySlowUntil = target;
        } catch (e) {}
    },

    isEnemyTimeStopped: function() {
        try {
            const until = (typeof this.enemyTimeStopUntil === 'number') ? this.enemyTimeStopUntil : (typeof this.enemySlowUntil === 'number' ? this.enemySlowUntil : 0);
            return until > Date.now();
        } catch (e) {
            return false;
        }
    },

    // Clase utilitaria: Bonus en el mapa (si no existiera)
    createBonusItem: function(kind, x, y, durationSec){
        try {
            const item = {
                _kind: kind,
                _x: x, _y: y,
                _vida: 1,
                _duration: (typeof durationSec === 'number' ? durationSec : 10),
                get x(){ return this._x; }, set x(v){ this._x = v; },
                get y(){ return this._y; }, set y(v){ this._y = v; },
                get vida(){ return this._vida; }, set vida(v){ this._vida = v; },
                get sprite(){
                    try {
                        if (myGameArea && typeof myGameArea.getBonusSprite === 'function') {
                            const spr = myGameArea.getBonusSprite(this._kind);
                            if (spr) return spr;
                        }
                    } catch (e) {}
                    return target_0;
                },
                update: function(){
                    try {
                        const spr = this.sprite; if (!spr) return;
                        myGameArea.context.drawImage(spr.get_dir([0,0]), this._x, this._y);
                        const w = (typeof spr.width === 'number' ? spr.width : CELL_SIZE);
                        const mx1 = this._x, mx2 = this._x + w, my1 = this._y, my2 = this._y + w;
                        const hit = (tank)=>{ if(!tank) return false; const tw=tank.sprite.width; const tx1=tank.x,tx2=tank.x+tw,ty1=tank.y,ty2=tank.y+tw; return interseccion([mx1,mx2],[my1,my2],[tx1,tx2],[ty1,ty2]); };
                        let picked = null; if (hit(myGameArea.jugador)) picked = myGameArea.jugador; else if (myGameArea.jugador2 && hit(myGameArea.jugador2)) picked = myGameArea.jugador2;
                        if (picked) {
                            const secs = Math.max(1, Math.floor(this._duration));
                            if (this._kind === 'shield' && picked.applyShield) picked.applyShield(secs);
                            else if (this._kind === 'power' && picked.applyPower) picked.applyPower(secs);
                            else if (this._kind === 'slow' && typeof myGameArea.activateEnemyTimeStop === 'function') myGameArea.activateEnemyTimeStop(secs);
                            else if (this._kind === 'bomb' && typeof myGameArea.triggerBombBonus === 'function') myGameArea.triggerBombBonus();
                            else if (this._kind === 'baseShield' && typeof myGameArea.activateBaseShield === 'function') myGameArea.activateBaseShield(secs);
                            try{ point.play(); }catch(e){}
                            this._vida = 0;
                        }
                    } catch (e) {}
                }
            };
            return item;
        } catch (e) { return null; }
    },

    // Spawnea un bonus de tipo: 'shield' | 'power' | 'slow'
    spawnBonus: function(type){
        try {
            const allowed = ['shield','power','slow','bomb','baseShield'];
            const t = (allowed.indexOf(type) !== -1) ? type : allowed[getRandomByRange(0, allowed.length-1)];
            // buscar una celda libre
            const cell = this.getRandomSpawnCell && this.getRandomSpawnCell();
            if (!cell) return false;
            const spr = (typeof this.getBonusSprite === 'function') ? this.getBonusSprite(t) : null;
            const w = (spr && typeof spr.width === 'number') ? spr.width : CELL_SIZE;
            const off = (CELL_SIZE - w) / 2;
            const pos = [cell.col * CELL_SIZE + off, cell.row * CELL_SIZE + off];
            let duration = (this.bonusDurations && typeof this.bonusDurations[t] === 'number') ? this.bonusDurations[t] : 10;
            if (t === 'shield' && (!this.bonusDurations || typeof this.bonusDurations.shield !== 'number')) {
                duration = getRandomByRange(10, 15);
            }
            const itemFactory = (typeof BonusItem === 'function') ? (kind,x,y,d)=> new BonusItem(kind,x,y,d) : this.createBonusItem.bind(this);
            const item = itemFactory(t, pos[0], pos[1], duration);
            if (!item) return false;
            this.bonos.push(item);
            return true;
        } catch (e) { return false; }
    },

    // Spawnea aleatorio
    spawnRandomBonus: function(){ return this.spawnBonus(); },

    // Calcula el intervalo (con variación) para el próximo bonus
    getBonusSpawnInterval: function(){
        try {
            const base = (typeof this.bonusSpawnIntervalMs === 'number' && this.bonusSpawnIntervalMs > 0)
                ? Math.floor(this.bonusSpawnIntervalMs)
                : 20000;
            const jitter = (typeof this.bonusSpawnJitterMs === 'number' && this.bonusSpawnJitterMs >= 0)
                ? Math.floor(this.bonusSpawnJitterMs)
                : Math.floor(base * 0.3);
            if (jitter <= 0) {
                return Math.max(1000, base);
            }
            const delta = getRandomByRange(-jitter, jitter);
            return Math.max(1000, base + delta);
        } catch (e) {
            return 20000;
        }
    },

    // Controla la aparición frecuente de bonus
    maybeSpawnBonuses: function(){
        try {
            if (!Array.isArray(this.bonos)) this.bonos = [];
            const now = Date.now();
            if (typeof this.nextBonusSpawnAt !== 'number') {
                this.nextBonusSpawnAt = now + this.getBonusSpawnInterval();
            }
            const maxItemsRaw = (typeof this.maxBonusItems === 'number') ? Math.floor(this.maxBonusItems) : 1;
            const maxItems = Math.max(1, maxItemsRaw);
            if (this.bonos.length >= maxItems) {
                return;
            }
            if (now >= this.nextBonusSpawnAt) {
                const missing = Math.max(1, maxItems - this.bonos.length);
                const burstRaw = (typeof this.bonusSpawnBurst === 'number' && this.bonusSpawnBurst > 0)
                    ? Math.floor(this.bonusSpawnBurst)
                    : 1;
                const burst = Math.max(1, Math.min(missing, burstRaw));
                let spawned = 0;
                for (let i = 0; i < burst; i++) {
                    if (this.spawnBonus()) {
                        spawned++;
                    } else {
                        break;
                    }
                }
                if (spawned === 0 && this.bonos.length < maxItems) {
                    this.nextBonusSpawnAt = now + Math.max(1000, this.getBonusSpawnInterval());
                } else {
                    this.nextBonusSpawnAt = now + this.getBonusSpawnInterval();
                }
            }
        } catch (e) {}
    },

    // Actualiza y dibuja los bonus en pantalla
    updateBonuses: function(){
        try {
            for (let i = this.bonos.length - 1; i >= 0; i--) {
                const b = this.bonos[i];
                if (!b) { this.bonos.splice(i,1); continue; }
                b.update();
                if (b.vida <= 0) {
                    this.bonos.splice(i,1);
                }
            }
        } catch (e) {}
    },

    triggerBombBonus: function(){
        try {
            for (let i = this.tanques.length - 1; i >= 0; i--) {
                const enemy = this.tanques[i];
                if (!enemy || enemy === this.jugador || enemy === this.jugador2) {
                    continue;
                }
                try {
                    enemy.vida = 0;
                } catch (e) {
                    enemy && (enemy._vida = 0);
                }
            }
        } catch (e) {}
    },

    activateBaseShield: function(seconds){
        try {
            const baseExists = !!this.eagle;
            const durationCfg = (typeof seconds === 'number' && !Number.isNaN(seconds)) ? seconds : (this.bonusDurations && typeof this.bonusDurations.baseShield === 'number' ? this.bonusDurations.baseShield : 10);
            const ms = Math.max(1000, Math.floor(durationCfg * 1000));
            const now = Date.now();
            const newUntil = now + ms;
            if (this.baseShieldActive && this.baseShieldUntil && this.baseShieldUntil > now) {
                this.baseShieldUntil = Math.max(this.baseShieldUntil, newUntil);
            } else {
                this.baseShieldUntil = newUntil;
            }
            this.baseShieldActive = baseExists;
            if (!baseExists || !Array.isArray(this.eagleShield)) {
                return;
            }
            for (let i = 0; i < this.eagleShield.length; i++) {
                const block = this.eagleShield[i];
                if (!block) continue;
                if (!block._baseShieldData) {
                    const prevTint = (typeof block.getTintOverlay === 'function') ? block.getTintOverlay() : null;
                    block._baseShieldData = {
                        prevIndestructibleUntil: block._indestructibleUntil || 0,
                        prevTint: prevTint
                    };
                }
                const targetUntil = Math.max(block._indestructibleUntil || 0, this.baseShieldUntil);
                if (typeof block.setIndestructibleUntil === 'function') {
                    block.setIndestructibleUntil(targetUntil);
                } else {
                    block._indestructibleUntil = targetUntil;
                }
                if (typeof block.setTintOverlay === 'function') {
                    block.setTintOverlay('rgba(128,128,128,0.3)', 0.3);
                }
                block._baseShieldActive = true;
            }
        } catch (e) {}
    },

    clearBaseShieldEffect: function(){
        try {
            this.baseShieldActive = false;
            this.baseShieldUntil = 0;
            if (!Array.isArray(this.eagleShield)) {
                return;
            }
            const now = Date.now();
            for (let i = 0; i < this.eagleShield.length; i++) {
                const block = this.eagleShield[i];
                if (!block) continue;
                const data = block._baseShieldData || null;
                const prevUntil = data && typeof data.prevIndestructibleUntil === 'number' ? data.prevIndestructibleUntil : 0;
                const restoreUntil = (prevUntil > now) ? prevUntil : 0;
                if (typeof block.setIndestructibleUntil === 'function') {
                    block.setIndestructibleUntil(restoreUntil);
                } else {
                    block._indestructibleUntil = restoreUntil;
                }
                if (data && data.prevTint) {
                    if (typeof block.setTintOverlay === 'function') {
                        block.setTintOverlay(data.prevTint.color, data.prevTint.alpha);
                    }
                } else if (typeof block.clearTintOverlay === 'function') {
                    block.clearTintOverlay();
                }
                delete block._baseShieldData;
                delete block._baseShieldActive;
            }
        } catch (e) {}
    },

    updateBaseShieldState: function(){
        try {
            if (!this.baseShieldActive) {
                return;
            }
            if (!this.eagle) {
                this.clearBaseShieldEffect();
                return;
            }
            if (this.baseShieldUntil && Date.now() < this.baseShieldUntil) {
                if (Array.isArray(this.eagleShield)) {
                    for (let i = 0; i < this.eagleShield.length; i++) {
                        const block = this.eagleShield[i];
                        if (!block || !block._baseShieldActive) continue;
                        const targetUntil = Math.max(block._indestructibleUntil || 0, this.baseShieldUntil);
                        if (typeof block.setIndestructibleUntil === 'function') {
                            block.setIndestructibleUntil(targetUntil);
                        } else {
                            block._indestructibleUntil = targetUntil;
                        }
                    }
                }
                return;
            }
            this.clearBaseShieldEffect();
        } catch (e) {}
    },

    // Guarda un registro de la partida en localStorage
    saveScoreRecord: function (victory) {
        try {
            const key = 'TANK1990_SCORE_HISTORY';
            const records = JSON.parse(localStorage.getItem(key) || '[]');
            const destroyed = this.getEnemiesDestroyed();
            const remaining = this.getEnemiesRemaining();
            const duration = (typeof this.startTime === 'number') ? Math.max(0, Math.floor((Date.now() - this.startTime) / 1000)) : null;
            let difficulty = null;
            try { difficulty = this.levelLabel || this.difficultyKey || null; } catch (e) {}
            let mode = 'solo';
            let p1 = null, p2 = null;
            try {
                if (typeof window !== 'undefined') {
                    if (window.localMode === 'duo') mode = 'local-duo';
                    else if (window.onlinePlayers && window.onlinePlayers.p1 && window.onlinePlayers.p2) mode = 'online';
                    else mode = (window.localMode === 'individual') ? 'local-individual' : 'solo';
                    p1 = (window.player1 && window.player1.name) ? window.player1.name : (window.onlinePlayers && window.onlinePlayers.p1 && window.onlinePlayers.p1.name ? window.onlinePlayers.p1.name : 'Jugador 1');
                    p2 = (window.player2 && window.player2.name) ? window.player2.name : (window.onlinePlayers && window.onlinePlayers.p2 && window.onlinePlayers.p2.name ? window.onlinePlayers.p2.name : null);
                }
            } catch (e) {}
            const rec = {
                at: new Date().toISOString(),
                victory: !!victory,
                difficulty,
                mode,
                players: { p1, p2 },
                enemiesDestroyed: destroyed,
                enemiesRemaining: remaining,
                durationSec: duration
            };
            records.unshift(rec);
            while (records.length > 50) records.pop();
            localStorage.setItem(key, JSON.stringify(records));
        } catch (e) {}
    },

    // Dibuja contadores de vidas (por jugador) solo con números en verde
    drawLivesCounters: function () {
        try {
            const ctx = this.context;
            // Colocar números en dos líneas, una por jugador (modo local/duo u online con J2)
            const top = HUD_OBJECTIVE_ICON_Y + 100; // ancla vertical inferior del HUD (más arriba)
            let spacing = 28;                      // separación entre P1 y P2
            try {
                if (typeof window !== 'undefined') {
                    if (window.localMode === 'duo') spacing = 44;                    // modo local dúo
                    if (window.onlinePlayers && window.onlinePlayers.p1 && window.onlinePlayers.p2) spacing = 56; // modo online: aún más separación
                }
            } catch (e) {}
            ctx.save();
            ctx.fillStyle = "#005122";
            // P1
            const p1 = (typeof this.p1Lives === 'number') ? this.p1Lives : 0;
            ctx.fillText(String(p1), HUD_ICON_COLUMNS[0] + 2, top);
            // P2 (si existe)
            if (this.jugador2) {
                const p2 = (typeof this.p2Lives === 'number') ? this.p2Lives : 0;
                ctx.fillText(String(p2), HUD_ICON_COLUMNS[0] + 2, top + spacing);
            }
            ctx.restore();
        } catch (e) {}
    },

    // Dibuja corazones de vidas por jugador, alineados justo debajo de cada número
    drawPlayerHearts: function () {
        try {
            const ctx = this.context;
            const top = HUD_OBJECTIVE_ICON_Y + 100; // debe coincidir con drawLivesCounters (más arriba)
            let spacing = 28;                      // misma separación vertical entre jugadores
            try {
                if (typeof window !== 'undefined') {
                    if (window.localMode === 'duo') spacing = 44;
                    if (window.onlinePlayers && window.onlinePlayers.p1 && window.onlinePlayers.p2) spacing = 56;
                }
            } catch (e) {}
            const heartsOffset = 12;               // corazones bajo el número de cada jugador
            const size = 10;
            const gap = 4;

            // Helper para dibujar un corazn simple con curvas cuadrticas
            const drawHeart = (x, y, s, color) => {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x + s / 2, y + s); // punta inferior
                ctx.quadraticCurveTo(x, y + s * 0.65, x, y + s * 0.35);
                ctx.quadraticCurveTo(x, y, x + s * 0.25, y);
                ctx.quadraticCurveTo(x + s * 0.5, y, x + s * 0.5, y + s * 0.3);
                ctx.quadraticCurveTo(x + s * 0.5, y, x + s * 0.75, y);
                ctx.quadraticCurveTo(x + s, y, x + s, y + s * 0.35);
                ctx.quadraticCurveTo(x + s, y + s * 0.65, x + s / 2, y + s);
                ctx.closePath();
                ctx.fillStyle = color || '#E53935';
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                ctx.lineWidth = 1;
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            };

            // P1 corazones (debajo del número de P1)
            const p1 = (typeof this.p1Lives === 'number') ? this.p1Lives : 0;
            let x = HUD_ICON_COLUMNS[0];
            for (let i = 0; i < p1; i++) {
                drawHeart(x + i * (size + gap), top + heartsOffset, size, '#E53935');
            }

            // P2 corazones (si existe) debajo del número de P2
            if (this.jugador2) {
                const p2 = (typeof this.p2Lives === 'number') ? this.p2Lives : 0;
                const y2 = top + spacing + heartsOffset;
                for (let i = 0; i < p2; i++) {
                    drawHeart(x + i * (size + gap), y2, size, '#E53935');
                }
            }
        } catch (e) {}
    },

    // Muestra íconos de bonus activos por jugador con cuenta regresiva/barra
    drawActiveBonusesHUD: function () {
        try {
            const ctx = this.context;
            const top = HUD_OBJECTIVE_ICON_Y + 100; // ancla en la misma zona de vidas
            let spacing = 28;
            try {
                if (typeof window !== 'undefined') {
                    if (window.localMode === 'duo') spacing = 44;
                    if (window.onlinePlayers && window.onlinePlayers.p1 && window.onlinePlayers.p2) spacing = 56;
                }
            } catch (e) {}

            const size = 16; // tamaño icono
            const barW = 44, barH = 4, pad = 2;
            const xBase = HUD_ICON_COLUMNS[0] + 60; // a la derecha de los números de vida

            function drawOne(x, y, icon, remain, total) {
                if (remain <= 0 || !icon) return x;
                ctx.drawImage(icon, x, y, size, size);
                // barra de tiempo
                const ratio = Math.max(0, Math.min(1, total > 0 ? (remain / total) : 0));
                const by = y + size + pad;
                ctx.fillStyle = 'rgba(0,0,0,0.45)';
                ctx.fillRect(x, by, barW, barH);
                ctx.fillStyle = '#1e88e5';
                ctx.fillRect(x, by, Math.floor(barW * ratio), barH);
                ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 0.5, by + 0.5, barW - 1, barH - 1);
                // contador numérico
                ctx.fillStyle = '#005122';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText(String(Math.ceil(remain)), x + barW + 6, by + barH);
                return x + barW + 24; // siguiente x
            }

            function secsRemaining(untilTs) {
                if (!untilTs) return 0;
                const s = Math.ceil((untilTs - Date.now()) / 1000);
                return (s > 0) ? s : 0;
            }

            // P1
            let x = xBase;
            const shieldSprite = this.getBonusSprite && this.getBonusSprite('shield');
            const powerSprite = this.getBonusSprite && this.getBonusSprite('power');
            const p1 = this.jugador;
            if (p1) {
                const rShield = secsRemaining(p1._shieldUntil);
                const rPower = secsRemaining(p1._powerUntil);
                const tShield = (p1 && p1._shieldTotal) ? p1._shieldTotal : ((this.bonusDurations && this.bonusDurations.shield) ? this.bonusDurations.shield : 10);
                const tPower = (p1 && p1._powerTotal) ? p1._powerTotal : ((this.bonusDurations && this.bonusDurations.power) ? this.bonusDurations.power : 10);
                const y = top + 30;
                if (rShield > 0 && shieldSprite) x = drawOne(x, y, shieldSprite.get_dir([0,0]), rShield, tShield);
                if (rPower > 0 && powerSprite) x = drawOne(x, y, powerSprite.get_dir([0,0]), rPower, tPower);
            }

            // P2
            if (this.jugador2) {
                x = xBase;
                const p2 = this.jugador2;
                const rShield2 = secsRemaining(p2._shieldUntil);
                const rPower2 = secsRemaining(p2._powerUntil);
                const tShield = (p2 && p2._shieldTotal) ? p2._shieldTotal : ((this.bonusDurations && this.bonusDurations.shield) ? this.bonusDurations.shield : 10);
                const tPower = (p2 && p2._powerTotal) ? p2._powerTotal : ((this.bonusDurations && this.bonusDurations.power) ? this.bonusDurations.power : 10);
                const y2 = top + spacing + 30;
                if (rShield2 > 0 && shieldSprite) x = drawOne(x, y2, shieldSprite.get_dir([0,0]), rShield2, tShield);
                if (rPower2 > 0 && powerSprite) x = drawOne(x, y2, powerSprite.get_dir([0,0]), rPower2, tPower);
            }
        } catch (e) {}
    },

    // Etiquetas con el nombre del jugador sobre su indicador de vidas
    drawLivesLabels: function () {
        try {
            const ctx = this.context;
            const top = HUD_OBJECTIVE_ICON_Y + 100; // ancla usada por contadores (más arriba)
            let spacing = 28;
            try {
                if (typeof window !== 'undefined') {
                    if (window.localMode === 'duo') spacing = 44;
                    if (window.onlinePlayers && window.onlinePlayers.p1 && window.onlinePlayers.p2) spacing = 56;
                }
            } catch (e) {}

            // Resolver nombres (online/local) con valores por defecto
            let name1 = 'Jugador 1';
            let name2 = 'Jugador 2';
            try {
                if (typeof window !== 'undefined') {
                    if (window.onlinePlayers && window.onlinePlayers.p1 && window.onlinePlayers.p1.name) name1 = String(window.onlinePlayers.p1.name);
                    if (window.onlinePlayers && window.onlinePlayers.p2 && window.onlinePlayers.p2.name) name2 = String(window.onlinePlayers.p2.name);
                    if (window.player1 && window.player1.name) name1 = String(window.player1.name);
                    if (window.player2 && window.player2.name) name2 = String(window.player2.name);
                }
            } catch (e) {}

            ctx.save();
            ctx.fillStyle = '#005122';
            const labelOffset = 28; // más arriba del número para mejor visibilidad
            // Nombre P1
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(name1, HUD_ICON_COLUMNS[0], top - labelOffset);
            // Nombre P2 (si existe)
            if (this.jugador2) {
                ctx.fillText(name2, HUD_ICON_COLUMNS[0], top + spacing - labelOffset);
            }
            ctx.restore();
        } catch (e) {}
    },

    // Muestra un solo icono (p. ej. tanque básico) y debajo el total de enemigos restantes
    drawRemainingEnemiesSingle: function () {
        try {
            const ctx = this.context;
            const remaining = this.getEnemiesRemaining();
            const icon = basic && basic.get_dir ? basic.get_dir([0, -1]) : null;
            const size = 22;
            const x = HUD_X;
            const y = HUD_OBJECTIVE_ICON_Y + 40; // debajo de los íconos de objetivos
            if (icon) {
                ctx.drawImage(icon, x, y, size, size);
            }
            ctx.fillStyle = '#ffffff';
            // número debajo del icono
            ctx.fillText(String(remaining), x + size + 8, y + Math.floor(size * 0.8));
        } catch (e) { }
    },

    /**
     * b => borde
     * p => pared
     * j => jugador
     * c => objetivo de contacto
     * d => objetivo de distancia
     * t => tanque enemigo
     * m => minas
     */

    setRadar: function (densidadX, densidadY) {
        //se inicializan las posiciones del radar, el radar es una matriz logica que simplifica las coordenadas de los elementos
        //en el campo de juego, con el fin de simplificar la toma de desiciones de los tanques enemigos y representar un minimapa
        for (let x = 0; x < GRID_SIZE; x++) {
            myGameArea.radar.push([]);
            for (let y = 0; y < GRID_SIZE; y++) {
                myGameArea.radar[x][y] = null;
            }
        }

        //jugador se agrega a la matriz radar
        myGameArea.radar[BASE_CONFIG.playerStart.row][BASE_CONFIG.playerStart.col] = 'j';

        //se insertan los bloques de bordes al juego
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (x === 0 || y === 0 || x === GRID_BOUNDARY || y === GRID_BOUNDARY) {
                    myGameArea.radar[x][y] = 'b';
                    myGameArea.bloques.push(new Prop(undefined, 0, wall_0, 0, x * CELL_SIZE, y * CELL_SIZE));
                }
            }
        }

        //se insertan los bloques destruibles al campo de juego de forma horizontal aleatoriamente
        for (let y = 0; y < GRID_BOUNDARY; y += 2) {
            for (let x = 0; x < GRID_BOUNDARY; x += 2) {
                if (probability(densidadX)) {
                    for (let z = 0; z < 2; z++) {
                        if (myGameArea.radar[x + z][y] !== 'p' && myGameArea.radar[x + z][y] !== 'b') {
                            myGameArea.radar[x + z][y] = 'p';
                            myGameArea.bloques.push(new Prop(3, 0, wall_1, 10, (x + z) * CELL_SIZE, y * CELL_SIZE));
                        }
                    }
                }
            }
        }

        //se insertan los bloques destruibles al campo de juego de forma vertical aleatoriamente
        for (let x = 0; x < GRID_BOUNDARY; x += 2) {
            for (let y = 0; y < GRID_BOUNDARY; y += 2) {
                if (probability(densidadY)) {
                    for (let z = 0; z < 2; z++) {
                        if (myGameArea.radar[x][y + z] !== 'p' && myGameArea.radar[x][y + z] !== 'b') {
                            myGameArea.radar[x][y + z] = 'p';
                            myGameArea.bloques.push(new Prop(3, 0, wall_1, 10, x * CELL_SIZE, (y + z) * CELL_SIZE));
                        }
                    }
                }
            }
        }

        const reservedCells = [BASE_CONFIG.playerStart, BASE_CONFIG.eagle, ...BASE_CONFIG.shield];
        for (let i = myGameArea.bloques.length - 1; i >= 0; i--) {
            const pos = getRadarDimension([myGameArea.bloques[i].y, myGameArea.bloques[i].x], myGameArea.bloques[i].sprite.width);
            if (reservedCells.some(cell => cell.row === pos[0] && cell.col === pos[1])) {
                myGameArea.bloques.splice(i, 1);
            }
        }
        for (let i = 0; i < reservedCells.length; i++) {
            myGameArea.radar[reservedCells[i].row][reservedCells[i].col] = null;
        }
        myGameArea.eagleShield = BASE_CONFIG.shield.map(cell => {
            const block = new Prop(3, 0, wall_1, 10, cell.col * CELL_SIZE, cell.row * CELL_SIZE);
            myGameArea.bloques.push(block);
            myGameArea.radar[cell.row][cell.col] = 'p';
            return block;
        });
        myGameArea.eagle = new Prop(1, 0, eagle_sprite, 0, BASE_CONFIG.eagle.col * CELL_SIZE, BASE_CONFIG.eagle.row * CELL_SIZE);
        myGameArea.bloques.push(myGameArea.eagle);
        myGameArea.radar[BASE_CONFIG.eagle.row][BASE_CONFIG.eagle.col] = 'p';
        myGameArea.prepareBaseTargets();
        //insertar los objetivos de cuerpo a cuerpo
        let px;
        let py;
        const contactObjectives = Math.max(0, Math.floor(myGameArea.cantObj_contacto || 0));
        for (let x = 0; x < contactObjectives; x++) {
            while (true) {
                px = getRandomByRange(0, GRID_INNER_MAX);
                if (px >= GRID_HALF)
                    py = getRandomByRange(0, GRID_INNER_MAX);
                else
                    py = getRandomByRange(GRID_HALF, GRID_INNER_MAX);
                if (myGameArea.radar[px][py] === null) {
                    myGameArea.radar[px][py] = 'c';
                    myGameArea.objs_contacto.push(new Objetivo(100, 0, target_0, 10, px * CELL_SIZE, py * CELL_SIZE, 'c', 0));
                    break;
                }
            }
        }

        //insertar los objetivos a distancia
        myGameArea.cantObj_distancia = 0;
        myGameArea.objs_distancia.length = 0;
        myGameArea.prepareEnemySpawnPool();
        myGameArea.fillEnemySlots();

        // Guardar conteo inicial de objetivos para mostrar en pantalla de victoria
        try {
            myGameArea.initial_contact_count = myGameArea.objs_contacto.length;
            myGameArea.initial_distance_count = '';
        } catch (e) {}
    },

    updateRadar: function () {
        //funcion que actualiza el radar con respecto a las posiciones de los elementos, adicionalmente los imprime en el objeto canvas
        myGameArea.context.fillStyle = "#168600";
        myGameArea.context.fillRect(HUD_X, HUD_RADAR_Y, RADAR_SIZE, RADAR_SIZE);
        //se limpian las posiciones del radar, no sin antes imprimirlas en pantalla
        for (let x = 1; x < GRID_BOUNDARY; x++) {
            for (let y = 1; y < GRID_BOUNDARY; y++) {
                switch (myGameArea.radar[x][y]) {
                    case "j":
                        myGameArea.context.fillStyle = "#005122";
                        break;
                    case "p":
                        myGameArea.context.fillStyle = "#7a3000";
                        break;
                    case "c":
                        myGameArea.context.fillStyle = "#ffffff";
                        break;
                    case "d":
                        myGameArea.context.fillStyle = "#000000";
                        break;
                    case "t":
                        myGameArea.context.fillStyle = "#ff0000";
                        break;
                    case "m":
                        myGameArea.context.fillStyle = "#7a000e";
                        break;
                    case null:
                        myGameArea.context.fillStyle = "#818181";
                        break;
                    case 'T':
                        myGameArea.context.fillStyle = "#818181";
                        break;
                }
                myGameArea.context.fillRect(HUD_X + y * RADAR_CELL_STEP, HUD_RADAR_Y + x * RADAR_CELL_STEP, RADAR_CELL_SIZE, RADAR_CELL_SIZE);
                myGameArea.radar[x][y] = null;
            }
        }
        //se procede a llenar el radar con la informacion mas relevante

        //posicion del jugador
        let pos = getRadarDimension([myGameArea.jugador.y, myGameArea.jugador.x], myGameArea.jugador.sprite.width);
        myGameArea.radar[pos[0]][pos[1]] = 'j';
        //posicion del jugador 2 (si existe)
        if (myGameArea.jugador2) {
            let pos2 = getRadarDimension([myGameArea.jugador2.y, myGameArea.jugador2.x], myGameArea.jugador2.sprite.width);
            myGameArea.radar[pos2[0]][pos2[1]] = 'j';
        }

        //objetivos de contacto
        for (let x = 0; x < myGameArea.objs_contacto.length; x++) {
            pos = getRadarDimension([myGameArea.objs_contacto[x].y, myGameArea.objs_contacto[x].x], myGameArea.objs_contacto[x].sprite.width);
            myGameArea.radar[pos[0]][pos[1]] = 'c';
        }

        //objetivos de distancia
        for (let x = 0; x < myGameArea.objs_distancia.length; x++) {
            pos = getRadarDimension([myGameArea.objs_distancia[x].y, myGameArea.objs_distancia[x].x], myGameArea.objs_distancia[x].sprite.width);
            myGameArea.radar[pos[0]][pos[1]] = 'd';
        }

        //tanques
        let py;
        let px;
        for (let x = 0; x < myGameArea.tanques.length; x++) {
            py = Math.floor((myGameArea.tanques[x].x + (myGameArea.tanques[x].x + myGameArea.tanques[x].sprite.width)) / 2 / CELL_SIZE);
            px = Math.floor((myGameArea.tanques[x].y + (myGameArea.tanques[x].y + myGameArea.tanques[x].sprite.width)) / 2 / CELL_SIZE);
            if (myGameArea.tanques[x].buffer.length !== 0 && myGameArea.tanques[x].buffer[0] !== 'd') {
                let future = getRadarDimension([myGameArea.tanques[x].buffer[0][0], myGameArea.tanques[x].buffer[0][1]], myGameArea.tanques[x].sprite.width);
                myGameArea.radar[future[1]][future[0]] = 'T';
            }
            myGameArea.radar[px][py] = 't';
        }

        //minas
        for (let x = 0; x < myGameArea.minas.length; x++) {
            pos = getRadarDimension([myGameArea.minas[x].y, myGameArea.minas[x].x], myGameArea.minas[x].sprite.width);
            myGameArea.radar[pos[0]][pos[1]] = 'm';
        }

        //bloques excepto bordes
        for (let x = 0; x < myGameArea.bloques.length; x++) {
            pos = getRadarDimension([myGameArea.bloques[x].y, myGameArea.bloques[x].x], myGameArea.bloques[x].sprite.width);
            if (pos[0] !== 0 && pos[0] !== GRID_BOUNDARY && pos[1] !== 0 && pos[1] !== GRID_BOUNDARY) {
                myGameArea.radar[pos[0]][pos[1]] = 'p';
            }
        }
        //se llama la funcion dedicada a decidir la siguiente accion para cada tanque
        logic_elicitator();
    },

    updateGameArea: function () {
        //esta funcion es la encargada de la actualizacion y avance del juego
        if (myGameArea && myGameArea.paused) {
            return;
        }
        myGameArea.clear();
        myGameArea.updateRadar();
        //imprime el suelo primeramente
        for (let x = 1; x < GRID_BOUNDARY; x++) {
            for (let y = 1; y < GRID_BOUNDARY; y++) {
                myGameArea.context.drawImage(floor_0.get_dir([0, 0]), x * CELL_SIZE, y * CELL_SIZE);
            }
        }
        //se actualiza cada elemento, se eliminan los elementos sin vida y se reproducen sus sonidos de muerte respectivos
        for (let x = 0; x < myGameArea.updateList.length; x++) {
            for (let y = myGameArea.updateList[x].length - 1; y >= 0; y--) {
                myGameArea.updateList[x][y].update();
                if (myGameArea.updateList[x][y].vida <= 0) {
                    const removed = myGameArea.updateList[x][y];
                    if (myGameArea.updateList[x] !== myGameArea.balas && myGameArea.updateList[x] !== myGameArea.objs_contacto && myGameArea.updateList[x] !== myGameArea.objs_distancia)
                        crash.play();
                    else if (myGameArea.updateList[x] === myGameArea.objs_contacto || myGameArea.updateList[x] === myGameArea.objs_distancia)
                        point.play();
                    if (removed.tipo !== undefined) {
                        myGameArea.tank_counter[removed.tipo]--;
                    }
                    if (removed._classname === "Tanque") {
                        myGameArea.removeEnemy(removed);
                    }
                    myGameArea.updateList[x].splice(y, 1);
                    if (removed === myGameArea.eagle) {
                        myGameArea.eagle = null;
                        end_game(false);
                        return;
                    }
                }
            }
        }
        //se imprime el jugador
        myGameArea.jugador.update();
        //se imprime el jugador 2 si existe
        if (myGameArea.jugador2) {
            myGameArea.jugador2.update();
        }
        // temporizador de partida (mm:ss)
        try { myGameArea.drawGameTimer(); } catch (e) {}
        // bonus
        try { myGameArea.maybeSpawnBonuses(); } catch (e) {}
        try { myGameArea.updateBonuses(); } catch (e) {}
        try { myGameArea.updateBaseShieldState(); } catch (e) {}
        //se imprimen las estadisticas de juego
        myGameArea.context.fillStyle = "#005122";

        const enemyStats = [
            { key: 'type1', sprite: basic, tint: null, column: 0, textOffset: 5 },
            { key: 'type2', sprite: basic, tint: 'rgba(33, 150, 243, 0.3)', column: 1, textOffset: 5 },
            { key: 'type3', sprite: scout, tint: null, column: 2, textOffset: -2 },
            { key: 'type4', sprite: basic, tint: 'rgba(76, 175, 80, 0.3)', column: 3, textOffset: 5 },
            { key: 'definitivo', sprite: basic, tint: 'rgba(244, 67, 54, 0.3)', column: 4, textOffset: 5 }
        ];
        for (let i = 0; i < enemyStats.length; i++) {
            const stat = enemyStats[i];
            if (!stat.sprite) continue;
            const columnX = HUD_ICON_COLUMNS[stat.column] || HUD_ICON_COLUMNS[HUD_ICON_COLUMNS.length - 1];
            const spriteImg = stat.sprite.get_dir([0, -1]);
            const size = (typeof stat.sprite.width === 'number' ? stat.sprite.width : stat.sprite._width) || 30;
            if (stat.tint) {
                drawTintedImage(myGameArea.context, spriteImg, columnX, HUD_STATS_ICON_Y, size, stat.tint);
            } else {
                myGameArea.context.drawImage(spriteImg, columnX, HUD_STATS_ICON_Y, size, size);
            }
            const value = myGameArea.tank_counter && typeof myGameArea.tank_counter[stat.key] === 'number'
                ? myGameArea.tank_counter[stat.key]
                : 0;
            myGameArea.context.fillText(value, columnX + stat.textOffset, HUD_STATS_TEXT_Y);
        }
        const powerSprite = (typeof myGameArea.getBonusSprite === 'function') ? myGameArea.getBonusSprite('power') : null;
        const powerIcon = powerSprite ? powerSprite.get_dir([0, 1]) : target_0.get_dir([0, 1]);
        const objectiveColumn = HUD_ICON_COLUMNS[0];
        myGameArea.context.drawImage(powerIcon, objectiveColumn, HUD_OBJECTIVE_ICON_Y);
        myGameArea.context.fillText(myGameArea.objs_contacto.length, objectiveColumn, HUD_OBJECTIVE_TEXT_Y);

        // Contador global (texto): usar solo si está habilitado
        try {
            if (myGameArea.showEnemyRemainingText) {
                const remaining = myGameArea.getEnemiesRemaining();
                myGameArea.context.fillStyle = '#ffffff';
                myGameArea.context.fillText('Enemigos restantes: ' + remaining, HUD_X, HUD_OBJECTIVE_TEXT_Y + 60);
            }
        } catch (e) {}

        // Visualizar con un solo icono + número (desactivado por defecto)
        try { if (myGameArea.showSingleEnemyIcon) myGameArea.drawRemainingEnemiesSingle(); } catch (e) {}
        // Mantener grilla opcional desactivada por defecto
        try { if (myGameArea.showEnemyIcons) myGameArea.drawRemainingEnemiesIcons(); } catch (e) {}

        // Contadores de vidas por jugador
        try { myGameArea.drawLivesCounters(); } catch (e) {}

        // Nombres sobre las vidas (P1 / P2 u online)
        try { myGameArea.drawLivesLabels(); } catch (e) {}

        // Corazones de vidas por jugador (debajo de lo anterior)
        try { myGameArea.drawPlayerHearts(); } catch (e) {}

        // Íconos de bonus activos con duración restante
        try { myGameArea.drawActiveBonusesHUD(); } catch (e) {}

        // En modo Online (dos jugadores): rotular y espejar en un segundo canvas o pestaña externa
        try {
            if (typeof window !== 'undefined' && window.onlinePlayers) {
                // Etiqueta Jugador 1 en el canvas principal
                const name1 = (window.onlinePlayers.p1 && window.onlinePlayers.p1.name) ? window.onlinePlayers.p1.name : 'Jugador 1';
                myGameArea.context.save();
                myGameArea.context.fillStyle = 'rgba(0,0,0,0.55)';
                myGameArea.context.fillRect(8, 8, 220, 26);
                myGameArea.context.font = 'bold 16px sans-serif';
                myGameArea.context.fillStyle = '#fff';
                myGameArea.context.fillText(name1, 16, 26);
                myGameArea.context.restore();

                // Si existe pestaña externa, volcar frame allí; si no, usar espejo interno
                if (myGameArea.viewerWin && !myGameArea.viewerWin.closed && myGameArea.viewerCanvas) {
                    if (!myGameArea.viewerCtx) myGameArea.viewerCtx = myGameArea.viewerCanvas.getContext('2d');
                    if (myGameArea.viewerCtx) {
                        myGameArea.viewerCtx.clearRect(0, 0, myGameArea.viewerCanvas.width, myGameArea.viewerCanvas.height);
                        myGameArea.viewerCtx.drawImage(myGameArea.canvas, 0, 0);
                        const name2 = (window.onlinePlayers.p2 && window.onlinePlayers.p2.name) ? window.onlinePlayers.p2.name : 'Jugador 2';
                        myGameArea.viewerCtx.save();
                        myGameArea.viewerCtx.fillStyle = 'rgba(0,0,0,0.55)';
                        myGameArea.viewerCtx.fillRect(8, 8, 220, 26);
                        myGameArea.viewerCtx.font = 'bold 16px sans-serif';
                        myGameArea.viewerCtx.fillStyle = '#fff';
                        myGameArea.viewerCtx.fillText(name2, 16, 26);
                        myGameArea.viewerCtx.restore();
                    }
                } else if (myGameArea.canvasMirror && myGameArea.contextMirror) {
                    // fallback: espejo interno
                    myGameArea.contextMirror.clearRect(0, 0, myGameArea.canvasMirror.width, myGameArea.canvasMirror.height);
                    myGameArea.contextMirror.drawImage(myGameArea.canvas, 0, 0);
                    const name2 = (window.onlinePlayers.p2 && window.onlinePlayers.p2.name) ? window.onlinePlayers.p2.name : 'Jugador 2';
                    myGameArea.contextMirror.save();
                    myGameArea.contextMirror.fillStyle = 'rgba(0,0,0,0.55)';
                    myGameArea.contextMirror.fillRect(8, 8, 220, 26);
                    myGameArea.contextMirror.font = 'bold 16px sans-serif';
                    myGameArea.contextMirror.fillStyle = '#fff';
                    myGameArea.contextMirror.fillText(name2, 16, 26);
                    myGameArea.contextMirror.restore();
                }
            }
        } catch (e) {}

        //se comprueban las entradas del usuario y se realiza la accion solicitada
        var swapControls = false;
        try { if (typeof window !== 'undefined' && window.controlsSwap === true) swapControls = true; } catch (e) {}
        if (!swapControls) {
            if (myGameArea.keys && myGameArea.keys[37]) {
                myGameArea.jugador.move([-1, 0]);
            }
            else if (myGameArea.keys && myGameArea.keys[39]) {
                myGameArea.jugador.move([1, 0]);
            }
            else if (myGameArea.keys && myGameArea.keys[38]) {
                myGameArea.jugador.move([0, -1]);
            }
            else if (myGameArea.keys && myGameArea.keys[40]) {
                myGameArea.jugador.move([0, 1]);
            }
            if (myGameArea.keys && myGameArea.keys[32] && myGameArea.jugador.recarga === 0) {
                myGameArea.jugador.disparar();
            }
        } else {
            // En modo swap (invitado online): flechas controlan al Jugador 2 y espacio dispara su arma
            if (myGameArea.jugador2) {
                if (myGameArea.keys && myGameArea.keys[37]) {
                    myGameArea.jugador2.move([-1, 0]);
                }
                else if (myGameArea.keys && myGameArea.keys[39]) {
                    myGameArea.jugador2.move([1, 0]);
                }
                else if (myGameArea.keys && myGameArea.keys[38]) {
                    myGameArea.jugador2.move([0, -1]);
                }
                else if (myGameArea.keys && myGameArea.keys[40]) {
                    myGameArea.jugador2.move([0, 1]);
                }
                if (myGameArea.keys && myGameArea.keys[32] && myGameArea.jugador2.recarga === 0) {
                    myGameArea.jugador2.disparar();
                }
            }
        }

        // Controles del Jugador 2 (modo Duo): WASD para moverse, F para disparar
        if (myGameArea.jugador2) {
            if (myGameArea.keys && myGameArea.keys[65]) { // A
                myGameArea.jugador2.move([-1, 0]);
            }
            else if (myGameArea.keys && myGameArea.keys[68]) { // D
                myGameArea.jugador2.move([1, 0]);
            }
            else if (myGameArea.keys && myGameArea.keys[87]) { // W
                myGameArea.jugador2.move([0, -1]);
            }
            else if (myGameArea.keys && myGameArea.keys[83]) { // S
                myGameArea.jugador2.move([0, 1]);
            }

            if (myGameArea.keys && myGameArea.keys[70] && myGameArea.jugador2.recarga === 0) { // F
                myGameArea.jugador2.disparar();
            }
        }
        //el reloj avanza, sin embargo tiene un limite a partir del que se reinicia
        myGameArea.clock = (myGameArea.clock + 1) % 500;
        //se comprueba la finalizacion del juego o respawn si quedan vidas
        let p1Dead = (myGameArea.jugador.vida <= 0);
        let p2Dead = (myGameArea.jugador2 && myGameArea.jugador2.vida <= 0);
        if (p1Dead) {
            if (myGameArea.tryRespawnPlayer(1)) {
                p1Dead = false;
            }
        }
        if (p2Dead) {
            if (myGameArea.tryRespawnPlayer(2)) {
                p2Dead = false;
            }
        }
        const duo = !!myGameArea.jugador2;
        const p1Out = (myGameArea.jugador.vida <= 0 && myGameArea.p1Lives === 0);
        const p2Out = (duo && myGameArea.jugador2) ? (myGameArea.jugador2.vida <= 0 && myGameArea.p2Lives === 0) : false;
        if ((!duo && p1Out) || (duo && p1Out && p2Out)) {
            end_game(false);
        }
        else if (myGameArea.objs_contacto.length === 0 && myGameArea.objs_distancia.length === 0) {
            end_game(true);
        }
    }
};

// Exponer el área de juego en window para integraciones externas (pestaña Jugador 2)
try { if (typeof window !== 'undefined') { window.myGameArea = myGameArea; } } catch (e) {}

//ejecuta el fin del juego, ya sea quue se gano o se perdio
function end_game(victory) {
    try { if (typeof myGameArea !== 'undefined' && myGameArea && typeof myGameArea.saveScoreRecord === 'function') { myGameArea.saveScoreRecord(!!victory); } } catch (e) {}
    myGameArea.gameOver = true;
    myGameArea.clearEnemySpawnTimers();
    clearInterval(myGameArea.interval);
    moving.loop = false;
    moving.pause();
    const isOnlineMatch = (typeof window !== 'undefined' && window.onlinePlayers && window.onlinePlayers.p1 && window.onlinePlayers.p2);
    if (typeof window !== 'undefined') {
        if (isOnlineMatch) {
            if (!window.__onlineLastMatch || window.__onlineLastMatch.mode !== 'online') {
                const players = window.onlinePlayers || {};
                window.__onlineLastMatch = {
                    mode: 'online',
                    players: {
                        p1: { name: players.p1 && players.p1.name ? players.p1.name : '', color: players.p1 ? players.p1.color || null : null },
                        p2: { name: players.p2 && players.p2.name ? players.p2.name : '', color: players.p2 ? players.p2.color || null : null }
                    },
                    difficulty: window.lastDifficultyLabel || window.lastDifficulty || null,
                    victory: !!victory,
                    completed: true
                };
            } else {
                const ctx = window.__onlineLastMatch;
                if (window.onlinePlayers) {
                    ctx.players = {
                        p1: { name: window.onlinePlayers.p1 && window.onlinePlayers.p1.name ? window.onlinePlayers.p1.name : '', color: window.onlinePlayers.p1 ? window.onlinePlayers.p1.color || null : null },
                        p2: { name: window.onlinePlayers.p2 && window.onlinePlayers.p2.name ? window.onlinePlayers.p2.name : '', color: window.onlinePlayers.p2 ? window.onlinePlayers.p2.color || null : null }
                    };
                }
                ctx.victory = !!victory;
                ctx.completed = true;
                if (!ctx.difficulty) {
                    ctx.difficulty = window.lastDifficultyLabel || window.lastDifficulty || null;
                }
            }
        }
        window.onlineMatchActive = false;
    }
    if (victory) {
        win.play();
    }
    else {
        defeat.play();
    }
    wait(2000);
    const difficultyScreen = document.getElementById("difficulty-screen");
    if (difficultyScreen) difficultyScreen.style.display = isOnlineMatch ? "none" : "flex";
    // ocultar barra de pestañas cuando termina la partida
    try {
        const tabs = document.getElementById('online-tabs-bar');
        if (tabs) tabs.style.display = 'none';
    } catch (e) {}
    // ocultar canvases (principal y espejo) si existen para evitar superposición con pantallas
    try {
        if (myGameArea && myGameArea.canvas) {
            myGameArea.canvas.style.display = 'none';
        }
        if (myGameArea && myGameArea.canvasMirror) {
            myGameArea.canvasMirror.style.display = 'none';
        }
    } catch (e) {}
    // asegurar que pantallas intermedias de online/local queden ocultas
    try {
        const toHide = ['online-screen','online-duo-screen','color-screen','local-mode-screen','start-screen'];
        toHide.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    } catch (e) {}
    // esconder controles de juego
    try { if (typeof window !== 'undefined' && typeof window.hideGameControls === 'function') window.hideGameControls(); } catch (e) {}
    // Si se pierde, mostrar pantalla de derrota y ocultar niveles si existe
    try {
        if (!victory) {
            const lose = document.getElementById('lose-screen');
            if (lose) {
                if (difficultyScreen) difficultyScreen.style.display = 'none';
                lose.style.display = 'flex';
            }
        } else {
            // Mostrar pantalla de victoria con datos de la partida
            const winScreen = document.getElementById('win-screen');
            const details = document.getElementById('win-details');
            if (winScreen) {
                if (difficultyScreen) difficultyScreen.style.display = 'none';
                let mode = 'Individual';
                if (isOnlineMatch) {
                    mode = 'Online';
                } else if ((typeof window !== 'undefined' && window.localMode === 'duo') || (myGameArea && myGameArea.jugador2)) {
                    mode = 'Duo';
                }
                const level = (myGameArea.levelLabel !== undefined) ? myGameArea.levelLabel : ((myGameArea.level !== undefined) ? myGameArea.level : (typeof window !== 'undefined' ? (window.lastDifficultyLabel || window.lastDifficulty || window.lastLevel) : ''));
                const elapsedSec = myGameArea.startTime ? Math.max(1, Math.round((Date.now() - myGameArea.startTime) / 1000)) : '';
                const p1 = (typeof window !== 'undefined' && window.player1) ? window.player1 : null;
                const p2 = (typeof window !== 'undefined' && window.player2) ? window.player2 : null;
                const contactTotal = (myGameArea.initial_contact_count !== undefined) ? myGameArea.initial_contact_count : '';
                const distanceTotal = (myGameArea.initial_distance_count !== undefined) ? myGameArea.initial_distance_count : '';
                if (details) {
                    let html = '';
                    html += `<div><strong>Modo:</strong> ${mode}</div>`;
                    if (level !== '') html += `<div><strong>Dificultad:</strong> ${level}</div>`;
                    if (elapsedSec !== '') html += `<div><strong>Tiempo:</strong> ${elapsedSec} s</div>`;
                    if (contactTotal !== '') html += `<div><strong>Objetivos de contacto:</strong> ${contactTotal}</div>`;
                    if (distanceTotal !== '') html += `<div><strong>Objetivos de distancia:</strong> ${distanceTotal}</div>`;
                    if (p1) {
                        html += `<div><strong>Jugador 1:</strong> ${p1.name || '—'}</div>`;
                    }
                    if ((mode === 'Duo' || mode === 'Online') && p2) {
                        html += `<div><strong>Jugador 2:</strong> ${p2.name || '—'}</div>`;
                    }
                    details.innerHTML = html;
                }
                winScreen.style.display = 'flex';
            }
        }
    } catch (e) {}
    // cerrar pestaña externa del jugador 2 si existe
    try {
        if (myGameArea.viewerWin && !myGameArea.viewerWin.closed) {
            myGameArea.viewerWin.close();
        }
        myGameArea.viewerWin = null;
        myGameArea.viewerCanvas = null;
        myGameArea.viewerCtx = null;
    } catch (e) {}
    myGameArea.canvas.style.display = "none";
    if (isOnlineMatch) {
        try {
            if (typeof window !== 'undefined' && typeof window.showOnlineResultScreen === 'function') {
                window.showOnlineResultScreen(!!victory);
            }
        } catch (e) {}
    }
}

function nuevo_enemigo() {
    // Las oleadas están predefinidas por la dificultad; no se generan refuerzos dinámicos.
    return;
}

//funcion que pone a dormir el sistema antes de continuar
function wait(ms) {
    let start = new Date().getTime();
    let end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
}

function shuffleArray(items) {
    const arr = Array.isArray(items) ? items.slice() : [];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

//obtiene un numero dentro del rango solicitado
function getRandomByRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//realiza un experimento probabilistico y devuelve si dio exito
function probability(density) {
    return Math.floor((Math.random() * 100) + 1) < density;
}

//convierte las coordenadas de un objeto a su posicion mas acertada en la matriz del radar
function getRadarDimension(pos, width) {
    return [
        Math.floor((pos[0] + (pos[0] + width)) / 2 / CELL_SIZE),
        Math.floor((pos[1] + (pos[1] + width)) / 2 / CELL_SIZE)
    ];
}

//comprueba si un objeto esta colicionando con objetos en una lista
function check_colision(lista, myleft, myright, mytop, mybottom, dir) {
    for (let pos = 0; pos < lista.length; pos++) {
        let otherleft = lista[pos].x;
        let otherright = lista[pos].x + (lista[pos].sprite.width);
        let othertop = lista[pos].y;
        let otherbottom = lista[pos].y + (lista[pos].sprite.width);
        //comprueba si se esta tratando de comprobar una colision con el mismo objeto, lo cual es inutil
        if (myleft === otherleft && myright === otherright && mytop === othertop && mybottom === otherbottom) {
            continue;
        }
        //si un objeto se superlapa con otro en su proximo movimiento, se dice que el objeto esta en colision
        if (interseccion([myleft + dir[0] * skip, myright + dir[0] * skip], [mytop + dir[1] * skip, mybottom + dir[1] * skip], [otherleft, otherright], [othertop, otherbottom])) {
            return lista[pos];
        }
    }
    return undefined;
}

//se comprueba si las coordenadas de dos objetos bidimensionales estan intersecadas
function interseccion(X1, Y1, X2, Y2) {
    return (!(X1[0] >= X2[1] || X2[0] >= X1[1]) && !(Y1[0] >= Y2[1] || Y2[0] >= Y1[1]));
}

const AI_DECISION_MIN_COOLDOWN = 2;
const AI_DECISION_MAX_COOLDOWN = 6;

function applyRandomDecisionDelay(tank, min = AI_DECISION_MIN_COOLDOWN, max = AI_DECISION_MAX_COOLDOWN) {
    if (!tank || typeof tank.aiCooldown === 'undefined') {
        return;
    }
    tank.aiCooldown = getRandomByRange(min, max);
}

function queueImmediateShot(tank, direction) {
    if (!tank || !direction) {
        return;
    }
    tank._direccion = direction;
    if (!Array.isArray(tank.buffer)) {
        return;
    }
    if (tank.buffer.length === 0) {
        tank.add_buffer('d');
        return;
    }
    if (tank.buffer[0] !== 'd') {
        tank.buffer.unshift('d');
    }
}

function tryClearImmediateBlock(tank, dim) {
    if (!tank) {
        return false;
    }
    if (!dim || dim.length < 2 || !myGameArea || !myGameArea.radar) {
        return false;
    }
    if (!Array.isArray(tank.buffer) || tank.buffer.length !== 0) {
        return false;
    }
    const inBounds = (row, col) => row >= 0 && row <= GRID_BOUNDARY && col >= 0 && col <= GRID_BOUNDARY;
    const base = BASE_CONFIG && BASE_CONFIG.eagle ? BASE_CONFIG.eagle : { row: BASE_ROW, col: BASE_COL };
    const currentDir = Array.isArray(tank.direccion) ? [tank.direccion[0], tank.direccion[1]] : [0, 1];
    const frontRow = dim[0] + currentDir[1];
    const frontCol = dim[1] + currentDir[0];
    if (inBounds(frontRow, frontCol) && myGameArea.radar[frontRow][frontCol] === 'p') {
        queueImmediateShot(tank, currentDir);
        applyRandomDecisionDelay(tank);
        return true;
    }
    const neighbors = [
        { row: dim[0] - 1, col: dim[1], dir: [0, -1] },
        { row: dim[0] + 1, col: dim[1], dir: [0, 1] },
        { row: dim[0], col: dim[1] - 1, dir: [-1, 0] },
        { row: dim[0], col: dim[1] + 1, dir: [1, 0] }
    ];
    const candidates = [];
    for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        if (!inBounds(neighbor.row, neighbor.col)) {
            continue;
        }
        if (myGameArea.radar[neighbor.row][neighbor.col] !== 'p') {
            continue;
        }
        const priority = myGameArea.isBaseCell(neighbor.row, neighbor.col) ? 0 :
            (myGameArea.isBaseTargetCell(neighbor.row, neighbor.col) ? 1 : 2);
        const distance = Math.abs(base.row - neighbor.row) + Math.abs(base.col - neighbor.col);
        candidates.push({ ...neighbor, priority, distance });
    }
    if (candidates.length === 0) {
        return false;
    }
    candidates.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        return a.distance - b.distance;
    });
    queueImmediateShot(tank, candidates[0].dir);
    applyRandomDecisionDelay(tank);
    return true;
}

function logic_elicitator() {
    //funcion que decide que debe hacer un tanque enemigo cuando no tiene nada pendiente
    myGameArea.updateAttackAssignments();
    for (let i = 0; i < myGameArea.tanques.length; i++) {
        const tanque = myGameArea.tanques[i];
        if (tanque.buffer.length !== 0)
            continue;
        if (tanque.aiCooldown > 0) {
            tanque.aiCooldown--;
            continue;
        }
        if (!myGameArea.isActiveAttacker(tanque))
            continue;
        let Dim = getRadarDimension([tanque.y, tanque.x], tanque.sprite.width);
        if (tryClearImmediateBlock(tanque, Dim)) {
            continue;
        }
        if (myGameArea.isBaseTargetCell(Dim[0], Dim[1])) {
            const dirToBase = myGameArea.directionTowardsBase(Dim[0], Dim[1]);
            if (dirToBase) {
                tanque._direccion = dirToBase;
                if (tanque.recarga === 0) {
                    tanque.add_buffer('d');
                    applyRandomDecisionDelay(tanque);
                    continue;
                }
            }
        }
        let puntero = [Dim[0] + tanque.direccion[1], Dim[1] + tanque.direccion[0]];
        while (puntero[0] >= 0 && puntero[0] <= GRID_BOUNDARY && puntero[1] >= 0 && puntero[1] <= GRID_BOUNDARY) {
            const radarVal = myGameArea.radar[puntero[0]][puntero[1]];
            if (radarVal === null || radarVal === 'c' || radarVal === 'm') {
                puntero[0] += tanque.direccion[1];
                puntero[1] += tanque.direccion[0];
                continue;
            }
            if (radarVal === 'j') {
                tanque.add_buffer('d');
                applyRandomDecisionDelay(tanque);
            } else if (radarVal === 'p' && myGameArea.isBaseCell(puntero[0], puntero[1])) {
                tanque.add_buffer('d');
                applyRandomDecisionDelay(tanque);
            }
            break;
        }
        if (tanque.buffer.length !== 0) {
            continue;
        }
        const path = findPathToBase(Dim);
        if (path && path.length) {
            let fromRow = Dim[0];
            let fromCol = Dim[1];
            for (let step = 0; step < path.length; step++) {
                const target = path[step];
                const dirX = Math.sign(target.col - fromCol);
                const dirY = Math.sign(target.row - fromRow);
                if (dirX !== 0 || dirY !== 0) {
                    tanque._direccion = [dirX, dirY];
                }
                if (target.breakBefore) {
                    tanque.add_buffer('d');
                }
                const pixel = myGameArea.cellToPixel(target.row, target.col, tanque.sprite.width);
                tanque.add_buffer(pixel);
                fromRow = target.row;
                fromCol = target.col;
            }
            applyRandomDecisionDelay(tanque);
            continue;
        }
        let Vecinos = [];
        for (let x = -1; x < 2; x += 2) {
            if (myGameArea.radar[Dim[0] + x][Dim[1]] === null || myGameArea.radar[Dim[0] + x][Dim[1]] === 'c') {
                Vecinos.push([0, x])
            }
            if (myGameArea.radar[Dim[0]][Dim[1] + x] === null || myGameArea.radar[Dim[0]][Dim[1] + x] === 'c') {
                Vecinos.push([x, 0])
            }
        }
        if (Vecinos.length !== 0) {
            let newPos = Vecinos[getRandomByRange(0, Vecinos.length - 1)];
            tanque.add_buffer([tanque.x + (CELL_SIZE * newPos[0]), tanque.y + (CELL_SIZE * newPos[1])]);
            myGameArea.radar[Dim[0] + newPos[1]][Dim[1] + newPos[0]] = "T";
            applyRandomDecisionDelay(tanque);
        } else {
            applyRandomDecisionDelay(tanque, 3, 8);
        }
    }
}

function findPathToBase(startCell) {
    if (!myGameArea.baseTargetCells || myGameArea.baseTargetCells.length === 0) {
        return null;
    }
    const goalKeys = myGameArea.baseTargetSet;
    const startKey = `${startCell[0]},${startCell[1]}`;
    if (goalKeys && goalKeys.has(startKey)) {
        return [];
    }
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const open = [{ row: startCell[0], col: startCell[1], cost: 0 }];
    const gScore = new Map();
    gScore.set(startKey, 0);
    const parent = new Map();
    const stepCost = new Map();
    const getKey = (row, col) => `${row},${col}`;
    const reconstruct = (goalKey) => {
        const path = [];
        let cursorKey = goalKey;
        while (parent.has(cursorKey)) {
            const value = stepCost.get(cursorKey) || null;
            const coords = cursorKey.split(',');
            path.unshift({
                row: Number(coords[0]),
                col: Number(coords[1]),
                breakBefore: value === 'p'
            });
            cursorKey = parent.get(cursorKey);
        }
        return path;
    };
    while (open.length > 0) {
        let bestIndex = 0;
        for (let i = 1; i < open.length; i++) {
            if (open[i].cost < open[bestIndex].cost) {
                bestIndex = i;
            }
        }
        const current = open.splice(bestIndex, 1)[0];
        const currentKey = getKey(current.row, current.col);
        const currentCost = gScore.get(currentKey);
        if (goalKeys && goalKeys.has(currentKey) && currentKey !== startKey) {
            return reconstruct(currentKey);
        }
        if (current.cost > currentCost) {
            continue;
        }
        for (let i = 0; i < dirs.length; i++) {
            const nr = current.row + dirs[i][0];
            const nc = current.col + dirs[i][1];
            if (nr <= 0 || nr >= GRID_BOUNDARY || nc <= 0 || nc >= GRID_BOUNDARY) {
                continue;
            }
            const neighborKey = getKey(nr, nc);
            const cellValue = myGameArea.radar[nr][nc];
            if (cellValue === 'b' || cellValue === 'T' || cellValue === 'm' || cellValue === 'j' || cellValue === 't') {
                if (!goalKeys || !goalKeys.has(neighborKey)) {
                    continue;
                }
            }
            let moveCost = 1;
            if (cellValue === 'p') {
                moveCost = 4;
            }
            const tentativeCost = currentCost + moveCost;
            if (gScore.has(neighborKey) && tentativeCost >= gScore.get(neighborKey)) {
                continue;
            }
            gScore.set(neighborKey, tentativeCost);
            parent.set(neighborKey, currentKey);
            stepCost.set(neighborKey, cellValue);
            if (goalKeys && goalKeys.has(neighborKey)) {
                return reconstruct(neighborKey);
            }
            if (cellValue !== 'b' && cellValue !== 'T' && cellValue !== 'm' && cellValue !== 'j' && cellValue !== 't') {
                open.push({ row: nr, col: nc, cost: tentativeCost });
            }
        }
    }
    return null;
}

//se declaran los recursos de audio e imagenes
basic = new Sprite("Sprites/basic_front.png", "Sprites/basic_back.png", "Sprites/basic_left.png", "Sprites/basic_right.png", 31);
bullet = new Sprite("Sprites/bullet.png", "Sprites/bullet.png", "Sprites/bullet.png", "Sprites/bullet.png", 13);
floor_0 = new Sprite("Sprites/floor_0.png", "Sprites/floor_0.png", "Sprites/floor_0.png", "Sprites/floor_0.png", 35);
lander = new Sprite("Sprites/lander_front.png", "Sprites/lander_back.png", "Sprites/lander_left.png", "Sprites/lander_right.png", 31);
landmine = new Sprite("Sprites/landmine.png", "Sprites/landmine.png", "Sprites/landmine.png", "Sprites/landmine.png", 13);
player = new Sprite("Sprites/player_front.png", "Sprites/player_back.png", "Sprites/player_left.png", "Sprites/player_right.png", 27);
scout = new Sprite("Sprites/scout_front.png", "Sprites/scout_back.png", "Sprites/scout_left.png", "Sprites/scout_right.png", 21);
target_0 = new Sprite("Sprites/target_0.png", "Sprites/target_0.png", "Sprites/target_0.png", "Sprites/target_0.png", 35);
target_1 = new Sprite("Sprites/target_1.png", "Sprites/target_1.png", "Sprites/target_1.png", "Sprites/target_1.png", 23);
bonus_shield = new Sprite("Sprites/Shield.png", "Sprites/Shield.png", "Sprites/Shield.png", "Sprites/Shield.png", 35);
bonus_timeStop = new Sprite("Sprites/TimeStop.png", "Sprites/TimeStop.png", "Sprites/TimeStop.png", "Sprites/TimeStop.png", 35);
bonus_bomb = new Sprite("Sprites/Bomb.png", "Sprites/Bomb.png", "Sprites/Bomb.png", "Sprites/Bomb.png", 35);
bonus_defense = new Sprite("Sprites/Defenses.png", "Sprites/Defenses.png", "Sprites/Defenses.png", "Sprites/Defenses.png", 35);
wall_0 = new Sprite("Sprites/wall_0.png", "Sprites/wall_0.png", "Sprites/wall_0.png", "Sprites/wall_0.png", 35);
wall_1 = new Sprite("Sprites/wall_1.png", "Sprites/wall_1.png", "Sprites/wall_1.png", "Sprites/wall_1.png", 35);
eagle_sprite = new Sprite("Sprites/eagle.png", "Sprites/eagle.png", "Sprites/eagle.png", "Sprites/eagle.png", 35);

function audio_init() {
    theme = new Audio('Sound/main.mp3');
    shot = new Audio('Sound/shot.wav');
    crash = new Audio('Sound/crash.wav');
    moving = new Audio('Sound/moving.mp3');
    point = new Audio('Sound/point.wav');
    win = new Audio('Sound/win.wav');
    defeat = new Audio('Sound/defeat.wav');
}
//funcion que reinicia el area de juego para una nueva partida
function resetGameAreaForNewGame() {
    try {
        if (myGameArea.interval) {
            clearInterval(myGameArea.interval);
            myGameArea.interval = null;
        }

        if (myGameArea.enemySpawnTimers) {
            myGameArea.clearEnemySpawnTimers();
        }

        myGameArea.keys = [];
        myGameArea.gameOver = false;
        myGameArea.paused = false;

        myGameArea.bloques = [];
        myGameArea.tanques = [];
        myGameArea.balas = [];
        myGameArea.minas = [];
        myGameArea.objs_contacto = [];
        myGameArea.objs_distancia = [];
        myGameArea.pendingAttackers = [];
        myGameArea.activeAttackers = [];
        myGameArea.bonos = [];
        myGameArea.enemyPool = [];
        myGameArea.radar = [];

        myGameArea.eagle = null;
        myGameArea.eagleShield = [];
        myGameArea.jugador = null;
        myGameArea.jugador2 = null;

        myGameArea.canvas.style.display = "block";
        myGameArea.canvas.width = HUD_CANVAS_WIDTH;
        myGameArea.canvas.height = HUD_CANVAS_HEIGHT;

        const ctx = myGameArea.canvas.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, myGameArea.canvas.width, myGameArea.canvas.height);
        }

        if (!myGameArea.canvas.parentNode) {
            document.body.insertBefore(myGameArea.canvas, document.body.firstChild);
        }
    } catch (e) {
        console.error("Error reiniciando partida:", e);
    }
}
//llamada a iniciar el juego
function startGame(selection) {
    resetGameAreaForNewGame();
    const config = resolveDifficulty(selection);
    const lvl = config.level;
    audio_init();
    try {
        window.lastLevel = lvl;
        window.lastDifficulty = config.key;
        window.lastDifficultyLabel = config.label;
    } catch (e) {}
    try {
        const overlays = [
            'start-screen',
            'difficulty-screen',
            'online-screen',
            'online-duo-screen',
            'local-mode-screen',
            'color-screen',
            'win-screen',
            'lose-screen'
        ];
        overlays.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    } catch (e) {}
    myGameArea.start(
        config.densidadX,
        config.densidadY,
        config.cantObj_contacto,
        config.cantObj_distancia,
        config.tankPlan,
        config.basicTierSequence,
        {
            maxActiveEnemies: config.maxActiveEnemies,
            respawnDelayMs: config.respawnDelayMs,
            basicTierCounts: config.basicTierCounts
        }
    );
    try {
        myGameArea.level = lvl;
        myGameArea.levelLabel = config.label;
        myGameArea.difficultyKey = config.key;
        myGameArea.startTime = Date.now();
        myGameArea.setAttackGroupSize(lvl);
    } catch (e) {}
    const difficultyScreen = document.getElementById("difficulty-screen");
    if (difficultyScreen) difficultyScreen.style.display = "none";
    theme.play();
    moving.loop = true;
    moving.play();
    myGameArea.canvas.style.display = "initial";
}

try {
    if (typeof window !== 'undefined') {
        window.startGame = startGame;
    }
} catch (e) {}
