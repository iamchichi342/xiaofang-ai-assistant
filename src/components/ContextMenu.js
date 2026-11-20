(() => {
  const { items, icons } = window.AssistantMenuData;
  const FunctionBall = window.AssistantFunctionBall;

  class ContextMenu {
    constructor(assistant, handlers = {}) {
      this.assistant = assistant;
      this.handlers = handlers;
      this.open = false;
      this.chatState = "closed";
      this.manualIdle = false;
      this.balls = new Map();
      this.handleDocumentPointerDown = this.handleDocumentPointerDown.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.layout = this.layout.bind(this);
    }

    mount() {
      this.host = this.assistant.getElement();
      this.robotButton = this.host.querySelector(".screen-assistant__hit-area");
      this.container = document.createElement("div");
      this.container.className = "assistant-orb-menu";
      this.container.setAttribute("aria-label", "机器人功能菜单");
      this.host.append(this.container);

      items.forEach((item) => {
        const ball = new FunctionBall(item, {
          onClick: (selected) => this.handleBallClick(selected),
          onEnter: () => this.assistant.setGazeTarget(ball.getCenter()),
          onLeave: () => this.focusMenuCenter(),
        });
        this.balls.set(item.id, ball);
        this.container.append(ball.create());
      });

      this.robotButton.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.toggle();
      });
      this.host.addEventListener("assistant:menu-request", () => this.toggle());
      this.host.addEventListener("assistant:idle-change", (event) => {
        this.updateIdleState(Boolean(event.detail?.manual));
      });
      this.host.addEventListener("assistant:move", this.layout);
      window.addEventListener("resize", this.layout);
      document.addEventListener("pointerdown", this.handleDocumentPointerDown);
      document.addEventListener("keydown", this.handleKeyDown);
      this.layout();
      this.updateChatState("closed");
      this.updateIdleState(false);
    }

    toggle() {
      this.setOpen(!this.open);
    }

    setOpen(open) {
      this.open = open;
      this.container.dataset.open = String(open);
      this.balls.get("api").setVisible(open, 0);
      this.balls.get("persona").setVisible(open, open ? 55 : 0);
      this.balls.get("chat").setVisible(open, open ? 105 : 0);
      this.balls.get("idle").setVisible(open, open ? 80 : 0);
      this.assistant.setExpression(open ? "curious" : "neutral", {
        duration: 0,
      });
      this.layout();

      if (open) {
        requestAnimationFrame(() => this.focusMenuCenter());
      } else if (!this.handlers.onGazeFallback?.()) {
        this.assistant.clearGazeTarget();
      }
      this.handlers.onOpenChange?.(open);
    }

    updateChatState(state) {
      this.chatState = state;
      const chatBall = this.balls.get("chat");
      chatBall.setState(state);

      if (state === "streaming") {
        chatBall.setIcon(icons.stop, "停止回答");
      } else if (state === "error") {
        chatBall.setIcon(icons.alert, "会话出现错误");
      } else if (state === "open" || state === "typing") {
        chatBall.setIcon(icons.close, "关闭会话");
      } else {
        chatBall.setIcon(icons.chat, "与它对话");
      }
    }

    updateIdleState(active) {
      this.manualIdle = active;
      const idleBall = this.balls.get("idle");
      idleBall.setState(active ? "active" : "idle");
      idleBall.setIcon(
        active ? icons.resume : icons.idle,
        active ? "提前结束闲置模式" : "闲置 5 分钟",
      );
    }

    handleBallClick(item) {
      if (item.id === "api") this.handlers.onApi?.();
      if (item.id === "persona") this.handlers.onPersona?.();
      if (item.id === "chat") this.handlers.onChat?.(this.chatState);
      if (item.id === "idle") this.handlers.onIdle?.(this.manualIdle);
      this.setOpen(false);
    }

    handleDocumentPointerDown(event) {
      if (!this.open) return;
      if (this.container.contains(event.target) || this.host.contains(event.target)) {
        return;
      }
      this.setOpen(false);
    }

    handleKeyDown(event) {
      if (event.key === "F10" && event.shiftKey && document.activeElement === this.robotButton) {
        event.preventDefault();
        this.toggle();
        return;
      }
      if (event.key === "Escape" && this.open) {
        this.setOpen(false);
        this.robotButton.focus();
      }
    }

    layout() {
      if (!this.host) return;
      const rect = this.host.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const size = rect.width;
      const radius = size * 0.8 + 19;
      const spread = 26 * (Math.PI / 180);
      const idleAngle = -55 * (Math.PI / 180);
      const arcX = Math.cos(spread) * radius;
      const arcY = Math.sin(spread) * radius;

      this.balls.get("chat").setPosition(
        centerX - radius,
        centerY,
      );
      this.balls.get("api").setPosition(
        centerX - arcX,
        centerY - arcY,
      );
      this.balls.get("persona").setPosition(
        centerX - arcX,
        centerY + arcY,
      );
      this.balls.get("idle").setPosition(
        centerX + Math.cos(idleAngle) * radius,
        centerY + Math.sin(idleAngle) * radius,
      );
    }

    focusMenuCenter() {
      const visibleBalls = [...this.balls.values()].filter((ball) => ball.visible);
      if (!visibleBalls.length) return;
      const centers = visibleBalls.map((ball) => ball.getCenter());
      this.assistant.setGazeTarget({
        x: centers.reduce((sum, item) => sum + item.x, 0) / centers.length,
        y: centers.reduce((sum, item) => sum + item.y, 0) / centers.length,
      });
    }

    getBall(id) {
      return this.balls.get(id);
    }
  }

  window.AssistantContextMenu = ContextMenu;
})();
