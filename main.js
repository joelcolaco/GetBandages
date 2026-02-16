(() => {
  const app = document.getElementById("app");
  const levels = window.PlatformerLevels;
  const progressStore = window.PlatformerProgressStore;
  const screens = window.PlatformerScreens;
  const DEBUG_MODE = isDebugModeEnabled();
  let progress = progressStore.load(levels);
  let engine = null;

  function showMainMenu() {
    stopActiveEngine();
    screens.renderMainMenu(app, {
      debugMode: DEBUG_MODE,
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

    let outcomePrimaryAction = null;
    const ui = screens.renderGameScreen(app, level, level.theme, {
      debugMode: DEBUG_MODE,
      onRestart: () => {
        if (!engine) return;
        engine.reset();
        hideOutcome();
      },
      onToggleTheme: () => {
        if (!engine) return;
        const nextTheme = engine.cycleTheme();
        if (ui.themeToggleButton) {
          ui.themeToggleButton.textContent = `Theme: ${screens.toTitleCase(nextTheme)}`;
        }
      },
      onOutcomePrimary: () => {
        if (typeof outcomePrimaryAction === "function") {
          outcomePrimaryAction();
        }
      },
      onBackToLevels: showLevelSelect
    });

    function hideOutcome() {
      ui.outcomeOverlay.classList.add("hidden");
      outcomePrimaryAction = null;
    }

    function showOutcome(config) {
      ui.outcomeKicker.textContent = config.kicker;
      ui.outcomeTitle.textContent = config.title;
      ui.outcomeMessage.textContent = config.message;
      ui.outcomePrimaryButton.textContent = config.primaryLabel;
      outcomePrimaryAction = config.onPrimary;
      ui.outcomeOverlay.classList.remove("hidden");
    }

    engine = new window.PlatformerGameEngine({
      canvas: ui.canvas,
      statusLabel: ui.statusLabel,
      level,
      themeName: level.theme,
      onWin: (levelId) => {
        progress = progressStore.markCompleted(progress, levels, levelId);
        progressStore.save(progress);
        const nextLevel = levels[levelIndex + 1];
        if (nextLevel) {
          showOutcome({
            kicker: "Level Complete",
            title: "Nice run!",
            message: `You unlocked ${nextLevel.name}.`,
            primaryLabel: "Next Level",
            onPrimary: () => showGame(levelIndex + 1)
          });
          return;
        }

        showOutcome({
          kicker: "All Levels Complete",
          title: "You beat the game!",
          message: "No more levels left. Want another run?",
          primaryLabel: "Replay Level",
          onPrimary: () => {
            engine.reset();
            hideOutcome();
          }
        });
      },
      onLose: () => {
        showOutcome({
          kicker: "Level Failed",
          title: "You got spiked.",
          message: "Try again and watch your landing timing.",
          primaryLabel: "Try Again",
          onPrimary: () => {
            engine.reset();
            hideOutcome();
          }
        });
      }
    });

    engine.reset();
    hideOutcome();
    if (ui.themeToggleButton) {
      ui.themeToggleButton.textContent = `Theme: ${screens.toTitleCase(engine.getThemeName())}`;
    }
    engine.start();
  }

  function stopActiveEngine() {
    if (engine) {
      engine.stop();
      engine = null;
    }
  }

  function isDebugModeEnabled() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "1") {
      return true;
    }

    try {
      return localStorage.getItem("platformerDebugMode") === "1";
    } catch (err) {
      return false;
    }
  }

  showMainMenu();
})();
