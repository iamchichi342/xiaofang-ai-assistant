(() => {
  class FunctionBall {
    constructor(item, handlers = {}) {
      this.item = item;
      this.handlers = handlers;
      this.element = null;
      this.visible = Boolean(item.persistent);
    }

    create() {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "assistant-function-ball";
      button.dataset.item = this.item.id;
      button.dataset.visible = String(this.visible);
      button.style.setProperty("--ball-color", this.item.color);
      button.setAttribute("aria-label", this.item.label);
      button.title = this.item.label;
      button.innerHTML = `<span class="assistant-function-ball__icon">${this.item.icon}</span>`;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.handlers.onClick?.(this.item, this);
      });
      button.addEventListener("pointerenter", () => {
        this.handlers.onEnter?.(this.item, this);
      });
      button.addEventListener("pointerleave", () => {
        this.handlers.onLeave?.(this.item, this);
      });
      this.element = button;
      return button;
    }

    setVisible(visible, delay = 0) {
      this.visible = visible;
      this.element.style.setProperty("--ball-delay", `${delay}ms`);
      this.element.dataset.visible = String(visible);
      this.element.tabIndex = visible ? 0 : -1;
    }

    setPosition(x, y) {
      this.element.style.setProperty("--ball-x", `${x}px`);
      this.element.style.setProperty("--ball-y", `${y}px`);
    }

    setIcon(icon, label = this.item.label) {
      this.element.querySelector(".assistant-function-ball__icon").innerHTML = icon;
      this.element.setAttribute("aria-label", label);
      this.element.title = label;
    }

    setState(state) {
      this.element.dataset.state = state;
    }

    getCenter() {
      const rect = this.element.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  }

  window.AssistantFunctionBall = FunctionBall;
})();
