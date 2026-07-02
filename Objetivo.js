/**
 * Clase encargada de la creacion y acciones de los objetivos
 */
class Objetivo extends Prop {
    constructor(vida, velocidad, sprite, valor, x, y, tipo) {
        super(vida, velocidad, sprite, valor, x, y);
        this._tipo = tipo;
    }

    /**
     * metodo que verifica si el objetivo ya fue alcanzado
     * si el tipo de objetivo es de distancia y ha sido disparado
     * entonces si es el jugador su vida se minimiza
     * si es un disparo de otro tanque la vida de la bala se acaba
     * por otro lado si el objeto es de contacto y ha sido tocado por el jugador
     * entonces la vida de este se acaba
     */
    cumplido(){
        let myleft = this._x;
        let myright = this._x + (this._sprite._width);
        let mytop = this._y;
        let mybottom = this._y + (this._sprite._width);
        if(this._tipo==="d"){
            let colided=check_colision(myGameArea.balas,myleft,myright,mytop,mybottom,[0,0]);
            if(colided!==undefined ){
                colided.vida=0;
                if(colided.tanque==="j")
                    this._vida-=colided.dano;
            }
        }
        else {
            // objetivo de contacto: aceptar colisión con jugador1 o jugador2 (si existe)
            let colided = check_colision([myGameArea.jugador], myleft, myright, mytop, mybottom, [0,0]);
            if (colided === undefined && typeof myGameArea !== 'undefined' && myGameArea.jugador2) {
                colided = check_colision([myGameArea.jugador2], myleft, myright, mytop, mybottom, [0,0]);
            }
            if(colided!==undefined){
                try {
                    if (this._sprite === target_0 && typeof colided.applyPower === 'function') {
                        colided.applyPower(15);
                    }
                } catch (e) {}
                this._vida--;
            }
        }
    }

    /**
     * metodo para actualizar el estado de los objetivos
     */
    update() {
        if (this.cumplido()){
            this._vida--;
        }
        myGameArea.context.drawImage(this._sprite.get_dir([0,0]), this._x, this._y);
    }

    get tipo() {
        return this._tipo;
    }
}
