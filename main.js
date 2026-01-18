// Top-Down Shooter - Single-file JS
// Emphasis on clarity and readability; no external libs.

(function () {
  "use strict";

  /** Audio System **/
  class AudioSystem {
    constructor() {
      this.audioContext = null;
      this.masterGain = null;
      this.sfxGain = null;
      this.musicGain = null;
      this.isInitialized = false;
      this.initAudio();
    }

    initAudio() {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.sfxGain = this.audioContext.createGain();
        this.musicGain = this.audioContext.createGain();
        
        this.masterGain.connect(this.audioContext.destination);
        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        
        this.masterGain.gain.value = 0.8; // Increased master volume
        this.sfxGain.gain.value = 1.0; // Increased SFX volume
        this.musicGain.gain.value = 0.4; // Increased music volume
        
        this.isInitialized = true;
      } catch (e) {
        console.warn("Audio not supported:", e);
      }
    }

    resumeAudio() {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    }

    playTone(frequency, duration, volume = 0.1, type = 'sine', attack = 0.01, decay = 0.1) {
      if (!this.isInitialized) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + attack);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + attack + decay);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + attack + decay);
    }

    playNoise(duration, volume = 0.1, filterFreq = 1000) {
      if (!this.isInitialized) return;
      
      const bufferSize = this.audioContext.sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      source.start(this.audioContext.currentTime);
    }

    playShootSound() {
      const baseFreq = 120 + Math.random() * 40; // Much lower, bass-heavy
      this.playTone(baseFreq, 0.15, 0.2, 'sawtooth', 0.01, 0.08);
      this.playTone(baseFreq * 2, 0.12, 0.15, 'square', 0.01, 0.06);
      this.playTone(baseFreq * 0.5, 0.2, 0.18, 'triangle', 0.01, 0.1);
    }

    playHitSound() {
      const freq = 80 + Math.random() * 30; // Much lower bass frequencies
      this.playTone(freq, 0.25, 0.18, 'sawtooth', 0.01, 0.2);
      this.playTone(freq * 1.5, 0.2, 0.12, 'square', 0.01, 0.15);
      this.playNoise(0.15, 0.1, 400); // Lower filtered noise
    }

    playExplosionSound() {
      this.playNoise(0.4, 0.25, 800); // Lower, more intense noise
      this.playTone(40, 0.5, 0.2, 'sawtooth', 0.01, 0.4); // Deep bass rumble
      this.playTone(60, 0.3, 0.15, 'square', 0.01, 0.25);
      setTimeout(() => {
        this.playTone(30, 0.3, 0.12, 'triangle', 0.01, 0.2); // Even deeper
      }, 150);
    }

    playDamageSound() {
      const freq = 60 + Math.random() * 20; // Deep bass damage sound
      this.playTone(freq, 0.4, 0.15, 'sawtooth', 0.01, 0.3);
      this.playTone(freq * 0.7, 0.3, 0.12, 'square', 0.01, 0.25);
      this.playNoise(0.2, 0.08, 300); // Lower filtered noise
    }

    playGameOverSound() {
      this.playTone(80, 0.6, 0.25, 'sawtooth', 0.1, 0.5); // Deep, dramatic bass
      setTimeout(() => this.playTone(60, 0.6, 0.2, 'sawtooth', 0.1, 0.5), 300);
      setTimeout(() => this.playTone(40, 1.0, 0.15, 'sawtooth', 0.1, 0.8), 600);
    }

    playRestartSound() {
      this.playTone(120, 0.25, 0.2, 'sawtooth', 0.01, 0.2); // Energetic bass buildup
      setTimeout(() => this.playTone(150, 0.25, 0.2, 'square', 0.01, 0.2), 100);
      setTimeout(() => this.playTone(180, 0.3, 0.2, 'sawtooth', 0.01, 0.25), 200);
    }

    playWaveTransitionSound() {
      // Ascending tone for wave progression
      this.playTone(100, 0.2, 0.15, 'sawtooth', 0.01, 0.15);
      setTimeout(() => this.playTone(150, 0.2, 0.15, 'square', 0.01, 0.15), 100);
      setTimeout(() => this.playTone(200, 0.3, 0.18, 'sawtooth', 0.01, 0.2), 200);
      this.playNoise(0.2, 0.12, 600);
    }

    playEnemySpawnSound() {
      // Subtle spawn sound
      const freq = 60 + Math.random() * 20;
      this.playTone(freq, 0.15, 0.08, 'sawtooth', 0.05, 0.1);
      this.playTone(freq * 1.5, 0.12, 0.06, 'square', 0.05, 0.08);
    }

    playLowHealthWarning() {
      // Pulsing warning sound
      const freq = 70 + Math.random() * 10;
      this.playTone(freq, 0.3, 0.12, 'sawtooth', 0.01, 0.25);
    }

    startAmbientMusic() {
      // Ambient music disabled - function does nothing
      return;
    }
  }

  const audio = new AudioSystem();

  /** Canvas setup **/
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  // UI elements
  const healthBarEl = document.getElementById("health-bar");
  const waveEl = document.getElementById("wave");
  const scoreEl = document.getElementById("score");
  const overlayEl = document.getElementById("overlay");
  const finalScoreEl = document.getElementById("final-score");
  const restartBtn = document.getElementById("restart");
  const crosshairEl = document.getElementById("crosshair");
  
  // Home page elements
  const homePageEl = document.getElementById("home-page");
  const gamePageEl = document.getElementById("game-page");
  const startGameBtn = document.getElementById("start-game");
  const backToHomeBtn = document.getElementById("back-to-home");

  /** Game state **/
  const state = {
    isRunning: true,
    score: 0,
    wave: 1,
    timeSinceStartMs: 0,
    lastFrameTs: performance.now(),
    screenShake: 0,
    flashEffect: 0,
    lastLowHealthWarning: 0,
  };

  // Rotating hue seed for shots/FX
  let projectileHueSeed = 0;

  /** Input handling **/
  const keys = new Set();
  const mouse = {
    x: 0,
    y: 0,
    isDown: false,
  };

  window.addEventListener("keydown", (e) => {
    keys.add(e.key.toLowerCase());
    if (!state.isRunning && (e.key === "r" || e.key === "R")) {
      restartGame();
    }
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener("mousedown", () => (mouse.isDown = true));
  window.addEventListener("mouseup", () => (mouse.isDown = false));
  window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    crosshairEl.style.left = `${e.clientX}px`;
    crosshairEl.style.top = `${e.clientY}px`;
  });

  restartBtn.addEventListener("click", restartGame);
  backToHomeBtn.addEventListener("click", goToHome);
  startGameBtn.addEventListener("click", startGame);

  /** Coordinate scaling **/
  let devicePixelRatioCached = Math.max(window.devicePixelRatio || 1, 1);
  function resizeCanvas() {
    devicePixelRatioCached = Math.max(window.devicePixelRatio || 1, 1);
    const width = Math.floor(window.innerWidth);
    const height = Math.floor(window.innerHeight);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = Math.floor(width * devicePixelRatioCached);
    canvas.height = Math.floor(height * devicePixelRatioCached);
    ctx.setTransform(devicePixelRatioCached, 0, 0, devicePixelRatioCached, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  /** Utility functions **/
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function length(x, y) { return Math.hypot(x, y); }
  function normalize(x, y) {
    const len = length(x, y) || 1;
    return { x: x / len, y: y / len };
  }
  function randRange(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(randRange(min, max + 1)); }
  function chance(p) { return Math.random() < p; }

  /** Visual effects **/
  function addScreenShake(intensity = 10) {
    state.screenShake = Math.max(state.screenShake, intensity);
  }

  function addFlashEffect(intensity = 0.3) {
    state.flashEffect = Math.max(state.flashEffect, intensity);
  }

  function createExplosionEffect(x, y, hue) {
    // Large explosion particles
    for (let i = 0; i < 25; i++) {
      entities.particles.push(new Particle(x, y, `hsl(${hue}, 90%, 70%)`, 'explosion'));
    }
    
    // Fast spark particles
    for (let i = 0; i < 15; i++) {
      entities.particles.push(new Particle(x, y, `hsl(${(hue + 60) % 360}, 95%, 85%)`, 'spark'));
    }
    
    // Screen shake
    addScreenShake(15);
    
    // Flash effect
    addFlashEffect(0.4);
  }

  /** Entities **/
  class Entity {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.radius = 10;
      this.color = "#ffffff";
      this.friction = 0.9;
      this.alive = true;
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= this.friction;
      this.vy *= this.friction;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  class Player extends Entity {
    constructor(x, y) {
      super(x, y);
      this.radius = 14;
      this.color = "#e5e7eb";
      this.maxHealth = 100;
      this.health = this.maxHealth;
      this.moveSpeed = 260; // units per second
      this.sprintMultiplier = 1.35;
      this.reloadMs = 140; // time between shots
      this.timeSinceShotMs = 0;
      this.recoil = 0;
    }
    update(dt) {
      const isSprinting = keys.has("shift");
      const speed = this.moveSpeed * (isSprinting ? this.sprintMultiplier : 1);
      let mx = 0, my = 0;
      if (keys.has("w")) my -= 1;
      if (keys.has("s")) my += 1;
      if (keys.has("a")) mx -= 1;
      if (keys.has("d")) mx += 1;
      if (mx !== 0 || my !== 0) {
        const n = normalize(mx, my);
        this.vx = n.x * speed;
        this.vy = n.y * speed;
      } else {
        this.vx = 0; this.vy = 0;
      }

      // Integrate
      this.x = clamp(this.x + this.vx * dt, 16, canvas.width / devicePixelRatioCached - 16);
      this.y = clamp(this.y + this.vy * dt, 16, canvas.height / devicePixelRatioCached - 16);

      // Shooting (always auto-fire)
      this.timeSinceShotMs += dt * 1000;
      if (this.timeSinceShotMs >= this.reloadMs) {
        this.shoot();
        this.timeSinceShotMs = 0;
      }

      // Recoil visual feedback
      this.recoil = Math.max(0, this.recoil - dt * 10);
    }
    shoot() {
      const dir = normalize(mouse.x - this.x, mouse.y - this.y);
      const spread = clamp((1 - clamp(this.health / this.maxHealth, 0, 1)) * 0.2, 0, 0.2);
      const jitter = (Math.random() - 0.5) * spread;
      const angle = Math.atan2(dir.y, dir.x) + jitter;
      const speed = 700;
      const projectile = new Projectile(this.x + Math.cos(angle) * 18, this.y + Math.sin(angle) * 18, Math.cos(angle) * speed, Math.sin(angle) * speed);
      projectile.hue = (projectileHueSeed = (projectileHueSeed + 37) % 360);
      entities.projectiles.push(projectile);
      this.recoil = 1;
      
      // Play shooting sound
      audio.playShootSound();
    }
    draw() {
      // Directional body with subtle gradient
      const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
      const r = this.radius + this.recoil * 2;
      const px = this.x + Math.cos(angle) * (this.recoil * 2);
      const py = this.y + Math.sin(angle) * (this.recoil * 2);

      const grad = ctx.createRadialGradient(px - 6, py - 6, 2, px, py, r + 8);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(1, "#9ca3af");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();

      // Barrel
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(angle) * 24, py + Math.sin(angle) * 24);
      ctx.stroke();
    }
  }

  class Projectile extends Entity {
    constructor(x, y, vx, vy) {
      super(x, y);
      this.vx = vx; this.vy = vy;
      this.radius = 3;
      this.color = "#fef08a";
      this.lifeMs = 900;
      this.damage = 25;
      this.friction = 1;
      this.hue = randInt(0, 360);
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      // Despawn only when far off-screen (allows travel across the whole view)
      const w = canvas.width / devicePixelRatioCached;
      const h = canvas.height / devicePixelRatioCached;
      const margin = 120; // allow some offscreen travel before cleanup
      if (this.x < -margin || this.x > w + margin || this.y < -margin || this.y > h + margin) {
        this.alive = false;
      }
    }
    draw() {
      ctx.save();
      const color = `hsl(${this.hue}, 95%, 70%)`;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class Enemy extends Entity {
    constructor(x, y, stats) {
      super(x, y);
      this.radius = stats.radius;
      this.color = stats.color;
      this.hue = stats.hue;
      this.speed = stats.speed;
      this.health = stats.health;
      this.maxHealth = stats.health;
      this.touchDamage = stats.touchDamage;
      this.friction = 0.98;
      this.knockback = 0;
      this.bounty = stats.bounty;
    }
    update(dt) {
      const dir = normalize(player.x - this.x, player.y - this.y);
      const avoidance = this.computeAvoidance();
      const ax = dir.x * this.speed + avoidance.x * 120;
      const ay = dir.y * this.speed + avoidance.y * 120;
      this.vx = ax;
      this.vy = ay;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // World bounds keep inside a margin, bounce slightly
      const margin = 12;
      const maxX = canvas.width / devicePixelRatioCached - margin;
      const maxY = canvas.height / devicePixelRatioCached - margin;
      if (this.x < margin) { this.x = margin; this.vx *= -0.4; }
      if (this.x > maxX) { this.x = maxX; this.vx *= -0.4; }
      if (this.y < margin) { this.y = margin; this.vy *= -0.4; }
      if (this.y > maxY) { this.y = maxY; this.vy *= -0.4; }
    }
    computeAvoidance() {
      // Simple separation force from nearby enemies
      let ax = 0, ay = 0;
      for (const e of entities.enemies) {
        if (e === this) continue;
        const dx = this.x - e.x;
        const dy = this.y - e.y;
        const dist2 = dx * dx + dy * dy;
        const minDist = this.radius + e.radius + 4;
        if (dist2 < minDist * minDist && dist2 > 0.01) {
          const dist = Math.sqrt(dist2);
          const push = (minDist - dist) / minDist;
          ax += (dx / dist) * push;
          ay += (dy / dist) * push;
        }
      }
      return { x: ax, y: ay };
    }
    draw() {
      // Body
      const grad = ctx.createRadialGradient(this.x - 6, this.y - 6, 2, this.x, this.y, this.radius + 8);
      grad.addColorStop(0, this.color);
      grad.addColorStop(1, "#111827");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Health ring
      const hpRatio = clamp(this.health / this.maxHealth, 0, 1);
      ctx.strokeStyle = hpRatio > 0.34 ? "#34d399" : "#f87171";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpRatio);
      ctx.stroke();
    }
  }

  /** Entity collections **/
  const entities = {
    projectiles: [],
    enemies: [],
    particles: [],
  };

  /** Enhanced particle system for hits and explosions **/
  class Particle {
    constructor(x, y, color, type = 'hit') {
      this.x = x; this.y = y;
      this.type = type;
      this.color = color;
      
      if (type === 'explosion') {
        // Large explosion particles
        this.vx = randRange(-300, 300);
        this.vy = randRange(-300, 300);
        this.life = randRange(0.8, 1.5);
        this.radius = randRange(3, 8);
        this.gravity = 50;
        this.friction = 0.95;
      } else if (type === 'spark') {
        // Fast spark particles
        this.vx = randRange(-400, 400);
        this.vy = randRange(-400, 400);
        this.life = randRange(0.3, 0.7);
        this.radius = randRange(1, 3);
        this.gravity = 0;
        this.friction = 0.98;
      } else {
        // Regular hit particles
        this.vx = randRange(-120, 120);
        this.vy = randRange(-120, 120);
        this.life = randRange(0.2, 0.5);
        this.radius = randRange(1, 2);
        this.gravity = 0;
        this.friction = 0.93;
      }
    }
    
    update(dt) {
      this.life -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vy += this.gravity * dt;
      this.vx *= this.friction;
      this.vy *= this.friction;
    }
    
    draw() {
      const alpha = clamp(this.life * 2, 0, 1);
      ctx.globalAlpha = alpha;
      
      if (this.type === 'explosion') {
        // Large glowing explosion particles
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (this.type === 'spark') {
        // Bright spark particles
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Regular particles
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
    }
  }

  /** Player instance **/
  const player = new Player(window.innerWidth / 2, window.innerHeight / 2);

  /** Spawning and difficulty **/
  function enemyStatsForWave(wave) {
    // Pick an enemy type: runner (fast, 1 HP), biter (high damage), brute (high HP)
    const roll = Math.random();
    if (roll < 0.45) {
      // Runner: very fast, 1 HP, low damage, small radius
      const speed = 140 + wave * 10;
      const health = 1;
      const radius = 12;
      const touchDamage = 6 + Math.floor(wave / 3);
      const hue = 190; // cyan/teal
      const color = `hsl(${hue}, 80%, 60%)`;
      const bounty = 8 + Math.floor(wave * 1.5);
      return { speed, health, radius, touchDamage, color, bounty, hue };
    } else if (roll < 0.75) {
      // Biter: moderate speed, high contact damage, medium health
      const speed = 85 + wave * 7;
      const health = 40 + wave * 10;
      const radius = 14;
      const touchDamage = 22 + Math.floor(wave * 1.5);
      const hue = 25; // orange
      const color = `hsl(${hue}, 85%, 58%)`;
      const bounty = 14 + wave * 2;
      return { speed, health, radius, touchDamage, color, bounty, hue };
    } else {
      // Brute: slow, very high health, moderate damage, big radius
      const speed = 55 + wave * 4;
      const health = 140 + wave * 24;
      const radius = clamp(18 + Math.floor(wave / 6), 18, 26);
      const touchDamage = 14 + Math.floor(wave * 2);
      const hue = 275; // violet
      const color = `hsl(${hue}, 75%, 65%)`;
      const bounty = 24 + wave * 3;
      return { speed, health, radius, touchDamage, color, bounty, hue };
    }
  }

  function spawnEnemy() {
    const padding = 40;
    const w = canvas.width / devicePixelRatioCached;
    const h = canvas.height / devicePixelRatioCached;
    const side = randInt(0, 3); // 0 top, 1 right, 2 bottom, 3 left
    let x = 0, y = 0;
    if (side === 0) { x = randRange(-padding, w + padding); y = -padding; }
    else if (side === 1) { x = w + padding; y = randRange(-padding, h + padding); }
    else if (side === 2) { x = randRange(-padding, w + padding); y = h + padding; }
    else { x = -padding; y = randRange(-padding, h + padding); }
    const e = new Enemy(x, y, enemyStatsForWave(state.wave));
    entities.enemies.push(e);
    // Play subtle spawn sound occasionally
    if (chance(0.3)) audio.playEnemySpawnSound();
  }

  let spawnAccumulator = 0;
  function updateSpawning(dt) {
    spawnAccumulator += dt;
    const baseInterval = clamp(1.2 - state.wave * 0.06, 0.25, 1.2); // faster spawns with higher waves
    const desiredCount = clamp(4 + Math.floor(state.wave * 1.5), 4, 60);
    const canSpawn = entities.enemies.length < desiredCount;
    const interval = baseInterval;
    if (canSpawn && spawnAccumulator >= interval) {
      spawnAccumulator = 0;
      spawnEnemy();
    }

    // Advance wave slowly over time
    if (state.timeSinceStartMs > 0 && Math.floor(state.timeSinceStartMs / 15000) + 1 !== state.wave) {
      state.wave = Math.floor(state.timeSinceStartMs / 15000) + 1;
      waveEl.textContent = `Wave ${state.wave}`;
      // Play wave transition sound
      audio.playWaveTransitionSound();
    }
  }

  /** Collision and damage **/
  function handleCollisions() {
    // Projectiles vs Enemies
    for (const p of entities.projectiles) {
      if (!p.alive) continue;
      for (const e of entities.enemies) {
        if (!e.alive) continue;
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const r = p.radius + e.radius;
        if (dx * dx + dy * dy <= r * r) {
          e.health -= p.damage;
          p.alive = false;
          // particles
          for (let i = 0; i < 8; i++) entities.particles.push(new Particle(p.x, p.y, `hsl(${p.hue}, 90%, 70%)`));
          
          // Play hit sound
          audio.playHitSound();
          
          if (e.health <= 0) {
            e.alive = false;
            state.score += e.bounty;
            scoreEl.textContent = `Score: ${state.score}`;
            
            // Create spectacular explosion effect
            createExplosionEffect(e.x, e.y, e.hue);
            
            // Play explosion sound
            audio.playExplosionSound();
          }
        }
      }
    }

    // Enemies vs Player
    for (const e of entities.enemies) {
      if (!e.alive) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const r = e.radius + player.radius - 2;
      if (dx * dx + dy * dy <= r * r) {
        player.health -= e.touchDamage * 0.02; // damage per frame ~ scaled by dt in update loop
        if (player.health <= 0) {
          player.health = 0;
          endGame();
        }
        // push enemy slightly away to avoid sticking
        const dir = normalize(dx, dy);
        e.x += dir.x * 4;
        e.y += dir.y * 4;
        // hit particles
        if (chance(0.2)) entities.particles.push(new Particle(player.x, player.y, `hsl(${(projectileHueSeed + 120) % 360}, 85%, 65%)`));
        
        // Play damage sound occasionally to avoid spam
        if (chance(0.1)) audio.playDamageSound();
      }
    }
  }

  /** Render background **/
  function drawBackground(dt) {
    // Colorful moving grid with hue shifts
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = 1 / devicePixelRatioCached;
    const w = canvas.width * scale;
    const h = canvas.height * scale;
    const t = performance.now() * 0.0005;
    const gridSize = 48;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;

    // Vertical lines
    for (let x = -gridSize; x < w + gridSize; x += gridSize) {
      const ox = Math.sin(t + x * 0.02) * 2;
      const hue = (x * 2 + t * 360) % 360;
      ctx.strokeStyle = `hsla(${hue}, 70%, 45%, 0.6)`;
      ctx.beginPath();
      ctx.moveTo(x + ox, 0);
      ctx.lineTo(x + ox, h);
      ctx.stroke();
    }
    // Horizontal lines
    for (let y = -gridSize; y < h + gridSize; y += gridSize) {
      const oy = Math.cos(t + y * 0.02) * 2;
      const hue = (y * 2 + t * 360 + 120) % 360;
      ctx.strokeStyle = `hsla(${hue}, 70%, 40%, 0.6)`;
      ctx.beginPath();
      ctx.moveTo(0, y + oy);
      ctx.lineTo(w, y + oy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /** Game Loop **/
  function update(dt) {
    if (!state.isRunning) return;

    state.timeSinceStartMs += dt * 1000;
    updateSpawning(dt);

    player.update(dt);
    for (const p of entities.projectiles) p.update(dt);
    for (const e of entities.enemies) e.update(dt);
    for (const pa of entities.particles) pa.update(dt);

    handleCollisions();

    // Update visual effects
    state.screenShake = Math.max(0, state.screenShake - dt * 20);
    state.flashEffect = Math.max(0, state.flashEffect - dt * 3);

    // Cleanup
    entities.projectiles = entities.projectiles.filter(p => p.alive);
    entities.enemies = entities.enemies.filter(e => e.alive);
    entities.particles = entities.particles.filter(p => p.life > 0);

    // UI
    const hpRatio = clamp(player.health / player.maxHealth, 0, 1);
    healthBarEl.style.width = `${hpRatio * 100}%`;
    
    // Low health warning sound
    if (hpRatio < 0.3 && hpRatio > 0) {
      const timeSinceWarning = state.timeSinceStartMs - state.lastLowHealthWarning;
      if (timeSinceWarning > 2000) { // Play warning every 2 seconds when low health
        audio.playLowHealthWarning();
        state.lastLowHealthWarning = state.timeSinceStartMs;
      }
    }
  }

  function draw(dt) {
    // Apply screen shake
    const shakeX = state.screenShake > 0 ? (Math.random() - 0.5) * state.screenShake : 0;
    const shakeY = state.screenShake > 0 ? (Math.random() - 0.5) * state.screenShake : 0;
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
    drawBackground(dt);
    player.draw();
    for (const e of entities.enemies) e.draw();
    for (const p of entities.projectiles) p.draw();
    for (const pa of entities.particles) pa.draw();
    
    ctx.restore();
    
    // Draw flash effect
    if (state.flashEffect > 0) {
      ctx.globalAlpha = state.flashEffect;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
  }

  function frame(ts) {
    const dt = clamp((ts - state.lastFrameTs) / 1000, 0, 0.033);
    state.lastFrameTs = ts;
    update(dt);
    draw(dt);
    if (state.isRunning) requestAnimationFrame(frame);
  }

  function endGame() {
    state.isRunning = false;
    overlayEl.hidden = false;
    finalScoreEl.textContent = `Score: ${state.score}`;
    
    // Play game over sound
    audio.playGameOverSound();
  }

  function startGame() {
    // Play restart sound
    audio.playRestartSound();
    
    // Resume audio context if needed
    audio.resumeAudio();
    
    // Hide home page, show game page
    homePageEl.style.display = 'none';
    gamePageEl.style.display = 'block';
    
    // Initialize game
    restartGame();
  }

  function goToHome() {
    // Stop the game
    state.isRunning = false;
    
    // Hide game page, show home page
    gamePageEl.style.display = 'none';
    homePageEl.style.display = 'flex';
    
    // Reset any visual effects
    state.screenShake = 0;
    state.flashEffect = 0;
  }

  function restartGame() {
    // Play restart sound
    audio.playRestartSound();
    
    // Resume audio context if needed
    audio.resumeAudio();
    
    // reset state
    state.isRunning = true;
    state.score = 0;
    state.wave = 1;
    state.timeSinceStartMs = 0;
    state.lastFrameTs = performance.now();
    state.screenShake = 0;
    state.flashEffect = 0;
    state.lastLowHealthWarning = 0;
    entities.projectiles.length = 0;
    entities.enemies.length = 0;
    entities.particles.length = 0;
    player.health = player.maxHealth;
    player.x = window.innerWidth / 2;
    player.y = window.innerHeight / 2;
    scoreEl.textContent = `Score: ${state.score}`;
    waveEl.textContent = `Wave ${state.wave}`;
    overlayEl.hidden = true;
    requestAnimationFrame(frame);
  }

  // Restart key
  window.addEventListener("keydown", (e) => {
    if (!state.isRunning && (e.key === "r" || e.key === "R")) restartGame();
  });

  // Audio initialization on user interaction
  function initAudioOnInteraction() {
    audio.resumeAudio();
    document.removeEventListener('click', initAudioOnInteraction);
    document.removeEventListener('keydown', initAudioOnInteraction);
  }
  
  document.addEventListener('click', initAudioOnInteraction);
  document.addEventListener('keydown', initAudioOnInteraction);

  // Don't start the game automatically - wait for user to click "Start Game"
})();


