const BASE_THEME = {
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
};

const THEMES = {
  day: {},
  night: {
    skyTop: "#0f1a34",
    skyBottom: "#2b3e66",
    ground: "#3e6d42",
    platform: "#5a4635",
    spikeBase: "#8e2f4f",
    spikeTip: "#d66a8a",
    goal: "#6fca6f",
    playerAlive: "#d8e2f0",
    playerDead: "#8f98a6",
    sunColor: "#f2f6ff",
    sunGlow: "rgba(223, 235, 255, 0.28)"
  }
};

function getTheme(name = "day") {
  const override = THEMES[name] || THEMES.day || {};
  return {
    ...BASE_THEME,
    ...override,
    sun: {
      ...BASE_THEME.sun,
      ...(override.sun || {})
    }
  };
}

window.PlatformerThemes = {
  defaultTheme: "day",
  names: Object.keys(THEMES),
  getTheme
};
