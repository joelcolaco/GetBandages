(() => {
  const WORLD = {
    gravity: 1800,
    speed: 280,
    jumpVelocity: 650
  };

  const gameplayKeys = new Set([" ", "ArrowUp", "ArrowLeft", "ArrowRight", "w", "W", "a", "A", "d", "D"]);

  class PlatformerGameEngine {
    constructor(options) {
      this.canvas = options.canvas;
      this.ctx = this.canvas.getContext("2d");
      this.statusLabel = options.statusLabel;
      this.onWin = options.onWin || (() => {});
      this.onLose = options.onLose || (() => {});

      this.themeSystem = window.PlatformerThemes;
      this.level = options.level;
      this.themeName = options.themeName || options.level.theme || this.themeSystem.defaultTheme;
      this.theme = this.themeSystem.getTheme(this.themeName);

      this.keys = new Set();
      this.running = false;
      this.hasWon = false;
      this.hasLost = false;
      this.prev = 0;
      this.frameHandle = 0;

      this.player = {
        x: this.level.start.x,
        y: this.level.start.y,
        w: 28,
        h: 40,
        vx: 0,
        vy: 0,
        onGround: false,
        alive: true,
        won: false
      };

      this.boundKeyDown = (e) => this.handleKeyDown(e);
      this.boundKeyUp = (e) => this.handleKeyUp(e);
    }

    start() {
      if (this.running) {
        return;
      }
      this.running = true;
      window.addEventListener("keydown", this.boundKeyDown);
      window.addEventListener("keyup", this.boundKeyUp);
      this.prev = performance.now();
      this.frameHandle = requestAnimationFrame((now) => this.loop(now));
    }

    stop() {
      this.running = false;
      cancelAnimationFrame(this.frameHandle);
      window.removeEventListener("keydown", this.boundKeyDown);
      window.removeEventListener("keyup", this.boundKeyUp);
      this.keys.clear();
    }

    reset() {
      this.player.x = this.level.start.x;
      this.player.y = this.level.start.y;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.onGround = false;
      this.player.alive = true;
      this.player.won = false;
      this.hasWon = false;
      this.hasLost = false;
      this.setStatus("Status: Running");
    }

    setTheme(name) {
      this.themeName = name;
      this.theme = this.themeSystem.getTheme(name);
    }

    cycleTheme() {
      const names = this.themeSystem.names || [this.themeName];
      const idx = names.indexOf(this.themeName);
      const nextIdx = idx >= 0 ? (idx + 1) % names.length : 0;
      this.setTheme(names[nextIdx]);
      return this.themeName;
    }

    getThemeName() {
      return this.themeName;
    }

    setStatus(text) {
      if (this.statusLabel) {
        this.statusLabel.textContent = text;
      }
    }

    handleKeyDown(e) {
      if (gameplayKeys.has(e.key)) {
        e.preventDefault();
      }
      this.keys.add(e.key);
    }

    handleKeyUp(e) {
      if (gameplayKeys.has(e.key)) {
        e.preventDefault();
      }
      this.keys.delete(e.key);
    }

    loop(now) {
      if (!this.running) {
        return;
      }
      const dt = Math.min((now - this.prev) / 1000, 0.033);
      this.prev = now;
      this.update(dt);
      this.draw();
      this.frameHandle = requestAnimationFrame((nextNow) => this.loop(nextNow));
    }

    update(dt) {
      if (!this.player.alive || this.player.won) {
        return;
      }

      const left = this.keys.has("ArrowLeft") || this.keys.has("a") || this.keys.has("A");
      const right = this.keys.has("ArrowRight") || this.keys.has("d") || this.keys.has("D");
      const jump = this.keys.has(" ") || this.keys.has("ArrowUp") || this.keys.has("w") || this.keys.has("W");

      this.player.vx = ((right ? 1 : 0) - (left ? 1 : 0)) * WORLD.speed;
      if (jump && this.player.onGround) {
        this.player.vy = -WORLD.jumpVelocity;
        this.player.onGround = false;
      }

      this.player.vy += WORLD.gravity * dt;
      this.player.x += this.player.vx * dt;

      if (this.player.x < 0) this.player.x = 0;
      if (this.player.x + this.player.w > this.canvas.width) this.player.x = this.canvas.width - this.player.w;

      this.player.y += this.player.vy * dt;
      this.player.onGround = false;

      if (this.player.y + this.player.h >= this.level.floorY) {
        this.player.y = this.level.floorY - this.player.h;
        this.player.vy = 0;
        this.player.onGround = true;
      }

      for (const p of this.level.platforms) {
        if (!overlap(this.player, p)) continue;
        const wasAbove = this.player.y + this.player.h - this.player.vy * dt <= p.y;
        if (wasAbove && this.player.vy >= 0) {
          this.player.y = p.y - this.player.h;
          this.player.vy = 0;
          this.player.onGround = true;
        } else if (this.player.vx > 0) {
          this.player.x = p.x - this.player.w;
        } else if (this.player.vx < 0) {
          this.player.x = p.x + p.w;
        }
      }

      for (const s of this.level.spikes) {
        if (overlap(this.player, s)) {
          this.player.alive = false;
          this.setStatus("Status: You hit spikes. Press Restart.");
          if (!this.hasLost) {
            this.hasLost = true;
            this.onLose(this.level.id);
          }
          return;
        }
      }

      if (overlap(this.player, this.level.goal)) {
        this.player.won = true;
        this.setStatus("Status: Level complete! Return to Levels.");
        if (!this.hasWon) {
          this.hasWon = true;
          this.onWin(this.level.id);
        }
      }
    }

    draw() {
      const theme = this.theme;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const sky = ctx.createLinearGradient(0, 0, 0, this.level.floorY);
      sky.addColorStop(0, theme.skyTop);
      sky.addColorStop(1, theme.skyBottom);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, this.canvas.width, this.level.floorY);

      const { x, y, r } = theme.sun;
      const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2);
      glow.addColorStop(0, theme.sunGlow);
      glow.addColorStop(1, "rgba(255, 214, 92, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = theme.sunColor;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      drawRect(ctx, { x: 0, y: this.level.floorY, w: this.canvas.width, h: this.canvas.height - this.level.floorY }, theme.ground);

      for (const platform of this.level.platforms) {
        drawRect(ctx, platform, theme.platform);
      }

      for (const spike of this.level.spikes) {
        drawRect(ctx, spike, theme.spikeBase);
        ctx.fillStyle = theme.spikeTip;
        ctx.beginPath();
        ctx.moveTo(spike.x + 5, spike.y + spike.h);
        ctx.lineTo(spike.x + spike.w / 2, spike.y + 2);
        ctx.lineTo(spike.x + spike.w - 5, spike.y + spike.h);
        ctx.fill();
      }

      drawRect(ctx, this.level.goal, theme.goal);
      drawRect(ctx, this.player, this.player.alive ? theme.playerAlive : theme.playerDead);
      ctx.fillStyle = "#fff";
      ctx.fillRect(this.player.x + 6, this.player.y + 8, 6, 6);
      ctx.fillRect(this.player.x + 17, this.player.y + 8, 6, 6);
    }
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function drawRect(ctx, obj, color) {
    ctx.fillStyle = color;
    ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  }

  window.PlatformerGameEngine = PlatformerGameEngine;
})();
