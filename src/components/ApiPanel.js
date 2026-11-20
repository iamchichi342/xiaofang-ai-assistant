(() => {
  class ApiPanel {
    constructor(assistant, store, apiClient, handlers = {}) {
      this.assistant = assistant;
      this.store = store;
      this.apiClient = apiClient;
      this.handlers = handlers;
      this.open = false;
      this.testController = null;
      this.position = this.position.bind(this);
    }

    mount() {
      const closeIcon = window.AssistantMenuData.icons.close;
      this.element = document.createElement("section");
      this.element.className = "assistant-tool-panel assistant-tool-panel--api";
      this.element.dataset.open = "false";
      this.element.setAttribute("aria-label", "API 配置");
      this.element.innerHTML = `
        <header class="assistant-tool-panel__header">
          <div>
            <span class="assistant-tool-panel__eyebrow">CONNECTION</span>
            <h2>配置 API</h2>
          </div>
          <button class="assistant-icon-button" type="button" aria-label="关闭 API 配置" title="关闭">
            ${closeIcon}
          </button>
        </header>
        <form class="assistant-form" autocomplete="off">
          <label>
            <span>服务商</span>
            <select name="provider">
              <option value="openai-compatible">OpenAI 兼容接口</option>
            </select>
          </label>
          <label>
            <span>API Base URL</span>
            <input name="baseUrl" type="url" placeholder="https://example.com/v1" required />
          </label>
          <label>
            <span>API Key</span>
            <input name="apiKey" type="password" placeholder="仅保留到当前标签页关闭" required />
          </label>
          <label>
            <span>模型</span>
            <input name="model" type="text" placeholder="输入服务商提供的模型名称" required />
          </label>
          <p class="assistant-form__note">密钥仅保存在当前浏览器会话，不写入长期存储。</p>
          <div class="assistant-form__footer">
            <span class="assistant-form__status" role="status" aria-live="polite">尚未配置</span>
            <div class="assistant-form__actions">
              <button class="assistant-text-button assistant-text-button--secondary" type="button" data-action="test">测试</button>
              <button class="assistant-text-button" type="submit">保存</button>
            </div>
          </div>
        </form>
      `;
      document.body.append(this.element);

      this.form = this.element.querySelector("form");
      this.status = this.element.querySelector(".assistant-form__status");
      this.testButton = this.element.querySelector('[data-action="test"]');
      this.element.querySelector(".assistant-icon-button").addEventListener("click", () => this.setOpen(false));
      this.form.addEventListener("input", () => this.setStatus("editing", "正在编辑"));
      this.form.addEventListener("submit", (event) => this.handleSave(event));
      this.testButton.addEventListener("click", () => this.handleTest());
      this.assistant.getElement().addEventListener("assistant:move", this.position);
      window.addEventListener("resize", this.position);
    }

    setOpen(open) {
      this.open = open;
      this.element.dataset.open = String(open);
      this.element.setAttribute("aria-hidden", String(!open));
      if (open) {
        this.load();
        requestAnimationFrame(() => {
          this.position();
          this.focusPanel();
          this.element.querySelector("input")?.focus();
        });
      } else {
        this.testController?.abort();
      }
      this.handlers.onOpenChange?.(open, this);
    }

    toggle() {
      this.setOpen(!this.open);
    }

    load() {
      const config = this.store.getApiConfig();
      Object.entries(config).forEach(([key, value]) => {
        if (this.form.elements[key]) this.form.elements[key].value = value;
      });
      this.setStatus(config.apiKey ? "saved" : "empty", config.apiKey ? "已载入会话配置" : "尚未配置");
    }

    read() {
      const data = new FormData(this.form);
      return {
        provider: data.get("provider"),
        baseUrl: data.get("baseUrl"),
        apiKey: data.get("apiKey"),
        model: data.get("model"),
      };
    }

    handleSave(event) {
      event.preventDefault();
      const config = this.read();
      try {
        this.apiClient.validateConfig(config);
        this.store.saveApiConfig(config);
        this.setStatus("saved", "已保存到当前会话");
        this.handlers.onSaved?.(config);
      } catch (error) {
        this.setStatus("failed", error.message);
        this.handlers.onError?.(error);
      }
    }

    async handleTest() {
      const config = this.read();
      this.testController?.abort();
      this.testController = new AbortController();
      this.testButton.disabled = true;
      this.setStatus("testing", "正在连接…");
      this.handlers.onTesting?.();

      try {
        await this.apiClient.testConnection(config, this.testController.signal);
        this.store.saveApiConfig(config);
        this.setStatus("connected", "连接成功");
        this.handlers.onConnected?.();
      } catch (error) {
        if (error.name !== "AbortError") {
          this.setStatus("failed", error.message);
          this.handlers.onError?.(error);
        }
      } finally {
        this.testButton.disabled = false;
      }
    }

    setStatus(state, message) {
      this.element.dataset.status = state;
      this.status.textContent = message;
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
        x: rect.left + Math.min(64, rect.width / 2),
        y: rect.top + 42,
      });
    }
  }

  window.AssistantApiPanel = ApiPanel;
})();
