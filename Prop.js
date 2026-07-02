/**
 * clase encargada de la creacion y acciones de los bloques
 */
class Prop {
    constructor(vida, velocidad, sprite, valor, x, y) {
        this._vida = vida;
        // Guarda la vida inicial como vida máxima para indicadores
        this._vidaMax = vida;
        this._velocidad = velocidad;
        this._sprite = sprite;
        this._valor = valor;
        this._classname="Prop";
        this._x = x +(35-sprite._width)/2;
        this._y = y +(35-sprite._width)/2;
        this._indestructibleUntil = 0;
        this._tintOverlay = null;
    }

    /**
     * si el bloque es de los internos y recibe daño se debe minimizar la vida del mismo
     * @param value: cantidad de daño
     */
    damage(value) {
        if (this.isIndestructible()) {
            return;
        }
        if (this._vida!==undefined)
            this._vida -= value;
    }

    /**
     * se encarga de actualizar la posicion de los props
     * @param dir
     */
    move(dir) {
        if (myGameArea.clock % this._velocidad === 0) {
            this._x+=dir[0]*skip;
            this._y+=dir[1]*skip;
        }
    }

    /**
     * se encarga de actualizar el sprite correspondiente
     */
    update() {
        const ctx = myGameArea && myGameArea.context ? myGameArea.context : null;
        if (!ctx) {
            return;
        }
        const defaultSize = (typeof CELL_SIZE !== 'undefined') ? CELL_SIZE : 35;
        const size = (this._sprite && this._sprite._width) ? this._sprite._width : defaultSize;
        ctx.drawImage(this._sprite.get_dir([0,0]), this._x, this._y);
        if (this._tintOverlay && this._tintOverlay.alpha > 0) {
            ctx.save();
            ctx.globalAlpha = this._tintOverlay.alpha;
            ctx.fillStyle = this._tintOverlay.color;
            ctx.fillRect(this._x, this._y, size, size);
            ctx.restore();
        }
    }

    get vida() {
        return this._vida;
    }

    set vida(value) {
        this._vida = value;
    }

    // Vida máxima para calcular porcentaje de barra de vida
    get vidaMax() {
        return this._vidaMax;
    }

    get x() {
        return this._x;
    }

    set x(value) {
        this._x = value;
    }

    get y() {
        return this._y;
    }

    set y(value) {
        this._y = value;
    }

    get velocidad() {
        return this._velocidad;
    }

    get sprite() {
        return this._sprite;
    }

    get valor() {
        return this._valor;
    }

    get classname() {
        return this._classname;
    }
}

Prop.prototype.isIndestructible = function() {
    if (!this._indestructibleUntil) {
        return false;
    }
    if (this._indestructibleUntil === Infinity) {
        return true;
    }
    if (Date.now() < this._indestructibleUntil) {
        return true;
    }
    this._indestructibleUntil = 0;
    return false;
};

Prop.prototype.setIndestructibleUntil = function(untilTimestamp) {
    if (typeof untilTimestamp !== 'number' || Number.isNaN(untilTimestamp)) {
        return;
    }
    this._indestructibleUntil = untilTimestamp;
};

Prop.prototype.setTintOverlay = function(color, alpha = 1) {
    const safeAlpha = (typeof alpha === 'number' && !Number.isNaN(alpha)) ? Math.max(0, Math.min(1, alpha)) : 1;
    const safeColor = (typeof color === 'string' && color.trim()) ? color : 'rgba(0,0,0,0)';
    this._tintOverlay = { color: safeColor, alpha: safeAlpha };
};

Prop.prototype.clearTintOverlay = function() {
    this._tintOverlay = null;
};

Prop.prototype.getTintOverlay = function() {
    if (!this._tintOverlay) {
        return null;
    }
    return { color: this._tintOverlay.color, alpha: this._tintOverlay.alpha };
};
