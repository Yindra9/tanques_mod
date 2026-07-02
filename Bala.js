/**
 * Clase encargada de la creacion y acciones de la bala
 */
class Bala extends Prop {
    constructor(vida, velocidad, sprite, valor, x, y, dano, direccion, tanque) {
        super(vida, velocidad, sprite, valor, x, y);
        this._dano = dano;
        this._direccion = direccion;
        this._classname="Bala";
        this._tanque = tanque;this._x=x;
        this._y=y;
    }

    /**
     * metodo creado para revisar las posibles colisiones que puede tener la bala (bloques, jugador, tanques)
     * si la colision es hacia el tanque jugador se le resta vida a este
     * luego la vida de la bala se acaba o es 0
     */
    colision() {
        let myleft = this._x;
        let myright = this._x + (this._sprite._width);
        let mytop = this._y;
        let mybottom = this._y + (this._sprite._width);
        let colided = check_colision(myGameArea.bloques, myleft, myright, mytop, mybottom, this._direccion);
        if (colided === undefined){
            // primero verificar contra jugador 1
            colided = check_colision([myGameArea.jugador], myleft, myright, mytop, mybottom, this._direccion);
            // luego verificar contra jugador 2 si existe
            if (colided === undefined && typeof myGameArea !== 'undefined' && myGameArea.jugador2) {
                colided = check_colision([myGameArea.jugador2], myleft, myright, mytop, mybottom, this._direccion);
            }
            // finalmente contra tanques enemigos
            if(colided === undefined)
                colided = check_colision(myGameArea.tanques, myleft, myright, mytop, mybottom, this._direccion);
        }
        if (colided !== undefined){
            const targetClass = colided.classname;
            if (targetClass === "Prop") {
                colided.damage(this._dano);
            } else if (targetClass === "Tanque") {
                if (this._tanque === 'j' || colided.tipo === 'j') {
                    colided.damage(this._dano);
                }
            } else if (typeof colided.damage === 'function') {
                colided.damage(this._dano);
            }
            this._vida=0;
        }
    }

    /**
     * actualiza el estado de la bala dibujandola en su recorrido y comprobando colisiones hasta que colisiona
     * y desaparece
     */
    update() {
        myGameArea.context.drawImage(this._sprite.get_dir(this._direccion), this._x, this._y);
        this._vida--;
        this.move(this._direccion);
        this.colision();
    }

    get dano() {
        return this._dano;
    }

    get direccion() {
        return this._direccion;
    }

    get tanque() {
        return this._tanque;
    }
}
