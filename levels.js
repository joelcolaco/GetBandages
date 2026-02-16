window.PlatformerLevels = [
  {
    id: "level-1",
    name: "Level 1",
    theme: "day",
    width: 1800,
    floorY: 470,
    start: { x: 45, y: 420 },
    platforms: [
      { x: 180, y: 400, w: 140, h: 18 },
      { x: 370, y: 330, w: 150, h: 18 },
      { x: 590, y: 260, w: 140, h: 18 },
      { x: 780, y: 340, w: 120, h: 18 },
      { x: 1000, y: 290, w: 130, h: 18 },
      { x: 1220, y: 240, w: 120, h: 18 },
      { x: 1430, y: 320, w: 140, h: 18 }
    ],
    spikes: [
      { x: 320, y: 452, w: 40, h: 18 },
      { x: 540, y: 452, w: 40, h: 18 },
      { x: 745, y: 452, w: 40, h: 18 },
      { x: 1100, y: 452, w: 40, h: 18 },
      { x: 1365, y: 452, w: 40, h: 18 }
    ],
    enemies: [
      { x: 460, y: 440, w: 30, h: 30, pattern: "patrol-x", minX: 420, maxX: 650, speed: 90 },
      { x: 1260, y: 210, w: 28, h: 28, pattern: "patrol-x", minX: 1220, maxX: 1470, speed: 100 }
    ],
    goal: { x: 1710, y: 270, w: 28, h: 50 }
  },
  {
    id: "level-2",
    name: "Level 2",
    theme: "night",
    width: 2100,
    floorY: 470,
    start: { x: 45, y: 420 },
    platforms: [
      { x: 150, y: 390, w: 120, h: 18 },
      { x: 320, y: 320, w: 120, h: 18 },
      { x: 500, y: 260, w: 120, h: 18 },
      { x: 680, y: 300, w: 130, h: 18 },
      { x: 820, y: 230, w: 100, h: 18 },
      { x: 1030, y: 310, w: 120, h: 18 },
      { x: 1220, y: 250, w: 140, h: 18 },
      { x: 1450, y: 200, w: 130, h: 18 },
      { x: 1680, y: 280, w: 140, h: 18 }
    ],
    spikes: [
      { x: 270, y: 452, w: 45, h: 18 },
      { x: 455, y: 452, w: 45, h: 18 },
      { x: 640, y: 452, w: 45, h: 18 },
      { x: 1160, y: 452, w: 45, h: 18 },
      { x: 1560, y: 452, w: 45, h: 18 }
    ],
    enemies: [
      { x: 715, y: 270, w: 30, h: 30, pattern: "patrol-x", minX: 680, maxX: 830, speed: 110 },
      { x: 1510, y: 170, w: 30, h: 30, pattern: "patrol-x", minX: 1450, maxX: 1700, speed: 120 }
    ],
    goal: { x: 2010, y: 230, w: 24, h: 50 }
  },
  {
    id: "level-3",
    name: "Level 3",
    theme: "day",
    width: 2400,
    floorY: 470,
    start: { x: 45, y: 420 },
    platforms: [
      { x: 120, y: 370, w: 120, h: 18 },
      { x: 280, y: 300, w: 120, h: 18 },
      { x: 450, y: 360, w: 100, h: 18 },
      { x: 600, y: 280, w: 120, h: 18 },
      { x: 780, y: 220, w: 130, h: 18 },
      { x: 980, y: 300, w: 110, h: 18 },
      { x: 1150, y: 240, w: 120, h: 18 },
      { x: 1350, y: 320, w: 120, h: 18 },
      { x: 1550, y: 260, w: 130, h: 18 },
      { x: 1780, y: 210, w: 140, h: 18 },
      { x: 2020, y: 280, w: 120, h: 18 }
    ],
    spikes: [
      { x: 230, y: 452, w: 35, h: 18 },
      { x: 400, y: 452, w: 35, h: 18 },
      { x: 560, y: 452, w: 35, h: 18 },
      { x: 730, y: 452, w: 35, h: 18 },
      { x: 1290, y: 452, w: 35, h: 18 },
      { x: 1700, y: 452, w: 35, h: 18 },
      { x: 2160, y: 452, w: 35, h: 18 }
    ],
    enemies: [
      { x: 1015, y: 270, w: 30, h: 30, pattern: "patrol-x", minX: 980, maxX: 1110, speed: 120 },
      { x: 1835, y: 180, w: 30, h: 30, pattern: "patrol-x", minX: 1780, maxX: 2060, speed: 130 }
    ],
    goal: { x: 2310, y: 230, w: 22, h: 50 }
  }
];
