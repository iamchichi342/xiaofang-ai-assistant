(() => {
  const scenes = window.AssistantIdleScenes;
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const CM = 37.8;
  const FRAME = {
    horizontal: 4 * CM,
    vertical: 3 * CM,
    flightGap: 1.2 * CM,
    rainbowArc: 0.28 * CM,
  };
  const RAINBOW = {
    squareSize: 32,
    trailWidth: 86,
  };
  const BIRDS = {
    width: 34,
    offsets: [0, 34, 68],
    heights: [0, 8, -6],
  };

  const birdPath = `
    <svg viewBox="0 0 32 20" aria-hidden="true">
      <path d="M2 10C7 3 12 3 16 10C20 3 25 3 30 10"></path>
    </svg>`;

  class IdleSceneManager {
    constructor(assistant) {
      this.assistant = assistant;
      this.layer = null;
      this.current = null;
      this.animationFrame = null;
      this.scheduleTimer = null;
      this.sceneEndTimer = null;
      this.cooldownUntil = 0;
      this.autoMode = false;
      this.lastSceneId = "";
      this.handleIdleChange = this.handleIdleChange.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.animate = this.animate.bind(this);
    }

    mount() {
      this.layer = document.createElement("div");
      this.layer.className = "idle-scene-layer";
      this.layer.setAttribute("aria-hidden", "true");
      document.body.append(this.layer);
      this.assistant.getElement().addEventListener(
        "assistant:idle-change",
        this.handleIdleChange,
      );
      window.addEventListener("pointermove", this.handlePointerMove, {
        passive: true,
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) this.stop();
      });
    }

    preview(id) {
      if (!scenes[id]) return;
      this.clearSchedule();
      this.start(id, true);
    }

    stop() {
      this.clearSchedule();
      window.cancelAnimationFrame(this.animationFrame);
      window.clearTimeout(this.sceneEndTimer);
      this.animationFrame = null;
      this.sceneEndTimer = null;
      this.current = null;
      this.layer?.replaceChildren();
      this.assistant.setIdleSceneActive(false);
      this.assistant.clearGazeTarget();
      this.assistant.setExpression("neutral", { duration: 0 });
      if (this.autoMode) this.scheduleNext();
    }

    handleIdleChange(event) {
      const active = Boolean(event.detail?.active);
      this.autoMode = active;
      if (!active) {
        this.stop();
        return;
      }
      this.scheduleNext(2600);
    }

    handlePointerMove(event) {
      if (event.target?.closest?.("#idle-scene-controls")) return;
      if (this.current) this.stop();
    }

    scheduleNext(delay = 9000 + Math.random() * 11000) {
      this.clearSchedule();
      if (!this.autoMode || reducedMotionQuery.matches) return;
      const wait = Math.max(delay, this.cooldownUntil - performance.now());
      this.scheduleTimer = window.setTimeout(() => {
        this.start(this.pickScene(), false);
      }, wait);
    }

    clearSchedule() {
      window.clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }

    pickScene() {
      const ids = Object.keys(scenes).filter((id) => id !== this.lastSceneId);
      return ids[Math.floor(Math.random() * ids.length)] ?? "rainbow-square";
    }

    start(id, preview) {
      const definition = scenes[id];
      if (!definition) return;
      window.cancelAnimationFrame(this.animationFrame);
      window.clearTimeout(this.sceneEndTimer);
      this.layer.replaceChildren();
      this.lastSceneId = id;
      this.current = {
        id,
        definition,
        startedAt: performance.now(),
        preview,
        direction: Math.random() > 0.5 ? 1 : -1,
        element: this.createScene(id),
      };
      this.layer.append(this.current.element);
      this.assistant.setIdleSceneActive(true);
      this.assistant.setExpression(definition.introExpression, {
        duration: 650,
      });
      this.sceneEndTimer = window.setTimeout(() => this.finish(), definition.duration);
      this.animationFrame = window.requestAnimationFrame(this.animate);
    }

    createScene(id) {
      const element = document.createElement("div");
      element.className = `idle-scene idle-scene--${id}`;

      if (id === "rainbow-square") {
        element.innerHTML = `
          <div class="idle-rainbow-flight">
            <div class="idle-rainbow-trail"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <div class="idle-rainbow-square"><span></span><span></span></div>
          </div>`;
      }

      if (id === "bird-formation") {
        element.innerHTML = `
          <div class="idle-bird idle-bird--one">${birdPath}</div>
          <div class="idle-bird idle-bird--two">${birdPath}</div>
          <div class="idle-bird idle-bird--three">${birdPath}</div>`;
      }

      return element;
    }

    animate(now) {
      if (!this.current) return;
      const elapsed = now - this.current.startedAt;
      const progress = Math.min(elapsed / this.current.definition.duration, 1);
      const target = this.updateScene(this.current, progress);
      if (target) this.assistant.setGazeTarget(target);
      if (progress < 1) this.animationFrame = window.requestAnimationFrame(this.animate);
    }

    updateScene(scene, progress) {
      const direction = scene.direction;
      const ease = progress * progress * (3 - 2 * progress);
      const rect = this.assistant.getElement().getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const viewportLeft = centerX - FRAME.horizontal;
      const viewportTop = centerY - FRAME.vertical;
      const viewportWidth = FRAME.horizontal * 2;
      const viewportHeight = FRAME.vertical * 2;
      const flightY = Math.max(
        centerY - FRAME.vertical,
        centerY - rect.height / 2 - FRAME.flightGap,
      );
      const localFlightY = flightY - viewportTop;

      scene.element.style.left = `${viewportLeft}px`;
      scene.element.style.top = `${viewportTop}px`;
      scene.element.style.width = `${viewportWidth}px`;
      scene.element.style.height = `${viewportHeight}px`;
      scene.element.dataset.direction = String(direction);

      if (scene.id === "rainbow-square") {
        const totalWidth = RAINBOW.trailWidth + RAINBOW.squareSize;
        const startX = direction === 1 ? -totalWidth : viewportWidth;
        const endX = direction === 1 ? viewportWidth : -totalWidth;
        const x = startX + (endX - startX) * ease;
        const y = localFlightY - Math.sin(progress * Math.PI) * FRAME.rainbowArc;
        const flight = scene.element.querySelector(".idle-rainbow-flight");
        flight.style.transform = `translate3d(${x}px, ${y}px, 0)`;

        return {
          x: viewportLeft + x + totalWidth / 2,
          y: viewportTop + y + RAINBOW.squareSize / 2,
        };
      }

      if (scene.id === "bird-formation") {
        const formationWidth =
          BIRDS.offsets[BIRDS.offsets.length - 1] + BIRDS.width;
        const startX = direction === 1 ? -BIRDS.width : viewportWidth;
        const endX =
          direction === 1
            ? viewportWidth + BIRDS.offsets[BIRDS.offsets.length - 1]
            : -formationWidth;
        const baseX = startX + (endX - startX) * ease;
        const baseY = localFlightY + Math.sin(progress * Math.PI * 2.3) * 6;
        const birds = [...scene.element.querySelectorAll(".idle-bird")];
        birds.forEach((bird, index) => {
          const x = baseX - direction * BIRDS.offsets[index];
          const y = baseY + BIRDS.heights[index];
          bird.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
        const centerOffset =
          BIRDS.offsets.reduce((total, offset) => total + offset, 0) /
          BIRDS.offsets.length;
        const centerHeight =
          BIRDS.heights.reduce((total, height) => total + height, 0) /
          BIRDS.heights.length;
        return {
          x: viewportLeft + baseX - direction * centerOffset + BIRDS.width / 2,
          y: viewportTop + baseY + centerHeight + 11,
        };
      }

      return null;
    }

    finish() {
      if (!this.current) return;
      const definition = this.current.definition;
      this.assistant.setExpression(definition.outroExpression, {
        duration: 1500,
      });
      this.cooldownUntil = performance.now() + 15000;
      window.setTimeout(() => {
        if (!this.current) return;
        this.current = null;
        this.layer.replaceChildren();
        this.assistant.setIdleSceneActive(false);
        this.assistant.clearGazeTarget();
        if (this.autoMode) this.scheduleNext();
      }, 850);
    }
  }

  window.AssistantIdleSceneManager = IdleSceneManager;
})();
