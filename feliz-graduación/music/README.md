# Directorio de Música (music/)

¡Bienvenido al directorio de música de la página de graduación!

## Sintetizador Integrado (Web Audio API)
Por defecto, la página utiliza un **sintetizador generativo y cinematográfico** escrito directamente en JavaScript (`script.js`). Este motor de audio:
* Funciona de forma 100% nativa en el navegador mediante la **Web Audio API**.
* Genera acordes analógicos cálidos (Pad) y campanas celestiales (Chime/Bell) de forma algorítmica.
* No tiene peso de descarga (0 bytes de audio transferidos), evitando demoras en redes móviles.
* Evita problemas de CORS y bloqueos de reproducción del navegador al activarse mediante la interacción directa con el botón "Abrir Sorpresa".

---

## ¿Cómo usar tu propia música (.mp3)?
Si prefieres utilizar una pista musical grabada (por ejemplo, una canción instrumental o una melodía cinematográfica en MP3):

1. **Guarda tu archivo**: Copia tu canción en formato `.mp3` dentro de esta carpeta y nómbrala `background.mp3`.
2. **Modifica el código**: Abre [script.js](file:///c:/Users/juanc/Downloads/dia de la madre/feliz-graduación/script.js) y reemplaza la clase `AmbientGradSynth` por un reproductor estándar de audio HTML5.
   
   Por ejemplo, en `script.js`, dentro del evento `btnSurprise.addEventListener`, puedes reemplazar:
   ```javascript
   audioSynth = new AmbientGradSynth();
   audioSynth.start();
   ```
   Por un elemento de audio nativo:
   ```javascript
   audioSynth = new Audio('music/background.mp3');
   audioSynth.loop = true;
   audioSynth.play();
   ```
3. **Modifica el botón de silencio**: Adapta las funciones de silencio del botón `btnAudio` para llamar a `audioSynth.pause()` y `audioSynth.play()`.

¡Disfruta personalizando esta experiencia emocional!
