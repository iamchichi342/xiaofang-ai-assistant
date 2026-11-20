(() => {
  class PersonaPanel {
    constructor(assistant, store, handlers = {}) {
      this.assistant = assistant;
      this.store = store;
      this.handlers = handlers;
      this.open = false;
      this.position = this.position.bind(this);
    }

    mount() {
      const closeIcon = window.AssistantMenuData.icons.close;
      this.element = document.createElement("section");
      this.element.className = "assistant-tool-panel assistant-tool-panel--persona";
      this.element.dataset.open = "false";
      this.element.setAttribute("aria-label", "提示词与人设");
      this.element.innerHTML = `
        <header class="assistant-tool-panel__header">
          <div>
            <span class="assistant-tool-panel__eyebrow">PERSONA</span>
            <h2>提示词与人设</h2>
          </div>
          <button class="assistant-icon-button" type="button" aria-label="关闭人设设置" title="关闭">
            ${closeIcon}
          </button>
        </header>
        <form class="assistant-form">
          <div class="assistant-form__row">
            <label>
              <span>助手名称</span>
              <input name="name" type="text" maxlength="18" />
            </label>
            <label>
              <span>语气</span>
              <select name="tone">
                <option>温和直接</option>
                <option>冷静专业</option>
                <option>活泼简洁</option>
                <option>克制幽默</option>
              </select>
            </label>
          </div>
          <label>
            <span>一句话身份</span>
            <input name="identity" type="text" maxlength="60" />
          </label>
          <label>
            <span>系统提示词</span>
            <textarea name="systemPrompt" rows="6"></textarea>
          </label>
          <div class="assistant-form__row assistant-form__row--compact">
            <label>
              <span>回答长度</span>
              <select name="responseLength">
                <option>简短</option>
                <option>适中</option>
                <option>详细</option>
              </select>
            </label>
            <label class="assistant-toggle">
              <input name="proactive" type="checkbox" />
              <span class="assistant-toggle__track" aria-hidden="true"></span>
              <span>主动反馈</span>
            </label>
          </div>
          <div class="assistant-form__footer">
            <button class="assistant-text-button assistant-text-button--secondary" type="button" data-action="reset">恢复默认</button>
            <button class="assistant-text-button" type="submit">保存人设</button>
          </div>
        </form>
      `;
      document.body.append(this.element);

      this.form = this.element.querySelector("form");
      this.element.querySelector(".assistant-icon-button").addEventListener("click", () => this.setOpen(false));
      this.element.querySelector('[data-action="reset"]').addEventListener("click", () => this.handleReset());
      this.form.addEventListener("submit", (event) => this.handleSave(event));
      this.assistant.getElement().addEventListener("assistant:move", this.position);
      window.addEventListener("resize", this.position);
    }

    setOpen(open) {
      this.open = open;
      this.element.dataset.open = String(open);
      this.element.setAttribute("aria-hidden", String(!open));
      if (open) {
        this.load(this.store.getPersona());
        requestAnimationFrame(() => {
          this.position();
          this.focusPanel();
          this.element.querySelector("input")?.focus();
        });
      }
      this.handlers.onOpenChange?.(open, this);
    }

    toggle() {
      this.setOpen(!this.open);
    }

    load(persona) {
      Object.entries(persona).forEach(([key, value]) => {
        const field = this.form.elements[key];
        if (!field) return;
        if (field.type === "checkbox") field.checked = Boolean(value);
        else field.value = value;
      });
    }

    read() {
      const data = new FormData(this.form);
      return {
        name: String(data.get("name") || "").trim(),
        identity: String(data.get("identity") || "").trim(),
        systemPrompt: String(data.get("systemPrompt") || "").trim(),
        tone: data.get("tone"),
        responseLength: data.get("responseLength"),
        proactive: data.get("proactive") === "on",
      };
    }

    handleSave(event) {
      event.preventDefault();
      const persona = this.store.savePersona(this.read());
      this.handlers.onSaved?.(persona);
    }

    handleReset() {
      const persona = this.store.resetPersona();
      this.load(persona);
      this.handlers.onReset?.(persona);
    }

    position() {
      if (!this.open) return;
      const robot = this.assistant.getElement().getBoundingClientRect();
      const panel = this.element.getBoundingClientRect();
      const gap = Math.max(92, robot.width * 0.88);
      const padding = 14;
      let left = robot.left + robot.width / 2 > window.innerWidth / 2
        ? robot.left - panel.width - gap
        : robot.right + gap;
      let top = robot.top + robot.height / 2 - panel.height / 2;
      left = Math.max(padding, Math.min(left, window.innerWidth - panel.width - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - panel.height - padding));
      this.element.style.left = `${left}px`;
      this.element.style.top = `${top}px`;
    }

    focusPanel() {
      const rect = this.element.getBoundingClientRect();
      this.assistant.setGazeTarget({
        x: rect.left + Math.min(78, rect.width / 2),
        y: rect.top + 42,
      });
    }
  }

  window.AssistantPersonaPanel = PersonaPanel;
})();
