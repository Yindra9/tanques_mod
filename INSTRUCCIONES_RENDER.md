# Tanques10 - modo online con Render

Esta versión conserva el juego local original. Solo se agregaron archivos de servidor y se ajustó la conexión PeerJS del modo online para usar el servidor publicado.

## Probar localmente

1. Abre esta carpeta en VS Code.
2. En la terminal ejecuta:

```bash
npm install
npm start
```

3. Abre:

```text
http://localhost:3000
```

## Subir a GitHub

```bash
git init
git add .
git commit -m "Tanques10 online para Render"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/tanques10-online.git
git push -u origin main
```

## Publicar en Render

Crear un Web Service con:

```text
Build Command: npm install
Start Command: npm start
```

Luego ambos jugadores deben entrar a la URL de Render, por ejemplo:

```text
https://tanques10-online.onrender.com
```

El jugador 1 crea sala y comparte el código o enlace. El jugador 2 se une con ese código.

## Archivos agregados

- server.js
- package.json
- render.yaml
- .gitignore
- INSTRUCCIONES_RENDER.md

## Cambio hecho en index.html

El modo online ahora usa el servidor PeerJS del mismo dominio:

```js
host: window.location.hostname
path: '/peerjs'
secure: window.location.protocol === 'https:'
```

También se bajó un poco la calidad/frecuencia de la vista remota online para evitar que el anfitrión se pegue.
