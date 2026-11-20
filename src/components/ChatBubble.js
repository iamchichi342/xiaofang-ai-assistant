(() => {
  const sendIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 14-8-4 16-3.2-6.2L5 12Z"></path>
      <path d="m11.8 13.8 3.4-3.4"></path>
    </svg>`;

  const restartIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11a8 8 0 1 0-2.34 5.66"></path>
      <path d="M20 4v7h-7"></path>
    </svg>`;

  const closeIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18"></path>
    </svg>`;

  class ChatBubble {
    constructor(assistant, handlers = {}) {
      this.assistant = assistant;
      this.handlers = handlers;
      this.open = false;
      this.streaming = false;
      this.messages = [];
      this.activeAssistantIndex = -1;
      this.position = this.position.bind(this);
    }

    mount() {
      this.element = document.createElement("section");
      this.element.className = "assistant-chat";
      this.element.dataset.open = "false";
      this.element.setAttribute("aria-label", "与机器人对话");
      this.element.innerHTML = `
        <div class="assistant-chat__response" aria-live="polite">
          <div class="assistant-chat__heading">
            <span class="assistant-chat__presence"></span>
            <span class="assistant-chat__name">小方</span>
            <span class="assistant-chat__status">等待输入</span>
            <button class="assistant-chat__restart" type="button" aria-label="重新开始对话" title="重新开始对话">
              ${restartIcon}
            </button>
            <button class="assistant-chat__close" type="button" aria-label="关闭对话" title="关闭对话">
              ${closeIcon}
            </button>
          </div>
          <div class="assistant-chat__messages"></div>
        </div>
        <form class="assistant-chat__composer">
          <input name="message" type="text" autocomplete="off" placeholder="和它说点什么…" aria-label="输入消息" />
          <button type="submit" aria-label="发送消息" title="发送">${sendIcon}</button>
        </form>
      `;
      document.body.append(this.element);
      this.messagesElement = this.element.querySelector(".assistant-chat__messages");
      this.input = this.element.querySelector("input");
      this.sendButton = this.element.querySelector('button[type="submit"]');
      this.status = this.element.querySelector(".assistant-chat__status");
      this.nameElement = this.element.querySelector(".assistant-chat__name");
      this.restartButton = this.element.querySelector(".assistant-chat__restart");
      this.closeButton = this.element.querySelector(".assistant-chat__close");

      this.element.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        const text = this.input.value.trim();
        if (!text || this.streaming) return;
        this.input.value = "";
        this.handlers.onSend?.(text);
      });
      this.input.addEventListener("input", () => {
        this.handlers.onTyping?.(Boolean(this.input.value.trim()));
      });
      this.restartButton.addEventListener("click", () => {
        this.handlers.onReset?.();
      });
      this.closeButton.addEventListener("click", () => {
        this.handlers.onClose?.();
      });
      this.assistant.getElement().addEventListener("assistant:move", this.position);
      window.addEventListener("resize", this.position);
      this.renderMessages();
    }

    setOpen(open) {
      this.open = open;
      this.element.dataset.open = String(open);
      this.element.setAttribute("aria-hidden", String(!open));
      if (open) {
        requestAnimationFrame(() => {
          this.position();
          this.input.focus();
        });
      }
      this.handlers.onOpenChange?.(open);
    }

    toggle() {
      this.setOpen(!this.open);
    }

    setPersona(persona) {
      this.nameElement.textContent = persona.name || "机器人";
      this.input.placeholder = `和${persona.name || "它"}说点什么…`;
    }

    addMessage(role, text) {
      this.messages.push({ role, text: String(text || "") });
      this.renderMessages();
      return this.messages.length - 1;
    }

    beginAssistantMessage() {
      this.activeAssistantIndex = this.addMessage("assistant", "");
      this.setStreaming(true);
      return this.activeAssistantIndex;
    }

    appendAssistantToken(token) {
      if (this.activeAssistantIndex < 0) return;
      this.messages[this.activeAssistantIndex].text += token;
      this.renderMessages();
    }

    finishAssistantMessage(fallback = "") {
      if (
        this.activeAssistantIndex >= 0 &&
        !this.messages[this.activeAssistantIndex].text &&
        fallback
      ) {
        this.messages[this.activeAssistantIndex].text = fallback;
      }
      this.activeAssistantIndex = -1;
      this.setStreaming(false);
      this.renderMessages();
    }

    removeActiveAssistantMessage() {
      if (this.activeAssistantIndex >= 0) {
        this.messages.splice(this.activeAssistantIndex, 1);
      }
      this.activeAssistantIndex = -1;
      this.setStreaming(false);
      this.renderMessages();
    }

    addError(message) {
      this.addMessage("error", message);
      this.setStatus("需要检查设置");
    }

    resetConversation() {
      this.messages = [];
      this.activeAssistantIndex = -1;
      this.input.value = "";
      this.setStreaming(false);
      this.renderMessages();
      this.handlers.onTyping?.(false);
      this.input.focus();
    }

    setStreaming(streaming) {
      this.streaming = streaming;
      this.element.dataset.streaming = String(streaming);
      this.input.disabled = streaming;
      this.sendButton.disabled = streaming;
      this.setStatus(streaming ? "正在回应" : "等待输入");
    }

    setStatus(text) {
      this.status.textContent = text;
    }

    getMessages() {
      return this.messages
        .filter((message) => ["user", "assistant"].includes(message.role) && message.text)
        .map((message) => ({
          role: message.role,
          content: message.text,
        }));
    }

    renderMessages() {
      if (!this.messages.length) {
        this.messagesElement.innerHTML = `
          <p class="assistant-chat__empty">我在这里。配置好 API 后，可以直接开始对话。</p>
        `;
        return;
      }

      const fragment = document.createDocumentFragment();
      this.messages.slice(-8).forEach((message) => {
        const item = document.createElement("p");
        item.className = `assistant-chat__message assistant-chat__message--${message.role}`;
        item.textContent = message.text || (this.streaming ? "…" : "");
        fragment.append(item);
      });
      this.messagesElement.replaceChildren(fragment);
      this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
    }

    position() {
      if (!this.open) return;
      const robot = this.assistant.getElement().getBoundingClientRect();
      const chat = this.element.getBoundingClientRect();
      const padding = 14;
      const gap = 18;
      let left = robot.left + robot.width / 2 > window.innerWidth / 2
        ? robot.right - chat.width
        : robot.left;
      let top;

      if (robot.top + robot.height / 2 > window.innerHeight / 2) {
        top = robot.top - chat.height - gap;
      } else {
        top = robot.bottom + gap;
      }

      left = Math.max(padding, Math.min(left, window.innerWidth - chat.width - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - chat.height - padding));
      this.element.style.left = `${left}px`;
      this.element.style.top = `${top}px`;
    }

    focusComposer() {
      const rect = this.element.querySelector(".assistant-chat__composer").getBoundingClientRect();
      this.assistant.setGazeTarget({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }

  window.AssistantChatBubble = ChatBubble;
})();
