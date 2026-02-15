(() => {
  const STORAGE_KEY = "miniPlatformerProgressV1";

  function defaultProgress() {
    return {
      completed: {},
      unlockedCount: 1
    };
  }

  function load(levels) {
    const base = defaultProgress();
    const maxLevels = levels.length;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return base;
      }

      const parsed = JSON.parse(raw);
      const unlockedCount = Math.max(1, Math.min(Number(parsed.unlockedCount) || 1, maxLevels));
      const completed = {};
      for (const level of levels) {
        if (parsed.completed && parsed.completed[level.id]) {
          completed[level.id] = true;
        }
      }

      return { completed, unlockedCount };
    } catch (err) {
      return base;
    }
  }

  function save(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function markCompleted(progress, levels, levelId) {
    const next = {
      completed: { ...progress.completed },
      unlockedCount: progress.unlockedCount
    };
    next.completed[levelId] = true;

    const index = levels.findIndex((level) => level.id === levelId);
    if (index >= 0) {
      next.unlockedCount = Math.max(next.unlockedCount, Math.min(index + 2, levels.length));
    }
    return next;
  }

  function isUnlocked(progress, levelIndex) {
    return levelIndex < progress.unlockedCount;
  }

  function isCompleted(progress, levelId) {
    return !!progress.completed[levelId];
  }

  function reset(levels) {
    const base = defaultProgress();
    base.unlockedCount = Math.min(base.unlockedCount, levels.length);
    save(base);
    return base;
  }

  window.PlatformerProgressStore = {
    load,
    save,
    markCompleted,
    isUnlocked,
    isCompleted,
    reset
  };
})();
