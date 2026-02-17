(() => {
  function setLayoutMenuMode(root, isMenu) {
    const layout = root.closest(".layout");
    if (!layout) return;
    layout.classList.toggle("menu-active", Boolean(isMenu));
  }

  function renderMainMenu(root, options = {}) {
    setLayoutMenuMode(root, true);
    const debugMode = Boolean(options.debugMode);
    const resetProgressAction = debugMode
      ? `<button id="reset-progress" type="button" class="secondary">Reset Progress</button>`
      : "";

    root.innerHTML = `
      <section class="screen menu-screen">
        <div class="menu-card">
          <p class="menu-kicker">Arcade Platformer</p>
          <h1 class="menu-title">Get Bandages</h1>
          <p class="menu-tagline">Run, jump, and patch your way through every level.</p>
          <div class="actions menu-actions">
            <button id="start-game" type="button">Start Game</button>
            <button id="open-level-select" type="button">Level Select</button>
            ${resetProgressAction}
          </div>
        </div>
      </section>
    `;

    root.querySelector("#start-game").addEventListener("click", options.onStartGame);
    root.querySelector("#open-level-select").addEventListener("click", options.onOpenLevelSelect);
    const resetButton = root.querySelector("#reset-progress");
    if (resetButton) {
      resetButton.addEventListener("click", options.onResetProgress);
    }
  }

  function renderLevelSelect(root, levels, progressStore, progress, options) {
    setLayoutMenuMode(root, false);
    const cards = levels.map((level, index) => {
      const unlocked = progressStore.isUnlocked(progress, index);
      const completed = progressStore.isCompleted(progress, level.id);
      const status = completed ? "Complete" : unlocked ? "Unlocked" : "Locked";
      const disabled = unlocked ? "" : "disabled";
      return `
        <button class="level-card ${completed ? "completed" : ""}" data-index="${index}" ${disabled} type="button">
          <strong>${level.name}</strong>
          <span>${status}</span>
          <small>Theme: ${level.theme}</small>
        </button>
      `;
    }).join("");

    root.innerHTML = `
      <section class="screen">
        <h2>Level Select</h2>
        <p class="help">Complete a level to unlock the next one.</p>
        <div class="level-grid">${cards}</div>
        <div class="actions">
          <button id="back-main" type="button" class="secondary">Back</button>
        </div>
      </section>
    `;

    root.querySelectorAll(".level-card").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        options.onPlayLevel(index);
      });
    });
    root.querySelector("#back-main").addEventListener("click", options.onBack);
  }

  function renderGameScreen(root, level, themeName, options = {}) {
    setLayoutMenuMode(root, false);
    const debugMode = Boolean(options.debugMode);
    const mobileMode = Boolean(options.mobileMode);
    const debugControls = debugMode ? `
      <button id="theme-toggle" type="button">Theme: ${toTitleCase(themeName)}</button>
      <button id="restart" type="button" class="secondary">Restart</button>
    ` : "";
    const mobileControls = mobileMode ? `
      <div class="touch-controls" aria-label="Touch controls">
        <button id="touch-left" type="button" class="touch-button" aria-label="Move left">Left</button>
        <button id="touch-right" type="button" class="touch-button" aria-label="Move right">Right</button>
        <button id="touch-jump" type="button" class="touch-button jump" aria-label="Jump">Jump</button>
      </div>
    ` : "";
    const helpText = mobileMode
      ? "Move with on-screen buttons (or keyboard). Jump with Jump, W, Space, or Arrow Up."
      : "Move: A / D or Arrow Keys. Jump: W / Space / Arrow Up.";

    root.innerHTML = `
      <section class="screen">
        <h2>${level.name}</h2>
        <p class="help">${helpText}</p>
        <div class="game-shell">
          <canvas id="game" width="960" height="540" aria-label="Platformer game"></canvas>
          <section id="outcome-overlay" class="outcome-overlay hidden" aria-live="polite">
            <div class="outcome-card">
              <p id="outcome-kicker" class="outcome-kicker"></p>
              <h3 id="outcome-title" class="outcome-title"></h3>
              <p id="outcome-message" class="outcome-message"></p>
              <div class="actions">
                <button id="outcome-primary" type="button"></button>
                <button id="outcome-secondary" type="button" class="secondary">Level Select</button>
              </div>
            </div>
          </section>
        </div>
        <div class="hud">
          <span id="status">Status: Running</span>
          <div class="actions inline">
            ${debugControls}
            <button id="back-levels" type="button" class="secondary">Levels</button>
          </div>
        </div>
        ${mobileControls}
      </section>
    `;

    const restartButton = root.querySelector("#restart");
    const themeToggleButton = root.querySelector("#theme-toggle");
    if (restartButton) {
      restartButton.addEventListener("click", options.onRestart);
    }
    if (themeToggleButton) {
      themeToggleButton.addEventListener("click", options.onToggleTheme);
    }
    root.querySelector("#back-levels").addEventListener("click", options.onBackToLevels);
    root.querySelector("#outcome-primary").addEventListener("click", () => {
      if (typeof options.onOutcomePrimary === "function") {
        options.onOutcomePrimary();
      }
    });
    root.querySelector("#outcome-secondary").addEventListener("click", options.onBackToLevels);

    return {
      canvas: root.querySelector("#game"),
      statusLabel: root.querySelector("#status"),
      themeToggleButton,
      touchControls: {
        left: root.querySelector("#touch-left"),
        right: root.querySelector("#touch-right"),
        jump: root.querySelector("#touch-jump")
      },
      outcomeOverlay: root.querySelector("#outcome-overlay"),
      outcomeKicker: root.querySelector("#outcome-kicker"),
      outcomeTitle: root.querySelector("#outcome-title"),
      outcomeMessage: root.querySelector("#outcome-message"),
      outcomePrimaryButton: root.querySelector("#outcome-primary")
    };
  }

  function toTitleCase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  window.PlatformerScreens = {
    renderMainMenu,
    renderLevelSelect,
    renderGameScreen,
    toTitleCase
  };
})();
