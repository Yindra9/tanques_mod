/**
 * Clase encargada de la creacion y manejo de los tanques
 */
class Tanque extends Prop {
    constructor(vida, velocidad, sprite, valor, x, y, tipo, recarga, direccion, dirCanon, bala) {
        super(vida, velocidad, sprite, valor, x, y);
        this._tipo = tipo;
        this._recarga = recarga;
        this._direccion = direccion;
        this._dirCanon = dirCanon;
        this._bala = bala;
        this._classname="Tanque";
        this._buffer=[];
        this._x = x +(35-sprite._width)/2;
        this._y = y +(35-sprite._width)/2;
        this._tint = null;
        this._enemyTier = null;
        this._aiCooldown = 0;
        // bonus/estado temporal
        this._shieldUntil = 0; // timestamp ms
        this._powerUntil = 0;  // timestamp ms
        this._shieldTotal = 0; // segundos
        this._powerTotal = 0;  // segundos
    }

    /**
     * metodo encargado de proporcionar la direccion en la cual el tanque se va a mover
     * @param dir recibe una tupla con la direccion en la que se quiere mover. Ej: 0,-1 o 1,0
     */
    move(dir) {
        this._direccion = dir;
        // detener movimiento enemigo si el bonus de tiempo está activo
        try {
            if (this._tipo !== 'j' && myGameArea && typeof myGameArea.isEnemyTimeStopped === 'function' && myGameArea.isEnemyTimeStopped()) {
                return;
            }
        } catch (e) {}
        let effectiveVel = Math.max(1, this._velocidad);
        if (myGameArea.clock % effectiveVel === 0) {
            if(this.colision()){
                if(this._tipo!=='j')
                    this.disparar();
            }
            else {
                this._x+=dir[0]*skip;
                this._y+=dir[1]*skip;
            }
        }
    }

    /**
     * metodo encargado de realizar la accion del disparo del tanque
     */
    disparar() {
        let newX;
        let newY;
        let newDir;
        if(this._recarga!==0)
            return;
        if (this._tipo !== 'j') {
            try {
                if (myGameArea && typeof myGameArea.isEnemyTimeStopped === 'function' && myGameArea.isEnemyTimeStopped()) {
                    return;
                }
            } catch (e) {}
        }
        newDir=[this._direccion[0]*this._dirCanon,this._direccion[1]*this._dirCanon];
        newX = (this._x + ((newDir[0]+1)/2)*(this._sprite._width)) + (((newDir[0]-1)/2) * (this._bala._sprite._width)) + newDir[0];
        newY = (this._y + ((newDir[1]+1)/2)*(this._sprite._width)) + (((newDir[1]-1)/2) * (this._bala._sprite._width)) + newDir[1];

        /**
         * si el tanque es un lander (lanza minas) entonces realiza un disparo que en accion es lanzar una mina
         * los otros tanques solo realizan la accion de disparar en forma normal mediante el cañon
         * si el tanque es el del jugador dispara automaticamente cuando el jugador presione la tecla correcta
         */
        if (this._tipo === 'type4' && this._bala && this._bala._sprite === landmine) {
            myGameArea.minas.push(new Bala(this._bala._vida, this._bala._velocidad, this._bala._sprite, 0, newX, newY, this._bala._dano, newDir,this._tipo));
            this._recarga += this._bala._vida;
        } else {
            let dano = this._bala._dano;
            // disparo potenciado para jugadores si el bonus está activo
            try { if (this._tipo === 'j' && Date.now() < this._powerUntil) dano = dano * 2; } catch (e) {}
            myGameArea.balas.push(new Bala(this._bala._vida, this._bala._velocidad, this._bala._sprite, 0, newX, newY, dano, newDir,this._tipo));
            this._recarga += this._velocidad * 25;
        }
        if (this._tipo ==='j'){
            shot.play();
        }
    }

    /**
     * metodo que retorna el tipo de colision que se ha provocado (bloque, jugador, objs_distancia)
     * si no se realizo una colisión entonces colided será de valor undefined
     * @returns {boolean} true si se afirma que hay una colision
     */
    colision() {
        let myleft = this._x;
        let myright = this._x + (this._sprite._width);
        let mytop = this._y;
        let mybottom = this._y + (this._sprite._width);
        let colided = check_colision(myGameArea.tanques, myleft, myright, mytop, mybottom, this._direccion);
        if(colided === undefined){
            colided = check_colision(myGameArea.bloques, myleft, myright, mytop, mybottom, this._direccion);
        }
        if (colided === undefined) {
            colided = check_colision([myGameArea.jugador], myleft, myright, mytop, mybottom, this._direccion)
        }
        if (colided === undefined) {
            colided = check_colision(myGameArea.objs_distancia, myleft, myright, mytop, mybottom, this._direccion)
        }
        return colided !== undefined;
    }

    /**
     * metodo que actualiza el estado del tanque
     * si el tanque no es el jugador debera revisar el buffer en busca de la lista de acciones que le corresponde
     * las acciones son disparar y moverse
     */
    update() {
        const img = this._sprite.get_dir(this._direccion);
        const __tint = (this._tint) ? this._tint : ((this._tipo === 'j' && typeof window !== 'undefined' && window.playerTint) ? window.playerTint : null);
        if (__tint) {
            drawTintedImage(myGameArea.context, img, this._x, this._y, this._sprite._width, __tint);
        } else {
            myGameArea.context.drawImage(img, this._x, this._y);
        }
        if (this._recarga > 0) {
            this._recarga--;
        }
        if(this._tipo!=="j"){
            if(this._buffer.length !== 0){
                if(this._buffer[0] === "d"){
                    if(this._recarga === 0){
                        this.disparar();
                        this._buffer.splice(0,1);
                    }
                } else if(this._buffer[0][0] === this._x && this._buffer[0][1] === this._y){
                        this._buffer.splice(0,1);
                } else {
                    this.move([Math.sign(this._buffer[0][0] - this._x),Math.sign(this._buffer[0][1] - this._y)]);
                    if(Math.abs(this._buffer[0][0] - this._x)<skip) {
                        this._x = this._buffer[0][0];
                    }
                    if(Math.abs(this._buffer[0][1] - this._y)<skip){
                        this._y = this._buffer[0][1];
                    }
                }
            }
        }

        // Indicador de vida para jugador y enemigos
        try { this.drawHealthIndicator(myGameArea.context); } catch (e) {}
        // Barras de bonus activos (escudo/poder) sobre el jugador
        try { this.drawBonusBars && this.drawBonusBars(myGameArea.context); } catch (e) {}
    }

    get tipo() {
        return this._tipo;
    }

    get enemyTier() {
        return this._enemyTier;
    }

    set enemyTier(value) {
        this._enemyTier = value;
    }

    get recarga() {
        return this._recarga;
    }

    set recarga(value) {
        this._recarga = value;
    }

    get direccion() {
        return this._direccion;
    }

    get dirCanon() {
        return this._dirCanon;
    }

    get bala() {
        return this._bala;
    }

    get buffer() {
        return this._buffer;
    }

    add_buffer(value) {
        this._buffer.push(value);
    }

    get aiCooldown() {
        return this._aiCooldown;
    }

    set aiCooldown(value) {
        this._aiCooldown = Math.max(0, value);
    }

    // aplica un escudo por 'seconds' segundos
    applyShield(seconds) {
        const ms = Math.max(0, Math.floor(seconds * 1000));
        this._shieldUntil = Date.now() + ms;
        this._shieldTotal = Math.max(1, Math.floor(seconds));
    }

    // aplica potencia de disparo por 'seconds' segundos
    applyPower(seconds) {
        const ms = Math.max(0, Math.floor(seconds * 1000));
        this._powerUntil = Date.now() + ms;
        this._powerTotal = Math.max(1, Math.floor(seconds));
    }
}

// Dibuja una imagen con tinte de color usando un canvas fuera de pantalla
function drawTintedImage(ctx, image, x, y, size, color) {
    try {
        const off = document.createElement('canvas');
        off.width = size;
        off.height = size;
        const octx = off.getContext('2d');
        // dibujar sprite base escalado al tamaño definido
        octx.drawImage(image, 0, 0, size, size);
        // aplicar tinte
        octx.globalCompositeOperation = 'source-atop';
        octx.fillStyle = color;
        octx.fillRect(0, 0, size, size);
        octx.globalCompositeOperation = 'destination-atop';
        // mantener la forma original (opcional)
        octx.drawImage(image, 0, 0, size, size);
        // pintar resultado en el canvas principal
        ctx.drawImage(off, x, y, size, size);
    } catch (e) {
        // fallback silencioso si falla: dibujar imagen normal
        ctx.drawImage(image, x, y);
    }
}

// Barra de vida por tanque con color por tipo
Tanque.prototype.drawHealthIndicator = function(ctx) {
    if (!ctx) return;
    if (this._vida === undefined || this._vida === null) return;
    const max = (this._vidaMax !== undefined && this._vidaMax !== null && this._vidaMax > 0) ? this._vidaMax : this._vida;
    if (!max || max <= 0) return;

    const ratio = Math.max(0, Math.min(1, this._vida / max));
    const barWidth = this._sprite && this._sprite._width ? this._sprite._width : 24;
    const barHeight = 4;
    const pad = 2;
    let x = Math.floor(this._x);
    let y = Math.floor(this._y - (barHeight + pad));
    if (y < 1) y = 1;

    // Color base segun tipo; tiers fuertes ajustan color
    let color = '#9e9e9e';
    switch (this._tipo) {
        case 'j': color = '#4CAF50'; break; // jugador
        case 'type1': color = '#FFC107'; break;
        case 'type2': color = '#2196F3'; break;
        case 'type3': color = '#03A9F4'; break;
        case 'type4': color = '#4CAF50'; break;
        case 'definitivo': color = '#F44336'; break;
        default: color = '#9e9e9e';
    }

    ctx.save();
    // fondo de barra
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, barWidth, barHeight);
    // relleno por porcentaje restante
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, Math.floor(barWidth * ratio)), barHeight);
    // borde para contraste
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, barWidth - 1, barHeight - 1);

    // pequeño símbolo por tipo: cuadrito de color
    const sq = 4;
    let sx = x - (sq + 2);
    let sy = y;
    if (sx < 1) sx = x + barWidth + 2;
    ctx.fillStyle = color;
    ctx.fillRect(sx, sy, sq, sq);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeRect(sx + 0.5, sy + 0.5, sq - 1, sq - 1);
    ctx.restore();
};

// Dibuja barras de tiempo para bonus activos (escudo/potencia) sobre el tanque del jugador
Tanque.prototype.drawBonusBars = function(ctx) {
    if (!ctx) return;
    if (this._tipo !== 'j') return;
    const barHeight = 5;
    const gap = 2;
    const w = (this._sprite && this._sprite._width) ? this._sprite._width : 24;
    const x = Math.floor(this._x);
    let y = Math.floor(this._y - (barHeight + gap) - 8);
    if (y < 1) y = 1;

    function remainSecs(until){ if(!until) return 0; const s = Math.ceil((until - Date.now())/1000); return s>0?s:0; }
    let tShield = this._shieldTotal || 10, tPower = this._powerTotal || 10;
    try { if (typeof myGameArea !== 'undefined' && myGameArea.bonusDurations) { if (typeof myGameArea.bonusDurations.shield==='number') tShield = myGameArea.bonusDurations.shield; if (typeof myGameArea.bonusDurations.power==='number') tPower = myGameArea.bonusDurations.power; } } catch(e) {}
    const rShield = remainSecs(this._shieldUntil);
    const rPower  = remainSecs(this._powerUntil);

    const drawBar = (yy, ratio, color) => {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x, yy, w, barHeight);
        ctx.fillStyle = color;
        ctx.fillRect(x, yy, Math.max(0, Math.floor(w * Math.max(0, Math.min(1, ratio)))), barHeight);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, yy + 0.5, w - 1, barHeight - 1);
        ctx.restore();
    };

    if (rShield > 0 && tShield > 0) {
        drawBar(y, rShield / tShield, '#00BCD4');
        y += (barHeight + gap);
    }
    if (rPower > 0 && tPower > 0) {
        drawBar(y, rPower / tPower, '#FFC107');
    }
};
