(() => {
  const app = document.getElementById("app");
  const levels = window.PlatformerLevels;
  const progressStore = window.PlatformerProgressStore;
  const screens = window.PlatformerScreens;
  const DEBUG_MODE = isDebugModeEnabled();
  const TOUCH_MODE_STORAGE_KEY = "platformerTouchControlsEnabled";
  let progress = progressStore.load(levels);
  let engine = null;
  let touchControlsEnabled = loadTouchControlsPreference();

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
      touchEnabled: touchControlsEnabled,
      onRestart: () => {
        if (!engine) return;
        engine.reset();
        hideOutcome();
      },
      onToggleControlsMode: () => {
        touchControlsEnabled = !touchControlsEnabled;
        saveTouchControlsPreference(touchControlsEnabled);
        applyTouchControlsMode(ui, engine, touchControlsEnabled);
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
    bindMobileControls(ui, engine);
    applyTouchControlsMode(ui, engine, touchControlsEnabled);
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

  function shouldAutoEnableTouchControls() {
    const coarsePointer = window.matchMedia ? window.matchMedia("(pointer: coarse)").matches : false;
    const smallViewport = window.innerWidth <= 900;
    const touchCapable = navigator.maxTouchPoints > 0;
    return coarsePointer || (touchCapable && smallViewport);
  }

  function loadTouchControlsPreference() {
    try {
      const stored = localStorage.getItem(TOUCH_MODE_STORAGE_KEY);
      if (stored === "1") return true;
      if (stored === "0") return false;
    } catch (err) {
      // ignore and fall back to auto detection
    }
    return shouldAutoEnableTouchControls();
  }

  function saveTouchControlsPreference(enabled) {
    try {
      localStorage.setItem(TOUCH_MODE_STORAGE_KEY, enabled ? "1" : "0");
    } catch (err) {
      // ignore storage errors
    }
  }

  function applyTouchControlsMode(ui, activeEngine, enabled) {
    if (!ui) return;
    if (ui.touchControlsRoot) {
      ui.touchControlsRoot.classList.toggle("touch-controls-hidden", !enabled);
    }
    if (ui.controlsModeToggleButton) {
      ui.controlsModeToggleButton.textContent = enabled ? "Controls: Touch" : "Controls: Keyboard";
    }
    if (ui.helpLabel) {
      ui.helpLabel.textContent = enabled
        ? "Move with on-screen buttons (or keyboard). Jump with Jump, W, Space, or Arrow Up."
        : "Move: A / D or Arrow Keys. Jump: W / Space / Arrow Up.";
    }
    if (!enabled && activeEngine) {
      activeEngine.clearVirtualInput();
    }
  }

  function bindMobileControls(ui, activeEngine) {
    if (!ui.touchControls || !activeEngine) {
      return;
    }

    const buttonByControl = {
      left: ui.touchControls.left,
      right: ui.touchControls.right,
      jump: ui.touchControls.jump
    };

    const bindControl = (controlName) => {
      const button = buttonByControl[controlName];
      if (!button) {
        return;
      }

      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        if (button.setPointerCapture) {
          button.setPointerCapture(event.pointerId);
        }
        activeEngine.setVirtualInput(controlName, true);
        button.classList.add("pressed");
      });

      const release = (event) => {
        event.preventDefault();
        if (button.releasePointerCapture && button.hasPointerCapture && button.hasPointerCapture(event.pointerId)) {
          button.releasePointerCapture(event.pointerId);
        }
        activeEngine.setVirtualInput(controlName, false);
        button.classList.remove("pressed");
      };

      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    };

    bindControl("left");
    bindControl("right");
    bindControl("jump");
  }

  showMainMenu();
})();
