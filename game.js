(() => {
  const WORLD = {
    gravity: 1800,
    speed: 280,
    jumpVelocity: 650
  };

  const gameplayKeys = new Set([" ", "ArrowUp", "ArrowLeft", "ArrowRight", "w", "W", "a", "A", "d", "D"]);
  const SHARED_SPRITES = createSpriteSet();

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
      this.worldWidth = this.level.width || this.canvas.width;
      this.cameraX = 0;

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
        won: false,
        facing: 1
      };
      this.sprites = SHARED_SPRITES;

      this.boundKeyDown = (e) => this.handleKeyDown(e);
      this.boundKeyUp = (e) => this.handleKeyUp(e);

      this.enemies = (this.level.enemies || []).map((enemy) => ({
        ...enemy,
        startX: enemy.x,
        startY: enemy.y,
        direction: 1
      }));
      this.configureEnemyPatrols();
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
      this.player.facing = 1;
      this.hasWon = false;
      this.hasLost = false;
      this.cameraX = 0;
      for (const enemy of this.enemies) {
        enemy.x = enemy.startX;
        enemy.y = enemy.startY;
        enemy.direction = 1;
      }
      this.configureEnemyPatrols();
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
      if (this.player.vx > 0) this.player.facing = 1;
      if (this.player.vx < 0) this.player.facing = -1;
      if (jump && this.player.onGround) {
        this.player.vy = -WORLD.jumpVelocity;
        this.player.onGround = false;
      }

      this.player.vy += WORLD.gravity * dt;
      this.player.x += this.player.vx * dt;

      if (this.player.x < 0) this.player.x = 0;
      if (this.player.x + this.player.w > this.worldWidth) this.player.x = this.worldWidth - this.player.w;

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

      this.updateEnemies(dt);
      for (const enemy of this.enemies) {
        if (overlap(this.player, enemy)) {
          this.player.alive = false;
          this.setStatus("Status: You hit an enemy. Try again.");
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

      const targetCamera = this.player.x + this.player.w / 2 - this.canvas.width / 2;
      this.cameraX = clamp(targetCamera, 0, Math.max(0, this.worldWidth - this.canvas.width));
    }

    draw() {
      const theme = this.theme;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const bgImage = this.themeName === "night" ? this.sprites.backgroundNight : this.sprites.backgroundDay;
      if (isImageReady(bgImage)) {
        ctx.drawImage(bgImage, 0, 0, this.canvas.width, this.canvas.height);
      } else {
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
      }

      const groundRect = { x: 0, y: this.level.floorY, w: this.worldWidth, h: this.canvas.height - this.level.floorY };
      if (!drawWorldTiledImage(ctx, this.sprites.groundTile, groundRect, this.cameraX)) {
        drawRect(ctx, { x: -this.cameraX, y: this.level.floorY, w: this.worldWidth, h: this.canvas.height - this.level.floorY }, theme.ground);
      }

      for (const platform of this.level.platforms) {
        if (!drawWorldTiledImage(ctx, this.sprites.platformTile, platform, this.cameraX)) {
          drawWorldRect(ctx, platform, theme.platform, this.cameraX);
        }
      }

      for (const spike of this.level.spikes) {
        if (isImageReady(this.sprites.spike)) {
          drawWorldImage(ctx, this.sprites.spike, spike, this.cameraX);
        } else {
          drawWorldRect(ctx, spike, theme.spikeBase, this.cameraX);
          ctx.fillStyle = theme.spikeTip;
          ctx.beginPath();
          ctx.moveTo(spike.x - this.cameraX + 5, spike.y + spike.h);
          ctx.lineTo(spike.x - this.cameraX + spike.w / 2, spike.y + 2);
          ctx.lineTo(spike.x - this.cameraX + spike.w - 5, spike.y + spike.h);
          ctx.fill();
        }
      }

      const enemyFrame = Math.floor(performance.now() / 220) % this.sprites.enemySlime.length;
      for (const enemy of this.enemies) {
        const enemyImage = this.sprites.enemySlime[enemyFrame];
        if (isImageReady(enemyImage)) {
          drawWorldImage(ctx, enemyImage, enemy, this.cameraX, { flipX: enemy.direction < 0 });
        } else {
          drawWorldRect(ctx, enemy, "#d26a1f", this.cameraX);
          ctx.fillStyle = "#fff";
          ctx.fillRect(enemy.x - this.cameraX + 7, enemy.y + 8, 5, 5);
          ctx.fillRect(enemy.x - this.cameraX + 18, enemy.y + 8, 5, 5);
        }
      }

      if (isImageReady(this.sprites.goalFlag)) {
        drawWorldImage(ctx, this.sprites.goalFlag, this.level.goal, this.cameraX);
      } else {
        drawWorldRect(ctx, this.level.goal, theme.goal, this.cameraX);
      }

      const playerSprite = this.getPlayerSprite();
      if (isImageReady(playerSprite)) {
        drawWorldImage(ctx, playerSprite, this.player, this.cameraX, { flipX: this.player.facing < 0 });
      } else {
        drawWorldRect(ctx, this.player, this.player.alive ? theme.playerAlive : theme.playerDead, this.cameraX);
        ctx.fillStyle = "#fff";
        ctx.fillRect(this.player.x - this.cameraX + 6, this.player.y + 8, 6, 6);
        ctx.fillRect(this.player.x - this.cameraX + 17, this.player.y + 8, 6, 6);
      }
    }

    updateEnemies(dt) {
      for (const enemy of this.enemies) {
        if (enemy.pattern === "patrol-x") {
          enemy.x += enemy.direction * (enemy.speed || 80) * dt;
          if (enemy.x <= enemy.patrolMinX) {
            enemy.x = enemy.patrolMinX;
            enemy.direction = 1;
          } else if (enemy.x + enemy.w >= enemy.patrolMaxX) {
            enemy.x = enemy.patrolMaxX - enemy.w;
            enemy.direction = -1;
          }
        }
      }
    }

    configureEnemyPatrols() {
      for (const enemy of this.enemies) {
        const support = this.findEnemySupport(enemy);
        const explicitMinX = Number.isFinite(enemy.minX) ? enemy.minX : null;
        const explicitMaxX = Number.isFinite(enemy.maxX) ? enemy.maxX : null;

        let patrolMinX = explicitMinX ?? 0;
        let patrolMaxX = explicitMaxX ?? this.worldWidth;

        if (support) {
          patrolMinX = Math.max(patrolMinX, support.minX);
          patrolMaxX = Math.min(patrolMaxX, support.maxX);
          enemy.y = support.y;
        }

        if (support && support.type === "ground") {
          const limits = this.getGroundSpikeLimits(enemy, patrolMinX, patrolMaxX);
          patrolMinX = limits.minX;
          patrolMaxX = limits.maxX;
        }

        if (patrolMaxX - patrolMinX < enemy.w) {
          patrolMinX = support ? support.minX : Math.max(0, enemy.startX);
          patrolMaxX = support ? support.maxX : Math.min(this.worldWidth, enemy.startX + enemy.w);
          if (patrolMaxX - patrolMinX < enemy.w) {
            patrolMaxX = patrolMinX + enemy.w;
          }
        }

        enemy.patrolMinX = patrolMinX;
        enemy.patrolMaxX = patrolMaxX;
        enemy.x = clamp(enemy.x, enemy.patrolMinX, enemy.patrolMaxX - enemy.w);
      }
    }

    findEnemySupport(enemy) {
      const tolerance = 4;
      const enemyBottom = enemy.y + enemy.h;
      let bestPlatform = null;
      let bestOverlap = 0;

      for (const platform of this.level.platforms) {
        if (Math.abs(enemyBottom - platform.y) > tolerance) continue;
        const overlapWidth =
          Math.min(enemy.x + enemy.w, platform.x + platform.w) - Math.max(enemy.x, platform.x);
        if (overlapWidth > bestOverlap) {
          bestOverlap = overlapWidth;
          bestPlatform = platform;
        }
      }

      if (bestPlatform) {
        return {
          type: "platform",
          minX: bestPlatform.x,
          maxX: bestPlatform.x + bestPlatform.w,
          y: bestPlatform.y - enemy.h
        };
      }

      if (Math.abs(enemyBottom - this.level.floorY) <= tolerance) {
        return {
          type: "ground",
          minX: 0,
          maxX: this.worldWidth,
          y: this.level.floorY - enemy.h
        };
      }

      return null;
    }

    getGroundSpikeLimits(enemy, minX, maxX) {
      let leftLimit = minX;
      let rightLimit = maxX;
      const startLeft = enemy.startX;
      const startRight = enemy.startX + enemy.w;

      for (const spike of this.level.spikes || []) {
        if (spike.y > this.level.floorY) continue;

        if (spike.x + spike.w <= startLeft) {
          leftLimit = Math.max(leftLimit, spike.x + spike.w);
        } else if (spike.x >= startRight) {
          rightLimit = Math.min(rightLimit, spike.x);
        } else {
          leftLimit = Math.max(leftLimit, spike.x + spike.w);
        }
      }

      return { minX: leftLimit, maxX: rightLimit };
    }

    getPlayerSprite() {
      if (!this.player.alive) return this.sprites.playerDead;
      if (!this.player.onGround) return this.sprites.playerJump;
      if (Math.abs(this.player.vx) > 15) {
        const frame = Math.floor(performance.now() / 140) % this.sprites.playerRun.length;
        return this.sprites.playerRun[frame];
      }
      return this.sprites.playerIdle;
    }
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function drawRect(ctx, obj, color) {
    ctx.fillStyle = color;
    ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
  }

  function drawWorldRect(ctx, obj, color, cameraX) {
    ctx.fillStyle = color;
    ctx.fillRect(obj.x - cameraX, obj.y, obj.w, obj.h);
  }

  function drawWorldImage(ctx, image, obj, cameraX, options = {}) {
    const x = obj.x - cameraX;
    if (!options.flipX) {
      ctx.drawImage(image, x, obj.y, obj.w, obj.h);
      return;
    }

    ctx.save();
    ctx.translate(x + obj.w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, obj.y, obj.w, obj.h);
    ctx.restore();
  }

  function drawWorldTiledImage(ctx, image, rect, cameraX) {
    if (!isImageReady(image) || rect.w <= 0 || rect.h <= 0) {
      return false;
    }

    const tileW = image.naturalWidth || image.width || 32;
    const tileH = image.naturalHeight || image.height || 32;
    const startX = Math.floor(rect.x / tileW) * tileW;
    const startY = Math.floor(rect.y / tileH) * tileH;
    const endX = rect.x + rect.w;
    const endY = rect.y + rect.h;

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x - cameraX, rect.y, rect.w, rect.h);
    ctx.clip();

    for (let y = startY; y < endY; y += tileH) {
      for (let x = startX; x < endX; x += tileW) {
        ctx.drawImage(image, x - cameraX, y, tileW, tileH);
      }
    }

    ctx.restore();
    return true;
  }

  function loadImage(src) {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    return image;
  }

  function isImageReady(image) {
    return Boolean(image && image.complete && image.naturalWidth > 0);
  }

  function createSpriteSet() {
    return {
      backgroundDay: loadImage("assets/bg/day-sky.svg"),
      backgroundNight: loadImage("assets/bg/night-sky.svg"),
      groundTile: loadImage("assets/tiles/ground.svg"),
      platformTile: loadImage("assets/tiles/platform.svg"),
      spike: loadImage("assets/hazards/spike.svg"),
      goalFlag: loadImage("assets/props/goal-flag.svg"),
      playerIdle: loadImage("assets/player/player-idle.svg"),
      playerRun: [
        loadImage("assets/player/player-run-1.svg"),
        loadImage("assets/player/player-run-2.svg")
      ],
      playerJump: loadImage("assets/player/player-jump.svg"),
      playerDead: loadImage("assets/player/player-dead.svg"),
      enemySlime: [
        loadImage("assets/enemies/slime-1.svg"),
        loadImage("assets/enemies/slime-2.svg")
      ]
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.PlatformerGameEngine = PlatformerGameEngine;
})();
