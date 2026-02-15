(() => {
  function renderMainMenu(root, options) {
    root.innerHTML = `
      <section class="screen">
        <h2>Main Menu</h2>
        <p class="help">A simple platformer with level progression.</p>
        <div class="actions">
          <button id="start-game" type="button">Start Game</button>
          <button id="open-level-select" type="button">Level Select</button>
          <button id="reset-progress" type="button" class="secondary">Reset Progress</button>
        </div>
      </section>
    `;

    root.querySelector("#start-game").addEventListener("click", options.onStartGame);
    root.querySelector("#open-level-select").addEventListener("click", options.onOpenLevelSelect);
    root.querySelector("#reset-progress").addEventListener("click", options.onResetProgress);
  }

  function renderLevelSelect(root, levels, progressStore, progress, options) {
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

  function renderGameScreen(root, level, themeName, options) {
    root.innerHTML = `
      <section class="screen">
        <h2>${level.name}</h2>
        <p class="help">Move: A / D or Arrow Keys. Jump: W / Space / Arrow Up.</p>
        <canvas id="game" width="960" height="540" aria-label="Platformer game"></canvas>
        <div class="hud">
          <span id="status">Status: Running</span>
          <div class="actions inline">
            <button id="theme-toggle" type="button">Theme: ${toTitleCase(themeName)}</button>
            <button id="restart" type="button" class="secondary">Restart</button>
            <button id="back-levels" type="button" class="secondary">Levels</button>
          </div>
        </div>
      </section>
    `;

    root.querySelector("#restart").addEventListener("click", options.onRestart);
    root.querySelector("#theme-toggle").addEventListener("click", options.onToggleTheme);
    root.querySelector("#back-levels").addEventListener("click", options.onBackToLevels);

    return {
      canvas: root.querySelector("#game"),
      statusLabel: root.querySelector("#status"),
      themeToggleButton: root.querySelector("#theme-toggle")
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
