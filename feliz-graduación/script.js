/**
 * ==========================================================================
 * GRADUACIÓN CINEMATOGRÁFICA - LÓGICA DE INTERACCIÓN Y CANVAS
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Referencias de elementos del DOM
    const introScreen = document.getElementById('intro-screen');
    const surpriseScreen = document.getElementById('surprise-screen');
    const introCanvas = document.getElementById('intro-canvas');
    const transitionCanvas = document.getElementById('transition-canvas');
    const fireworksCanvas = document.getElementById('fireworks-canvas');
    
    const btnSurprise = document.getElementById('btn-surprise');
    const btnAudio = document.getElementById('btn-audio');
    const btnNextToEnd = document.getElementById('btn-next-to-end');
    const btnReset = document.getElementById('btn-reset');
    
    const envelope = document.getElementById('envelope');
    const letterPaper = document.querySelector('.letter-scroll') || document.getElementById('letter-paper');
    const typewriterText = document.getElementById('typewriter-text');
    
    // Configuración global de Audio
    const bgMusic = new Audio("music/Instrumental-Arcangel.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.7;

    let audioSynth = bgMusic; // alias para compatibilidad con el resto del código
    let musicMuted = false;
    // Inicializar partículas en la intro
    initIntroParticles();

    // Inicializar lluvia de emojis
    initEmojiRain();

    /* ==========================================================================
       0. LLUVIA DE EMOJIS (Corazones, Birretes, Estrellas)
       ========================================================================== */

    function initEmojiRain() {
        const canvas = document.getElementById('rain-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w = canvas.width  = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            w = canvas.width  = window.innerWidth;
            h = canvas.height = window.innerHeight;
        });

        const SYMBOLS = ['❤️','🎓','⭐','💛','✨','🌟'];
        const drops = [];
        const NUM_DROPS = 38;

        class Drop {
            constructor(initial) {
                this.reset(initial);
            }
            reset(initial) {
                this.symbol  = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
                this.x       = Math.random() * w;
                this.y       = initial ? Math.random() * -h : -40;
                this.size    = Math.random() * 18 + 14;
                this.speed   = Math.random() * 1.2 + 0.5;
                this.sway    = Math.random() * 2 - 1;
                this.angle   = 0;
                this.angleV  = (Math.random() - 0.5) * 0.03;
                this.opacity = Math.random() * 0.5 + 0.35;
                this.wobble  = Math.random() * Math.PI * 2;
                this.wobbleS = 0.02 + Math.random() * 0.015;
            }
            update() {
                this.y      += this.speed;
                this.wobble += this.wobbleS;
                this.x      += Math.sin(this.wobble) * 0.7 + this.sway * 0.3;
                this.angle  += this.angleV;
                if (this.y > h + 40) this.reset(false);
            }
            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.font = `${this.size}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.symbol, 0, 0);
                ctx.restore();
            }
        }

        for (let i = 0; i < NUM_DROPS; i++) drops.push(new Drop(true));

        function loop() {
            ctx.clearRect(0, 0, w, h);
            drops.forEach(d => { d.update(); d.draw(); });
            requestAnimationFrame(loop);
        }
        loop();
    }

    /* ==========================================================================
       1. SISTEMA DE AUDIO (REGGAETON BEAT — estilo "Tantas Ganas de Ti")
       ========================================================================== */

    class AmbientGradSynth {
        constructor() {
            this.ctx        = null;
            this.isPlaying  = false;
            this.masterGain = null;
            this.stepIndex  = 0;
            this.bpm        = 92;           // Tempo reggaeton romántico suave
            this.scheduleInterval = null;
            this.nextBeatTime    = 0;
            this.activeNodes     = [];
            this.compressor      = null;
            this.reverb          = null;
            this.reverbGain      = null;
            this.delay           = null;
            this.delayFeedback   = null;
        }

        _freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

        init() {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();

                // Compresor maestro — evita distorsión y da cohesión
                this.compressor = this.ctx.createDynamicsCompressor();
                this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
                this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
                this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
                this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
                this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
                this.compressor.connect(this.ctx.destination);

                // Master gain con fade-in suave
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
                this.masterGain.gain.linearRampToValueAtTime(0.78, this.ctx.currentTime + 3.5);
                this.masterGain.connect(this.compressor);

                // Reverb de sala mediana
                this._buildReverb();
                // Delay rítmico (3/16 — característico del reggaeton)
                this._buildDelay();

            } catch(e) { console.warn('Audio no disponible:', e); }
        }

        _buildReverb() {
            const sr  = this.ctx.sampleRate;
            const len = sr * 2.2;
            const buf = this.ctx.createBuffer(2, len, sr);
            for (let ch = 0; ch < 2; ch++) {
                const d = buf.getChannelData(ch);
                for (let i = 0; i < len; i++) {
                    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8) * (ch === 0 ? 1 : 0.85);
                }
            }
            this.reverb     = this.ctx.createConvolver();
            this.reverb.buffer = buf;
            this.reverbGain = this.ctx.createGain();
            this.reverbGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
            this.reverb.connect(this.reverbGain);
            this.reverbGain.connect(this.masterGain);
        }

        _buildDelay() {
            const spb = 60 / this.bpm;
            this.delay = this.ctx.createDelay(1.0);
            this.delay.delayTime.setValueAtTime(spb * 0.75, this.ctx.currentTime); // delay de 3/16
            this.delayFeedback = this.ctx.createGain();
            this.delayFeedback.gain.setValueAtTime(0.28, this.ctx.currentTime);
            const delayFilter = this.ctx.createBiquadFilter();
            delayFilter.type = 'lowpass';
            delayFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);
            this.delay.connect(delayFilter);
            delayFilter.connect(this.delayFeedback);
            this.delayFeedback.connect(this.delay);
            this.delayFeedback.connect(this.masterGain);
            this._delayInput = this.delay; // para conectar señales
        }

        start() {
            if (this.isPlaying) return;
            if (!this.ctx) this.init();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            this.isPlaying    = true;
            this.nextBeatTime = this.ctx.currentTime + 0.05;
            this._schedulerLoop();
        }

        stop() {
            this.isPlaying = false;
            clearInterval(this.scheduleInterval);
            this.scheduleInterval = null;
            if (this.masterGain) {
                this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
                this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
            }
            setTimeout(() => {
                this.activeNodes.forEach(n => { try { n.stop(); } catch(e){} });
                this.activeNodes = [];
            }, 700);
        }

        _schedulerLoop() {
            const lookahead = 0.14;
            const interval  = 55;
            const spb       = 60 / this.bpm / 2; // corchea

            const tick = () => {
                if (!this.isPlaying) return;
                while (this.nextBeatTime < this.ctx.currentTime + lookahead) {
                    this._renderStep(this.nextBeatTime);
                    this.stepIndex    = (this.stepIndex + 1) % 32; // 2 compases de 16
                    this.nextBeatTime += spb;
                }
            };
            tick();
            this.scheduleInterval = setInterval(tick, interval);
        }

        /* =====================================================================
           PATRÓN MUSICAL — estilo romántico urbano / trap suave
           Progresión en Am: Am – F – C – G  (muy similar a "Tantas Ganas de Ti")
           Melodía principal en escala menor: notas La3-Si3-Do4-Re4-Mi4-Fa4-Sol4
           ===================================================================== */
        _renderStep(t) {
            const s = this.stepIndex;
            // Número de compás (0-1) y beat dentro del compás (0-15)
            const measure = Math.floor(s / 16);
            const beat    = s % 16;
            const spb1    = 60 / this.bpm;

            // ── KICK 808 suave ──────────────────────────────────
            // Golpes en 0, 4, 8, 12 (negras) + pickup en 10 y 14
            if ([0, 8, 16, 24].includes(s) || [10, 26].includes(s)) {
                this._kick808(t, [0,16].includes(s) ? 0.82 : 0.55);
            }

            // ── SNARE / RIM ─────────────────────────────────────
            if ([8, 24].includes(s)) this._snare(t, 0.48);
            // Rimshot ligero en los +2
            if ([4, 12, 20, 28].includes(s)) this._rim(t, 0.2);

            // ── HI-HAT ──────────────────────────────────────────
            const hhVol = (s % 2 === 0) ? 0.13 : 0.07;
            this._hihat(t, hhVol, s % 4 === 0);

            // ── BAJO 808 MELÓDICO ────────────────────────────────
            // Progresión Am-F-C-G en 8 corcheas por acorde (32 pasos / 4 acordes = 8 pasos c/u)
            const chordIdx   = Math.floor(s / 8) % 4;
            const bassRoots  = [45, 41, 48, 43]; // La2, Fa2, Do3, Sol2
            if (s % 8 === 0) this._bass808(t, bassRoots[chordIdx], 0.45, spb1 * 3.8);
            if (s % 8 === 4) this._bass808(t, bassRoots[chordIdx] + 7, 0.28, spb1 * 1.6);

            // ── PAD ARMÓNICO (acordes) ───────────────────────────
            // Am, F, C, G  →  notas de 3 voces
            const pads = [
                [57, 60, 64], // Am (La3, Do4, Mi4)
                [53, 57, 60], // F  (Fa3, La3, Do4)
                [48, 52, 55], // C  (Do3, Mi3, Sol3)
                [43, 47, 50], // G  (Sol2, Si2, Re3)
            ];
            if (s % 8 === 0) {
                pads[chordIdx].forEach((m, i) => {
                    this._pad(t + i * 0.04, m, 0.055, spb1 * 7.5);
                });
            }

            // ── MELODÍA PRINCIPAL ────────────────────────────────
            // Melodía romántica sobre Am que suena como la canción de Arcangel
            const melodicPhrases = [
                // Frase 1 (compás 0, pasos 0-15)
                { 0: 69, 2: 72, 4: 71, 6: 69, 8: 67, 10: 69, 12: 72, 14: 74 },
                // Frase 2 (compás 1, pasos 16-31)
                { 0: 72, 2: 74, 4: 72, 6: 71, 8: 69, 10: 67, 12: 65, 14: 64 },
            ];
            const phrase = melodicPhrases[measure % 2];
            if (phrase[beat] !== undefined) {
                const dur = (beat % 4 === 0) ? spb1 * 1.6 : spb1 * 0.9;
                this._lead(t, phrase[beat], 0.16, dur);
            }

            // ── CONTRA-MELODÍA sutil (coro suave en el 2do compás) ──
            if (measure === 1 && [2, 6, 10, 14].includes(beat)) {
                const counterNotes = { 2: 64, 6: 65, 10: 67, 14: 65 };
                this._counterLead(t, counterNotes[beat], 0.07, spb1 * 0.8);
            }
        }

        _kick808(t, vol) {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(180, t);
            o.frequency.exponentialRampToValueAtTime(38, t + 0.28);
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
            o.connect(g); g.connect(this.masterGain);
            o.start(t); o.stop(t + 0.35);
            this.activeNodes.push(o);
        }

        _snare(t, vol) {
            const sr  = this.ctx.sampleRate;
            const len = Math.floor(sr * 0.18);
            const buf = this.ctx.createBuffer(1, len, sr);
            const d   = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.4);
            const src  = this.ctx.createBufferSource(); src.buffer = buf;
            const filt = this.ctx.createBiquadFilter();
            filt.type = 'bandpass'; filt.frequency.setValueAtTime(1600, t); filt.Q.setValueAtTime(0.7, t);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
            src.connect(filt); filt.connect(g); g.connect(this.masterGain);
            g.connect(this.reverb);
            src.start(t); src.stop(t + 0.2);
            this.activeNodes.push(src);
        }

        _rim(t, vol) {
            const sr  = this.ctx.sampleRate;
            const buf = this.ctx.createBuffer(1, Math.floor(sr * 0.04), sr);
            const d   = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            const src  = this.ctx.createBufferSource(); src.buffer = buf;
            const filt = this.ctx.createBiquadFilter();
            filt.type = 'highpass'; filt.frequency.setValueAtTime(5000, t);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
            src.connect(filt); filt.connect(g); g.connect(this.masterGain);
            src.start(t); src.stop(t + 0.05);
            this.activeNodes.push(src);
        }

        _hihat(t, vol, accent) {
            const sr  = this.ctx.sampleRate;
            const len = Math.floor(sr * (accent ? 0.06 : 0.035));
            const buf = this.ctx.createBuffer(1, len, sr);
            const d   = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
            const src  = this.ctx.createBufferSource(); src.buffer = buf;
            const filt = this.ctx.createBiquadFilter();
            filt.type = 'highpass'; filt.frequency.setValueAtTime(9500, t);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            src.connect(filt); filt.connect(g); g.connect(this.masterGain);
            src.start(t); src.stop(t + 0.07);
            this.activeNodes.push(src);
        }

        _bass808(t, midi, vol, dur) {
            const o1  = this.ctx.createOscillator();
            const o2  = this.ctx.createOscillator();
            const g   = this.ctx.createGain();
            const lp  = this.ctx.createBiquadFilter();
            const freq = this._freq(midi);
            o1.type = 'sine';   o1.frequency.setValueAtTime(freq, t);
            o2.type = 'triangle'; o2.frequency.setValueAtTime(freq * 2, t); // subarmónico
            lp.type = 'lowpass'; lp.frequency.setValueAtTime(280, t);
            lp.frequency.linearRampToValueAtTime(200, t + dur * 0.5);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.015);
            g.gain.setValueAtTime(vol * 0.8, t + dur * 0.6);
            g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            o1.connect(g); o2.connect(g); g.connect(lp); lp.connect(this.masterGain);
            o1.start(t); o1.stop(t + dur + 0.05);
            o2.start(t); o2.stop(t + dur + 0.05);
            this.activeNodes.push(o1, o2);
        }

        _pad(t, midi, vol, dur) {
            // Pad con 2 osciladores ligeramente desafinados → sonido tipo sintetizador analógico cálido
            [0, 5, -5].forEach(detune => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'triangle';
                o.frequency.setValueAtTime(this._freq(midi), t);
                o.detune.setValueAtTime(detune, t);
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(vol / 3, t + 0.5);
                g.gain.setValueAtTime(vol / 3, t + dur - 0.8);
                g.gain.exponentialRampToValueAtTime(0.001, t + dur);
                o.connect(g);
                g.connect(this.masterGain);
                g.connect(this.reverb);
                o.start(t); o.stop(t + dur + 0.1);
                this.activeNodes.push(o);
            });
        }

        _lead(t, midi, vol, dur) {
            // Melodía principal — sintetizador tipo piano eléctrico con ataque rápido
            const o   = this.ctx.createOscillator();
            const o2  = this.ctx.createOscillator();
            const g   = this.ctx.createGain();
            const lp  = this.ctx.createBiquadFilter();
            const freq = this._freq(midi);
            o.type  = 'sawtooth'; o.frequency.setValueAtTime(freq, t);
            o2.type = 'sine';     o2.frequency.setValueAtTime(freq * 2.01, t); // armónico leve
            lp.type = 'lowpass';  lp.frequency.setValueAtTime(3200, t);
            lp.frequency.exponentialRampToValueAtTime(1800, t + dur);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.012);
            g.gain.setValueAtTime(vol * 0.75, t + dur * 0.4);
            g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            o.connect(lp); o2.connect(lp); lp.connect(g);
            g.connect(this.masterGain);
            g.connect(this.reverb);
            g.connect(this._delayInput); // delay en la melodía
            o.start(t);  o.stop(t + dur + 0.08);
            o2.start(t); o2.stop(t + dur + 0.08);
            this.activeNodes.push(o, o2);
        }

        _counterLead(t, midi, vol, dur) {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(this._freq(midi), t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            o.connect(g);
            g.connect(this.masterGain);
            g.connect(this.reverb);
            o.start(t); o.stop(t + dur + 0.05);
            this.activeNodes.push(o);
        }

        playSparkleChime() {
            if (!this.ctx || !this.isPlaying) return;
            const now = this.ctx.currentTime;
            // Arpegio Am ascendente rápido
            [69, 72, 76, 81, 84].forEach((m, i) => {
                this._lead(now + i * 0.07, m, 0.14, 0.3);
            });
        }
    }

    /* ==========================================================================
       2. CANVAS DE INTRO: PARTÍCULAS DE POLVO DORADO
       ========================================================================== */

    function initIntroParticles() {
        const ctx = introCanvas.getContext('2d');
        let animationFrameId;
        let width = (introCanvas.width = window.innerWidth);
        let height = (introCanvas.height = window.innerHeight);

        const particles = [];
        const maxParticles = Math.min(100, Math.floor((width * height) / 10000));
        
        let mouse = { x: null, y: null, radius: 100 };

        window.addEventListener('resize', () => {
            width = introCanvas.width = window.innerWidth;
            height = introCanvas.height = window.innerHeight;
        });

        // Evento mouse para interacción sutil
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
        });

        window.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        });

        class Particle {
            constructor() {
                this.reset(true);
            }

            reset(initial = false) {
                this.x = Math.random() * width;
                this.y = initial ? Math.random() * height : height + 10;
                this.size = Math.random() * 2.5 + 0.5;
                this.speedY = -(Math.random() * 0.6 + 0.2);
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.6 + 0.2;
                this.baseOpacity = this.opacity;
                this.angle = Math.random() * Math.PI * 2;
                this.angleSpeed = Math.random() * 0.02 - 0.01;
            }

            update() {
                this.y += this.speedY;
                this.angle += this.angleSpeed;
                // Movimiento senoidal horizontal para simular flotación
                this.x += this.speedX + Math.sin(this.angle) * 0.15;

                // Repulsión del cursor
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = this.x - mouse.x;
                    const dy = this.y - mouse.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance < mouse.radius) {
                        const force = (mouse.radius - distance) / mouse.radius;
                        // Mover suavemente en dirección contraria
                        this.x += (dx / distance) * force * 1.5;
                        this.y += (dy / distance) * force * 1.5;
                    }
                }

                // Reset si sale de pantalla o se apaga
                if (this.y < -10 || this.x < -10 || this.x > width + 10) {
                    this.reset(false);
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                // Degradado radial de brillo
                const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                grad.addColorStop(0, `rgba(255, 223, 0, ${this.opacity})`);
                grad.addColorStop(0.5, `rgba(212, 175, 55, ${this.opacity * 0.6})`);
                grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
                ctx.fillStyle = grad;
                ctx.fill();
            }
        }

        // Crear lote inicial
        for (let i = 0; i < maxParticles; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            // Capa de fondo degradada muy sutil en Canvas para mejorar rendimiento
            ctx.fillStyle = 'rgba(11, 11, 12, 0.2)';
            ctx.fillRect(0, 0, width, height);

            particles.forEach((p) => {
                p.update();
                p.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        }

        animate();

        // Guardar ID de animación en la ventana para poder destruirla
        window._introAnimFrame = animationFrameId;
    }

    /* ==========================================================================
       3. TRANSICIÓN DE PANTALLA: DESTELLO Y CONFETI EXCLUSIVO
       ========================================================================== */

    function runSurpriseTransition(callback) {
        const ctx = transitionCanvas.getContext('2d');
        let width = (transitionCanvas.width = window.innerWidth);
        let height = (transitionCanvas.height = window.innerHeight);

        window.addEventListener('resize', () => {
            width = transitionCanvas.width = window.innerWidth;
            height = transitionCanvas.height = window.innerHeight;
        });

        // Configuración de Confeti
        const confetiParticles = [];
        const numParticles = 140;
        const colors = [
            '#D4AF37', // Oro clásico
            '#FFDF00', // Oro brillante
            '#AA7C11', // Oro bronce
            '#FFFFFF', // Blanco luminoso
            '#E5E5E5', // Plateado suave
            '#F3E5AB'  // Vainilla dorado
        ];

        class Confeti {
            constructor() {
                // Lanzamiento desde el centro del botón aproximadamente
                this.x = width / 2;
                this.y = height / 2;
                this.size = Math.random() * 6 + 4;
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 18 + 6;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed - 5; // Tendencia hacia arriba
                this.gravity = 0.22;
                this.drag = 0.96;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.opacity = 1;
                this.rotation = Math.random() * 360;
                this.rotationSpeed = Math.random() * 10 - 5;
            }

            update() {
                this.vx *= this.drag;
                this.vy *= this.drag;
                this.vy += this.gravity;
                this.x += this.vx;
                this.y += this.vy;
                this.rotation += this.rotationSpeed;
                this.opacity -= 0.008;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.rotation * Math.PI) / 180);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = Math.max(0, this.opacity);
                
                // Formas de confeti cuadradas y circulares
                if (Math.random() > 0.5) {
                    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
                } else {
                    ctx.beginPath();
                    ctx.ellipse(0, 0, this.size / 2, this.size / 3, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        // Crear confeti
        for (let i = 0; i < numParticles; i++) {
            confetiParticles.push(new Confeti());
        }

        // Parámetro para destello de luz inicial
        let flashOpacity = 1;
        let startTime = null;

        function animateTransition(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            ctx.clearRect(0, 0, width, height);

            // 1. Dibujar y desvanecer confeti
            let activeConfeti = false;
            confetiParticles.forEach(c => {
                c.update();
                if (c.opacity > 0) {
                    c.draw();
                    activeConfeti = true;
                }
            });

            // 2. Destello blanco/dorado inicial cinematográfico
            if (flashOpacity > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
                ctx.fillRect(0, 0, width, height);
                flashOpacity -= 0.04; // Se desvanece rápido
            }

            // A la mitad del destello visual (cuando está cubriendo casi todo), ejecutamos el callback para el cambio de sección
            if (flashOpacity <= 0.8 && callback) {
                callback();
                callback = null; // Ejecutar una sola vez
            }

            if (activeConfeti || flashOpacity > 0) {
                requestAnimationFrame(animateTransition);
            } else {
                ctx.clearRect(0, 0, width, height); // Limpiar lienzo al terminar
            }
        }

        requestAnimationFrame(animateTransition);
    }

    /* ==========================================================================
       4. INTERACCIÓN DE BOTONES Y TRANSICIÓN DE SECCIONES
       ========================================================================== */

    btnSurprise.addEventListener('click', () => {
        // Inicializar e iniciar audio
        bgMusic.play().catch(e => console.warn('Audio bloqueado por el navegador:', e));

        // Lanzar la ráfaga de confeti y realizar la transición de pantalla
        runSurpriseTransition(() => {
            // Cancelar animación del canvas de la intro para ahorrar GPU
            if (window._introAnimFrame) {
                cancelAnimationFrame(window._introAnimFrame);
            }

            // Cambiar visibilidad de secciones
            introScreen.classList.remove('intro-active');
            introScreen.classList.add('intro-fade-out');
            
            setTimeout(() => {
                introScreen.classList.add('hidden');
                
                // Mostrar pantalla sorpresa
                surpriseScreen.classList.remove('hidden');
                // Forzar reflujo de CSS para aplicar transición
                surpriseScreen.offsetHeight;
                surpriseScreen.classList.add('surprise-active');
                btnAudio.classList.remove('hidden');
                
                // Activar animación inicial del botón flotante y chimes
                
            }, 800);
        });
    });

    // Control de silencio / reproducción de audio
    btnAudio.addEventListener('click', () => {
        musicMuted = !musicMuted;
        if (musicMuted) {
            bgMusic.pause();
            btnAudio.querySelector('.icon-play').classList.add('hidden');
            btnAudio.querySelector('.icon-mute').classList.remove('hidden');
        } else {
            bgMusic.play().catch(e => console.warn('Audio bloqueado:', e));
            btnAudio.querySelector('.icon-play').classList.remove('hidden');
            btnAudio.querySelector('.icon-mute').classList.add('hidden');
        }
    });

    /* ==========================================================================
       5. LÓGICA DE LA CARTA: APERTURA Y MÁQUINA DE ESCRIBIR
       ========================================================================== */

    const letterContent = `Luisa.\n\nHoy quiero decirte que estoy muy orgulloso de ti Lu. Cada hora de estudio, cada noche en vela y cada obstáculo superado han valido la pena para que llegues a ese momento.\n\nEse título tuyo no solo representa los conocimientos que has adquirido, sino tu constancia incansable, tu resiliencia tanto en los momentos difíciles y en los alegres.\n\nSe que no te gusta tanto el cariño afectivo de face to face pero espero que estas palabras por almenos valgan algo en cualquier momento. El camino que tienes por delante está lleno de grandes retos, pero se que la vas a romper.\n\n ¡Por si las dudas No lo saque de chat gpt JAJAJAJA...\n\n¡ Y pues decirle lo mucho que la quiero y por ser esa mujer de admirar!\n\n Ya para terminar decirte que aun estas a tiempo de estudiar lo que te gusta nunca es tarde (HOTELERIA)!!!!`;

    let typewriterIndex = 0;
    let isWriting = false;

    envelope.addEventListener('click', () => {
        if (isWriting) return;

        // Tocar efecto celestial al abrir
        if (audioSynth && !musicMuted) {
            
        }

        // Animación de abrir sobre
        envelope.classList.add('open-envelope');
        
        setTimeout(() => {
            letterPaper.classList.add('open-paper');
            
            // Iniciar máquina de escribir tras abrir el papel
            setTimeout(() => {
                startTypewriter();
            }, 1000);
        }, 800);
    });

    function startTypewriter() {
        if (isWriting) return;
        isWriting = true;
        typewriterText.innerHTML = '';
        typewriterText.classList.add('typewriter-cursor');
        typewriterIndex = 0;

        function type() {
            if (typewriterIndex < letterContent.length) {
                const char = letterContent.charAt(typewriterIndex);
                typewriterText.innerHTML += char;
                typewriterIndex++;
                
                // Velocidad variable y orgánica (simula digitación humana)
                let delay = 35 + Math.random() * 25;
                if (char === '.' || char === '!' || char === '?') delay = 500; // Pausa en puntos
                if (char === ',') delay = 250; // Pausa en comas

                setTimeout(type, delay);
            } else {
                // Terminado de escribir
                typewriterText.classList.remove('typewriter-cursor');
                isWriting = false;
                
                // Mostrar botón para ir al final con efecto de transición suave
                btnNextToEnd.classList.remove('hidden');
                btnNextToEnd.style.opacity = '0';
                btnNextToEnd.style.transition = 'opacity 1s ease';
                setTimeout(() => {
                    btnNextToEnd.style.opacity = '1';
                }, 100);
            }
        }

        type();
    }

    // Botón para hacer scroll suave hasta el final cinematográfico
    btnNextToEnd.addEventListener('click', () => {
        const outroSection = document.getElementById('outro-section');
        outroSection.scrollIntoView({ behavior: 'smooth' });
        
        // Activar la sección final tras el scroll
        setTimeout(() => {
            document.querySelector('.outro-content').classList.add('outro-active');
            initFireworksEngine();
        }, 800);
    });

    /* ==========================================================================
       6. MOTOR DE FUEGOS ARTIFICIALES INTERACTIVOS (CANVAS FINAL)
       ========================================================================== */

    let fireworksActive = false;
    let fireworksAnimFrame = null;
    let launchInterval = null;

    function initFireworksEngine() {
        if (fireworksActive) return;
        fireworksActive = true;

        const ctx = fireworksCanvas.getContext('2d');
        let width = (fireworksCanvas.width = window.innerWidth);
        let height = (fireworksCanvas.height = window.innerHeight);

        const fireworks = [];
        const particles = [];
        
        const colors = [
            '#FFDF00', // Oro
            '#D4AF37', // Oro viejo
            '#FFFFFF', // Blanco destello
            '#F0E68C', // Caqui / champán
            '#BDB76B'  // Dorado oscuro
        ];

        window.addEventListener('resize', () => {
            width = fireworksCanvas.width = window.innerWidth;
            height = fireworksCanvas.height = window.innerHeight;
        });

        class Firework {
            constructor(targetX, targetY) {
                this.x = Math.random() * width;
                this.y = height;
                this.targetX = targetX;
                this.targetY = targetY;
                this.distanceToTarget = Math.hypot(targetX - this.x, targetY - this.y);
                this.distanceTraveled = 0;
                this.coordinates = [];
                this.coordinateCount = 3;
                while (this.coordinateCount--) {
                    this.coordinates.push([this.x, this.y]);
                }
                this.angle = Math.atan2(targetY - this.y, targetX - this.x);
                this.speed = 10;
                this.acceleration = 1.025;
                this.brightness = Math.random() * 50 + 50;
            }

            update(index) {
                this.coordinates.pop();
                this.coordinates.unshift([this.x, this.y]);
                this.speed *= this.acceleration;
                
                const vx = Math.cos(this.angle) * this.speed;
                const vy = Math.sin(this.angle) * this.speed;
                
                this.distanceTraveled = Math.hypot(this.targetX - (this.x + vx), this.targetY - (this.y + vy));
                
                if (this.distanceTraveled <= 15) {
                    createParticles(this.targetX, this.targetY);
                    fireworks.splice(index, 1);
                    
                    // Tocar un mini destello sonoro si no está silenciado
                    if (audioSynth && !musicMuted) {
                        
                    }
                } else {
                    this.x += vx;
                    this.y += vy;
                }
            }

            draw() {
                ctx.beginPath();
                ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
                ctx.lineTo(this.x, this.y);
                ctx.strokeStyle = `hsla(45, 100%, ${this.brightness}%, ${Math.random() * 0.4 + 0.6})`;
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }
        }

        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.coordinates = [];
                this.coordinateCount = 5;
                while (this.coordinateCount--) {
                    this.coordinates.push([this.x, this.y]);
                }
                this.angle = Math.random() * Math.PI * 2;
                this.speed = Math.random() * 7 + 2;
                this.friction = 0.95;
                this.gravity = 0.12;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.opacity = 1.0;
                this.decay = Math.random() * 0.015 + 0.01;
            }

            update(index) {
                this.coordinates.pop();
                this.coordinates.unshift([this.x, this.y]);
                this.speed *= this.friction;
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed + this.gravity;
                this.opacity -= this.decay;
                
                if (this.opacity <= this.decay) {
                    particles.splice(index, 1);
                }
            }

            draw() {
                ctx.beginPath();
                ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
                ctx.lineTo(this.x, this.y);
                ctx.strokeStyle = this.color;
                ctx.globalAlpha = Math.max(0, this.opacity);
                ctx.lineWidth = 1.8;
                ctx.stroke();
                ctx.globalAlpha = 1.0; // Restablecer
            }
        }

        function createParticles(x, y) {
            let particleCount = Math.floor(Math.random() * 40) + 60; // 60 a 100 chispas
            while (particleCount--) {
                particles.push(new Particle(x, y));
            }
        }

        // Clicar en canvas para lanzar fuegos artificiales personalizados
        fireworksCanvas.addEventListener('click', (e) => {
            const rect = fireworksCanvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            fireworks.push(new Firework(clickX, clickY));
        });

        // Bucle de animación de fuegos artificiales
        function loop() {
            if (!fireworksActive) return;
            
            // Efecto estela (semi-borrado)
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(11, 11, 12, 0.25)';
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'lighter';
            
            let i = fireworks.length;
            while (i--) {
                fireworks[i].draw();
                fireworks[i].update(i);
            }
            
            let j = particles.length;
            while (j--) {
                particles[j].draw();
                particles[j].update(j);
            }
            
            fireworksAnimFrame = requestAnimationFrame(loop);
        }

        // Lanzador automático suave
        launchInterval = setInterval(() => {
            if (fireworks.length < 5) {
                const targetX = Math.random() * width * 0.8 + width * 0.1;
                const targetY = Math.random() * height * 0.4 + height * 0.1;
                fireworks.push(new Firework(targetX, targetY));
            }
        }, 1100);

        loop();
        window._fireworksAnimFrame = fireworksAnimFrame;
        window._launchInterval = launchInterval;
    }

    function stopFireworksEngine() {
        fireworksActive = false;
        if (window._fireworksAnimFrame) cancelAnimationFrame(window._fireworksAnimFrame);
        if (window._launchInterval) clearInterval(window._launchInterval);
        
        const ctx = fireworksCanvas.getContext('2d');
        ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    }

    /* ==========================================================================
       7. REINICIO DE LA EXPERIENCIA
       ========================================================================== */

    btnReset.addEventListener('click', () => {
        // 1. Detener audio e inicializar silencio
        bgMusic.pause();
        bgMusic.currentTime = 0;
        musicMuted = false;
        btnAudio.classList.add('hidden');
        btnAudio.querySelector('.icon-play').classList.remove('hidden');
        btnAudio.querySelector('.icon-mute').classList.add('hidden');

        // 2. Detener motor de fuegos artificiales
        stopFireworksEngine();

        // 3. Volver a ocultar la pantalla de sorpresa
        surpriseScreen.classList.remove('surprise-active');
        surpriseScreen.classList.add('hidden');

        // 4. Restaurar estados de la carta y carta cerrada
        envelope.classList.remove('open-envelope');
        letterPaper.classList.remove('open-paper');
        typewriterText.innerHTML = '';
        btnNextToEnd.classList.add('hidden');
        document.querySelector('.outro-content').classList.remove('outro-active');

        // 5. Reiniciar y activar la pantalla de inicio
        introScreen.classList.remove('hidden');
        // Forzar reflujo de CSS
        introScreen.offsetHeight;
        introScreen.classList.remove('intro-fade-out');
        introScreen.classList.add('intro-active');

        // Reiniciar la animación de partículas de la intro
        initIntroParticles();

        // Hacer scroll automático al inicio
        window.scrollTo({ top: 0, behavior: 'instant' });
    });
});
