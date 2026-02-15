(() => {
  const app = document.getElementById("app");
  const levels = window.PlatformerLevels;
  const progressStore = window.PlatformerProgressStore;
  const screens = window.PlatformerScreens;
  let progress = progressStore.load(levels);
  let engine = null;

  function showMainMenu() {
    stopActiveEngine();
    screens.renderMainMenu(app, {
      onStartGame: () => {
        const firstPlayable = levels.findIndex((_, index) => progressStore.isUnlocked(progress, index));
        showGame(firstPlayable >= 0 ? firstPlayable : 0);
      },
      onOpenLevelSelect: showLevelSelect,
      onResetProgress: () => {
        progress = progressStore.reset(levels);
        showMainMenu();
      }
    });
  }

  function showLevelSelect() {
    stopActiveEngine();
    screens.renderLevelSelect(app, levels, progressStore, progress, {
      onBack: showMainMenu,
      onPlayLevel: (index) => {
        if (progressStore.isUnlocked(progress, index)) {
          showGame(index);
        }
      }
    });
  }

  function showGame(levelIndex) {
    stopActiveEngine();
    const level = levels[levelIndex];
    if (!level) {
      showLevelSelect();
      return;
    }

    const ui = screens.renderGameScreen(app, level, level.theme, {
      onRestart: () => engine && engine.reset(),
      onToggleTheme: () => {
        if (!engine) return;
        const nextTheme = engine.cycleTheme();
        ui.themeToggleButton.textContent = `Theme: ${screens.toTitleCase(nextTheme)}`;
      },
      onBackToLevels: showLevelSelect
    });

    engine = new window.PlatformerGameEngine({
      canvas: ui.canvas,
      statusLabel: ui.statusLabel,
      level,
      themeName: level.theme,
      onWin: (levelId) => {
        progress = progressStore.markCompleted(progress, levels, levelId);
        progressStore.save(progress);
      }
    });

    engine.reset();
    ui.themeToggleButton.textContent = `Theme: ${screens.toTitleCase(engine.getThemeName())}`;
    engine.start();
  }

  function stopActiveEngine() {
    if (engine) {
      engine.stop();
      engine = null;
    }
  }

  showMainMenu();
})();
