const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusLabel = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const themeToggleBtn = document.getElementById("theme-toggle");

const keys = new Set();
const WORLD = {
  gravity: 1800,
  speed: 280,
  jumpVelocity: 650
};

const themeSystem = window.PlatformerThemes || {
  defaultTheme: "day",
  names: ["day"],
  getTheme: () => ({
    skyTop: "#8ad4ff",
    skyBottom: "#ccefff",
    ground: "#53a94a",
    platform: "#6b4f3a",
    spikeBase: "#b23939",
    spikeTip: "#e87070",
    goal: "#2fa34b",
    playerAlive: "#1f2835",
    playerDead: "#666",
    sunColor: "#ffd65c",
    sunGlow: "rgba(255, 214, 92, 0.35)",
    sun: { x: 110, y: 95, r: 42 }
  })
};

const themeState = {
  currentName: themeSystem.defaultTheme,
  current: themeSystem.getTheme(themeSystem.defaultTheme)
};

const level = {
  floorY: 470,
  platforms: [
    { x: 180, y: 400, w: 140, h: 18 },
    { x: 370, y: 330, w: 150, h: 18 },
    { x: 590, y: 260, w: 140, h: 18 },
    { x: 780, y: 340, w: 120, h: 18 }
  ],
  spikes: [
    { x: 320, y: 452, w: 40, h: 18 },
    { x: 540, y: 452, w: 40, h: 18 },
    { x: 745, y: 452, w: 40, h: 18 }
  ],
  goal: { x: 900, y: 290, w: 28, h: 50 }
};

const player = {
  x: 45,
  y: 420,
  w: 28,
  h: 40,
  vx: 0,
  vy: 0,
  onGround: false,
  alive: true,
  won: false
};

function reset() {
  player.x = 45;
  player.y = 420;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.alive = true;
  player.won = false;
  statusLabel.textContent = "Status: Running";
}

function overlap(a, b) {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}

function update(dt) {
  if (!player.alive || player.won) {
    return;
  }

  const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
  const right = keys.has("ArrowRight") || keys.has("d") || keys.has("D");
  const jump = keys.has(" ") || keys.has("ArrowUp") || keys.has("w") || keys.has("W");

  player.vx = (right ? 1 : 0) - (left ? 1 : 0);
  player.vx *= WORLD.speed;

  if (jump && player.onGround) {
    player.vy = -WORLD.jumpVelocity;
    player.onGround = false;
  }

  player.vy += WORLD.gravity * dt;
  player.x += player.vx * dt;

  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

  player.y += player.vy * dt;
  player.onGround = false;

  if (player.y + player.h >= level.floorY) {
    player.y = level.floorY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  for (const p of level.platforms) {
    if (overlap(player, p)) {
      const wasAbove = player.y + player.h - player.vy * dt <= p.y;
      if (wasAbove && player.vy >= 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vx > 0) {
        player.x = p.x - player.w;
      } else if (player.vx < 0) {
        player.x = p.x + p.w;
      }
    }
  }

  for (const s of level.spikes) {
    if (overlap(player, s)) {
      player.alive = false;
      statusLabel.textContent = "Status: You hit spikes. Press Restart.";
      return;
    }
  }

  if (overlap(player, level.goal)) {
    player.won = true;
    statusLabel.textContent = "Status: You win! Press Restart to play again.";
  }
}

function drawRect(obj, color) {
  ctx.fillStyle = color;
  ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
}

function draw() {
  const theme = themeState.current;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sky = ctx.createLinearGradient(0, 0, 0, level.floorY);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, level.floorY);

  // Sun and subtle glow for consistent level atmosphere.
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

  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, level.floorY, canvas.width, canvas.height - level.floorY);

  for (const p of level.platforms) {
    drawRect(p, theme.platform);
  }

  for (const s of level.spikes) {
    drawRect(s, theme.spikeBase);
    ctx.fillStyle = theme.spikeTip;
    ctx.beginPath();
    ctx.moveTo(s.x + 5, s.y + s.h);
    ctx.lineTo(s.x + s.w / 2, s.y + 2);
    ctx.lineTo(s.x + s.w - 5, s.y + s.h);
    ctx.fill();
  }

  drawRect(level.goal, theme.goal);

  drawRect(player, player.alive ? theme.playerAlive : theme.playerDead);
  ctx.fillStyle = "#fff";
  ctx.fillRect(player.x + 6, player.y + 8, 6, 6);
  ctx.fillRect(player.x + 17, player.y + 8, 6, 6);
}

function toTitleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function applyTheme(name) {
  themeState.currentName = name;
  themeState.current = themeSystem.getTheme(name);
  themeToggleBtn.textContent = `Theme: ${toTitleCase(name)}`;
}

function cycleTheme() {
  const names = themeSystem.names || [themeState.currentName];
  const currentIndex = names.indexOf(themeState.currentName);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % names.length : 0;
  applyTheme(names[nextIndex]);
}

let prev = performance.now();
function loop(now) {
  const dt = Math.min((now - prev) / 1000, 0.033);
  prev = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

const gameplayKeys = new Set([" ", "ArrowUp", "ArrowLeft", "ArrowRight", "w", "W", "a", "A", "d", "D"]);

window.addEventListener("keydown", (e) => {
  if (gameplayKeys.has(e.key)) {
    e.preventDefault();
  }
  keys.add(e.key);
});

window.addEventListener("keyup", (e) => {
  if (gameplayKeys.has(e.key)) {
    e.preventDefault();
  }
  keys.delete(e.key);
});
restartBtn.addEventListener("click", reset);
themeToggleBtn.addEventListener("click", cycleTheme);

reset();
applyTheme(themeState.currentName);
requestAnimationFrame(loop);
