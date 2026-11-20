(() => {
const { createAssistantState } = window.AssistantState;
const { clamp, distanceBetween, lerp, smoothstep } = window.AssistantMath;

const EDGE_GAP = 18;
const STORAGE_KEY = "screen-assistant-position-v1";
const IDLE_EXPRESSIONS = ["curious", "sleepy", "joy", "surprise"];
const AUTO_IDLE_DELAY = 60 * 1000;
const MANUAL_IDLE_DURATION = 5 * 60 * 1000;

class ScreenAssistant {
  constructor(root, options = {}) {
    this.root = root;
    this.options = {
      size: options.size ?? 112,
      initialSide: options.initialSide ?? "right",
      messages: options.messages ?? [
        "我在看这里。",
        "拖动我可以换个位置。",
        "需要时，我会一直在屏幕边缘。",
      ],
    };
    this.expressions = window.AssistantExpressions;
    this.state = createAssistantState();
    this.messageIndex = 0;
    this.animationFrame = null;
    this.blinkTimer = null;
    this.idleActionTimer = null;
    this.manualIdleTimer = null;
    this.expressionTimer = null;
    this.actionTimer = null;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.handleGlobalPointerMove = this.handleGlobalPointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.animate = this.animate.bind(this);
  }

  mount() {
    this.render();
    this.element = this.root.querySelector(".screen-assistant");
    this.button = this.root.querySelector(".screen-assistant__hit-area");
    this.bubble = this.root.querySelector(".screen-assistant__bubble");

    this.restoreOrSetInitialPosition();
    this.bindEvents();
    this.setExpression("neutral");
    this.scheduleBlink();
    this.animationFrame = requestAnimationFrame(this.animate);
    requestAnimationFrame(() => this.handleResize());
  }

  render() {
    this.root.innerHTML = `
      <aside class="screen-assistant" aria-label="屏幕机器人助手">
        <div class="screen-assistant__bubble" role="status" aria-live="polite"></div>
        <button
          class="screen-assistant__hit-area"
          type="button"
          aria-label="机器人助手，可拖动或点击"
        >
          <span class="screen-assistant__face" aria-hidden="true">
            <span class="screen-assistant__eyes">
              <span class="screen-assistant__eye screen-assistant__eye--left">
                <span class="screen-assistant__eye-shape">
                  <svg class="screen-assistant__eye-arc" viewBox="0 0 24 14">
                    <path d="M 2.5 10.5 C 6.5 4 17.5 4 21.5 10.5"></path>
                  </svg>
                </span>
              </span>
              <span class="screen-assistant__eye screen-assistant__eye--right">
                <span class="screen-assistant__eye-shape">
                  <svg class="screen-assistant__eye-arc" viewBox="0 0 24 14">
                    <path d="M 2.5 10.5 C 6.5 4 17.5 4 21.5 10.5"></path>
                  </svg>
                </span>
              </span>
            </span>
            <span class="screen-assistant__shine"></span>
          </span>
        </button>
      </aside>
    `;
  }

  bindEvents() {
    window.addEventListener("pointermove", this.handleGlobalPointerMove, {
      passive: true,
    });
    this.button.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointermove", this.handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointercancel", this.handlePointerUp);
    window.addEventListener("resize", this.handleResize);
    window.visualViewport?.addEventListener("resize", this.handleResize);
    this.button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.element.dispatchEvent(new CustomEvent("assistant:menu-request"));
      }
    });
  }

  restoreOrSetInitialPosition() {
    const size = this.getSize();
    let storedPosition = null;

    try {
      storedPosition = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      storedPosition = null;
    }

    if (
      storedPosition &&
      Number.isFinite(storedPosition.x) &&
      Number.isFinite(storedPosition.y)
    ) {
      this.state.position.x = storedPosition.x;
      this.state.position.y = storedPosition.y;
    } else {
      this.state.position.x =
        this.options.initialSide === "left"
          ? EDGE_GAP
          : window.innerWidth - size - 34;
      this.state.position.y = window.innerHeight - size - 34;
    }

    this.constrainPosition();
    this.renderPosition();
  }

  handleGlobalPointerMove(event) {
    this.state.pointer.x = event.clientX;
    this.state.pointer.y = event.clientY;
    this.state.pointer.hasMoved = true;
    this.state.interaction.lastPointerMoveAt = performance.now();
  }

  setManualIdle(active, duration = MANUAL_IDLE_DURATION) {
    window.clearTimeout(this.manualIdleTimer);
    this.state.idle.manual = active;
    this.state.idle.manualUntil = active ? performance.now() + duration : 0;

    if (active) {
      this.manualIdleTimer = window.setTimeout(() => {
        this.setManualIdle(false);
      }, duration);
    } else {
      this.state.interaction.lastPointerMoveAt = performance.now();
    }

    this.updateIdleMode(performance.now(), true);
  }

  toggleManualIdle(duration = MANUAL_IDLE_DURATION) {
    this.setManualIdle(!this.state.idle.manual, duration);
  }

  updateIdleMode(now, force = false) {
    const automatic =
      !this.state.idle.manual &&
      now - this.state.interaction.lastPointerMoveAt >= AUTO_IDLE_DELAY;
    const changed =
      force ||
      automatic !== this.state.idle.automatic ||
      this.element.dataset.idle === undefined;

    this.state.idle.automatic = automatic;
    if (!changed) return;

    const mode = this.state.idle.manual
      ? "manual"
      : automatic
        ? "automatic"
        : "false";
    this.element.dataset.idle = mode;
    this.element.dispatchEvent(
      new CustomEvent("assistant:idle-change", {
        detail: {
          active: this.state.idle.manual || automatic,
          manual: this.state.idle.manual,
          mode,
        },
      }),
    );
  }

  handlePointerDown(event) {
    if (event.button !== 0) return;

    const rect = this.element.getBoundingClientRect();
    this.state.drag.active = true;
    this.state.drag.pointerId = event.pointerId;
    this.state.drag.offsetX = event.clientX - rect.left;
    this.state.drag.offsetY = event.clientY - rect.top;
    this.state.drag.distance = 0;
    this.state.drag.lastX = event.clientX;
    this.state.drag.lastY = event.clientY;
    this.state.interaction.pressed = true;
    this.element.dataset.dragging = "true";
    this.button.setPointerCapture?.(event.pointerId);
  }

  handlePointerMove(event) {
    if (
      !this.state.drag.active ||
      event.pointerId !== this.state.drag.pointerId
    ) {
      return;
    }

    event.preventDefault();
    this.state.drag.distance += distanceBetween(
      this.state.drag.lastX,
      this.state.drag.lastY,
      event.clientX,
      event.clientY,
    );
    this.state.drag.lastX = event.clientX;
    this.state.drag.lastY = event.clientY;
    this.state.position.x = event.clientX - this.state.drag.offsetX;
    this.state.position.y = event.clientY - this.state.drag.offsetY;
    this.constrainPosition();
    this.renderPosition();
  }

  handlePointerUp(event) {
    if (
      !this.state.drag.active ||
      event.pointerId !== this.state.drag.pointerId
    ) {
      return;
    }

    const wasClick = this.state.drag.distance < 8;
    this.state.drag.active = false;
    this.state.drag.pointerId = null;
    this.state.interaction.pressed = false;
    this.element.dataset.dragging = "false";
    this.button.releasePointerCapture?.(event.pointerId);
    this.savePosition();

    if (wasClick) {
      this.respond();
    }
  }

  handleResize() {
    this.constrainPosition();
    this.renderPosition();
  }

  respond() {
    const message = this.options.messages[this.messageIndex];
    const responseExpressions = ["joy", "curious", "surprise"];
    const expression = responseExpressions[this.messageIndex];
    this.messageIndex = (this.messageIndex + 1) % this.options.messages.length;
    this.showMessage(message);
    this.setExpression(expression);
  }

  showMessage(message) {
    this.bubble.textContent = message;
    this.state.interaction.speaking = true;
    this.element.dataset.speaking = "true";

    window.clearTimeout(this.state.interaction.bubbleTimer);
    this.state.interaction.bubbleTimer = window.setTimeout(() => {
      this.state.interaction.speaking = false;
      this.element.dataset.speaking = "false";
    }, 2200);
  }

  setExpression(name, options = {}) {
    const expression = this.expressions[name] ?? this.expressions.neutral;
    const resolvedName = this.expressions[name] ? name : "neutral";
    const { announce = false, duration = expression.duration } = options;

    window.clearTimeout(this.expressionTimer);
    this.state.expression.name = resolvedName;
    this.state.expression.headRoll = expression.head?.roll ?? 0;
    this.state.expression.headPitch = expression.head?.pitch ?? 0;
    this.element.dataset.expression = resolvedName;
    this.applyEyeExpression(expression.eye);

    if (expression.action) {
      this.playAction(expression.action);
    } else {
      window.clearTimeout(this.actionTimer);
      this.element.dataset.action = "";
    }

    if (announce) {
      this.showMessage(`${expression.label}：${expression.description}`);
    }

    if (resolvedName !== "neutral" && duration > 0) {
      this.expressionTimer = window.setTimeout(() => {
        this.setExpression("neutral");
      }, duration);
    }

    this.scheduleIdleAction();
  }

  applyEyeExpression(eyeDefinition) {
    ["left", "right"].forEach((side) => {
      const eye = eyeDefinition?.[side] ?? this.expressions.neutral.eye[side];
      this.element.style.setProperty(`--${side}-eye-x`, `${eye.x ?? 0}px`);
      this.element.style.setProperty(`--${side}-eye-y`, `${eye.y ?? 0}px`);
      this.element.style.setProperty(
        `--${side}-eye-scale-x`,
        String(eye.scaleX ?? 1),
      );
      this.element.style.setProperty(
        `--${side}-eye-scale-y`,
        String(eye.scaleY ?? 1),
      );
      this.element.style.setProperty(
        `--${side}-eye-rotate`,
        `${eye.rotate ?? 0}deg`,
      );
    });
  }

  playAction(name) {
    if (!name || this.reducedMotion.matches) return;

    window.clearTimeout(this.actionTimer);
    this.element.dataset.action = "";
    void this.button.offsetWidth;
    this.element.dataset.action = name;
    this.actionTimer = window.setTimeout(() => {
      this.element.dataset.action = "";
    }, name === "celebrate" ? 1500 : 1450);
  }

  scheduleIdleAction() {
    window.clearTimeout(this.idleActionTimer);
    if (this.reducedMotion.matches) return;

    const delay = 7000 + Math.random() * 7000;
    this.idleActionTimer = window.setTimeout(() => {
      const idleFor = performance.now() - this.state.interaction.lastPointerMoveAt;
      if (
        idleFor > 4200 &&
        !this.state.drag.active &&
        this.state.expression.name === "neutral"
      ) {
        const next =
          IDLE_EXPRESSIONS[Math.floor(Math.random() * IDLE_EXPRESSIONS.length)];
        this.setExpression(next);
        return;
      }
      this.scheduleIdleAction();
    }, delay);
  }

  scheduleBlink() {
    window.clearTimeout(this.blinkTimer);
    const delay = 2200 + Math.random() * 4200;
    this.blinkTimer = window.setTimeout(() => this.blink(), delay);
  }

  blink() {
    if (this.reducedMotion.matches || this.state.drag.active) {
      this.scheduleBlink();
      return;
    }

    this.state.motion.eyeScaleY = 0.04;
    window.setTimeout(() => {
      this.state.motion.eyeScaleY = 1;
      this.scheduleBlink();
    }, 105);
  }

  animate(now) {
    this.updateIdleMode(now);
    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const gazeX = this.state.gaze.active
      ? this.state.gaze.x
      : this.state.pointer.x;
    const gazeY = this.state.gaze.active
      ? this.state.gaze.y
      : this.state.pointer.y;
    const dx = gazeX - centerX;
    const dy = gazeY - centerY;
    const distance = Math.hypot(dx, dy);
    const length = distance || 1;
    const directionX = dx / length;
    const directionY = dy / length;

    const eyeRadius = rect.width * 1.25;
    const headStartRadius = rect.width * 0.95;
    const farRadius = rect.width * 3.2;
    const eyeProgress = clamp(distance / eyeRadius, 0, 1);

    let headProgress =
      (distance - headStartRadius) / (farRadius - headStartRadius);
    headProgress = smoothstep(headProgress);

    const gazeLead = 1 - headProgress * 0.28;
    let targetEyeX =
      directionX * rect.width * 0.14 * eyeProgress * gazeLead;
    let targetEyeY =
      directionY * rect.height * 0.09 * eyeProgress * gazeLead;

    let targetYaw = directionX * 15 * headProgress;
    let targetPitch =
      -directionY * 8 * headProgress + this.state.expression.headPitch;
    let targetRoll = this.state.expression.headRoll;
    let targetFaceShiftX = directionX * rect.width * 0.055 * headProgress;
    let targetFaceScaleX = 1 - headProgress * 0.085;

    if (
      !this.state.gaze.active &&
      (this.state.idle.manual || this.state.idle.automatic)
    ) {
      const idlePhase = now / 1800;
      targetEyeX = Math.sin(idlePhase) * rect.width * 0.009;
      targetEyeY = Math.cos(idlePhase * 0.73) * rect.height * 0.005;
      targetYaw = Math.sin(idlePhase * 0.47) * 0.7;
      targetPitch =
        this.state.expression.headPitch + Math.cos(idlePhase * 0.42) * 0.35;
      targetRoll = this.state.expression.headRoll;
      targetFaceShiftX = 0;
      targetFaceScaleX = 1;
    }

    if (this.state.drag.active) {
      targetEyeX = 0;
      targetEyeY = rect.height * 0.008;
      targetRoll = clamp(dx / window.innerWidth, -1, 1) * 2.5;
      targetFaceShiftX = 0;
      targetFaceScaleX = 1;
    }

    const eyeEase = this.reducedMotion.matches ? 0.5 : 0.28;
    const headEase = this.reducedMotion.matches ? 0.3 : 0.075;
    this.state.motion.eyeX = lerp(
      this.state.motion.eyeX,
      targetEyeX,
      eyeEase,
    );
    this.state.motion.eyeY = lerp(
      this.state.motion.eyeY,
      targetEyeY,
      eyeEase,
    );
    this.state.motion.yaw = lerp(this.state.motion.yaw, targetYaw, headEase);
    this.state.motion.pitch = lerp(
      this.state.motion.pitch,
      targetPitch,
      headEase,
    );
    this.state.motion.roll = lerp(
      this.state.motion.roll,
      targetRoll,
      0.09,
    );
    this.state.motion.faceShiftX = lerp(
      this.state.motion.faceShiftX,
      targetFaceShiftX,
      headEase,
    );
    this.state.motion.faceScaleX = lerp(
      this.state.motion.faceScaleX,
      targetFaceScaleX,
      headEase,
    );
    this.state.motion.pressDepth = lerp(
      this.state.motion.pressDepth,
      this.state.interaction.pressed ? 2 : 0,
      0.22,
    );

    this.element.style.setProperty("--eye-x", `${this.state.motion.eyeX}px`);
    this.element.style.setProperty("--eye-y", `${this.state.motion.eyeY}px`);
    this.element.style.setProperty(
      "--blink-scale-y",
      this.state.motion.eyeScaleY,
    );
    this.element.style.setProperty("--face-yaw", `${this.state.motion.yaw}deg`);
    this.element.style.setProperty(
      "--face-pitch",
      `${this.state.motion.pitch}deg`,
    );
    this.element.style.setProperty(
      "--face-roll",
      `${this.state.motion.roll}deg`,
    );
    this.element.style.setProperty(
      "--face-shift-x",
      `${this.state.motion.faceShiftX}px`,
    );
    this.element.style.setProperty(
      "--face-scale-x",
      String(this.state.motion.faceScaleX),
    );
    this.element.style.setProperty(
      "--press-depth",
      `${this.state.motion.pressDepth}px`,
    );

    this.animationFrame = requestAnimationFrame(this.animate);
  }

  getSize() {
    return this.element?.getBoundingClientRect().width ?? this.options.size;
  }

  getElement() {
    return this.element;
  }

  setGazeTarget(target) {
    if (!Number.isFinite(target?.x) || !Number.isFinite(target?.y)) return;
    this.state.gaze.active = true;
    this.state.gaze.x = target.x;
    this.state.gaze.y = target.y;
  }

  clearGazeTarget() {
    this.state.gaze.active = false;
  }

  constrainPosition() {
    const size = this.getSize();
    this.state.position.x = clamp(
      this.state.position.x,
      EDGE_GAP,
      Math.max(EDGE_GAP, window.innerWidth - size - EDGE_GAP),
    );
    this.state.position.y = clamp(
      this.state.position.y,
      EDGE_GAP,
      Math.max(EDGE_GAP, window.innerHeight - size - EDGE_GAP),
    );
  }

  renderPosition() {
    this.element.style.left = `${this.state.position.x}px`;
    this.element.style.top = `${this.state.position.y}px`;
    this.element.dispatchEvent(new CustomEvent("assistant:move"));
  }

  savePosition() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.position));
    } catch {
      // The component still works when storage is unavailable.
    }
  }
}

window.ScreenAssistant = ScreenAssistant;
})();
