/**
 * Clase encargada de manejar la informacion referente a los sprites utilizados en el juego
 */
class Sprite {
    constructor(left, right, up, down, width) {
        this._images = [];
        this._images.push(new Image());
        this._images.push(new Image());
        this._images.push(new Image());
        this._images.push(new Image());
        this._images[0].src = up;
        this._images[1].src = down;
        this._images[2].src = left;
        this._images[3].src = right;
        this._width = width;
    }

    /**
     * se encarga de retornar el sprite adecuado basado en la direccion en la que se mueve el objeto
     * @param dir: direccion en la que se va a mover el objeto
     * @returns {*} sprite adecuado a la direccion que recibió
     */
    get_dir(dir) {
        return this._images[dir[0] * ((dir[0] + 1) / 2) + (dir[1]**2) * (2+((dir[1] + 1)/2))];
    }

    /**
     * retorna el ancho del sprite
     * @returns {*}
     */
    get width() {
        return this._width;
    }
}