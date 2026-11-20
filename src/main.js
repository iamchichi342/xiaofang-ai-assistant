(() => {
  const root = document.querySelector("#assistant-root");
  const store = new window.AssistantSessionStore();
  const apiClient = new window.AssistantApiClient();
  const assistant = new window.ScreenAssistant(root, {
    initialSide: "right",
  });

  assistant.mount();

  let requestController = null;
  let conversationVersion = 0;
  let chatStateTimer = null;
  let contextMenu = null;

  const chat = new window.AssistantChatBubble(assistant, {
    onSend: (message) => sendMessage(message),
    onReset: () => resetConversation(),
    onClose: () => closeChat(),
    onTyping: (typing) => {
      if (!chat.open || chat.streaming || !contextMenu) return;
      contextMenu.updateChatState(typing ? "typing" : "open");
    },
    onOpenChange: (open) => {
      if (!open) restoreGaze();
    },
  });

  const apiPanel = new window.AssistantApiPanel(assistant, store, apiClient, {
    onTesting: () => assistant.setExpression("sleepy", { duration: 0 }),
    onConnected: () => assistant.setExpression("joy"),
    onSaved: () => assistant.setExpression("joy"),
    onError: () => assistant.setExpression("sadness"),
    onOpenChange: (open) => {
      if (!open) restoreGaze();
    },
  });

  const personaPanel = new window.AssistantPersonaPanel(assistant, store, {
    onSaved: (persona) => {
      chat.setPersona(persona);
      assistant.setExpression("joy");
      assistant.showMessage("人设已更新。");
    },
    onReset: (persona) => {
      chat.setPersona(persona);
      assistant.setExpression("curious");
    },
    onOpenChange: (open) => {
      if (!open) restoreGaze();
    },
  });

  chat.mount();
  apiPanel.mount();
  personaPanel.mount();
  chat.setPersona(store.getPersona());

  contextMenu = new window.AssistantContextMenu(assistant, {
    onApi: () => {
      const next = !apiPanel.open;
      personaPanel.setOpen(false);
      closeChat();
      apiPanel.setOpen(next);
    },
    onPersona: () => {
      const next = !personaPanel.open;
      apiPanel.setOpen(false);
      closeChat();
      personaPanel.setOpen(next);
    },
    onChat: (state) => {
      if (state === "streaming") {
        requestController?.abort();
        return;
      }
      if (state === "error") {
        chat.setOpen(true);
        contextMenu.updateChatState("open");
        assistant.setExpression("neutral", { duration: 0 });
        restoreGaze();
        return;
      }
      if (chat.open) closeChat();
      else openChat();
    },
    onIdle: () => assistant.toggleManualIdle(),
    onGazeFallback: () => focusActiveSurface(),
  });

  contextMenu.mount();

  function openChat() {
    apiPanel.setOpen(false);
    personaPanel.setOpen(false);
    chat.setOpen(true);
    contextMenu.updateChatState("open");
    assistant.setExpression("neutral", { duration: 0 });
    restoreGaze();
  }

  function closeChat() {
    if (!chat.open) return;
    if (chat.streaming) requestController?.abort();
    chat.setOpen(false);
    contextMenu?.updateChatState("closed");
    assistant.setExpression("neutral", { duration: 0 });
    restoreGaze();
  }

  function resetConversation() {
    conversationVersion += 1;
    window.clearTimeout(chatStateTimer);
    requestController?.abort();
    requestController = null;
    chat.resetConversation();
    contextMenu.updateChatState("open");
    assistant.setExpression("neutral", { duration: 0 });
    restoreGaze();
  }

  function focusActiveSurface() {
    if (apiPanel.open) {
      apiPanel.focusPanel();
      return true;
    }
    if (personaPanel.open) {
      personaPanel.focusPanel();
      return true;
    }
    return false;
  }

  function restoreGaze() {
    requestAnimationFrame(() => {
      if (focusActiveSurface()) return;
      if (contextMenu?.open) contextMenu.focusMenuCenter();
      else assistant.clearGazeTarget();
    });
  }

  function buildSystemPrompt(persona) {
    return [
      persona.systemPrompt,
      `你的名字是${persona.name || "机器人"}。`,
      persona.identity ? `你的身份是：${persona.identity}。` : "",
      `语气风格：${persona.tone || "温和直接"}。`,
      `回答长度：${persona.responseLength || "简短"}。`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function sendMessage(text) {
    const requestVersion = conversationVersion;
    window.clearTimeout(chatStateTimer);
    chat.addMessage("user", text);
    const config = store.getApiConfig();
    const persona = store.getPersona();

    try {
      apiClient.validateConfig(config);
    } catch (error) {
      chat.addError(error.message);
      chat.setOpen(false);
      contextMenu.updateChatState("error");
      assistant.setExpression("sadness");
      apiPanel.setOpen(true);
      return;
    }

    const requestMessages = [
      { role: "system", content: buildSystemPrompt(persona) },
      ...chat.getMessages(),
    ];

    chat.beginAssistantMessage();
    contextMenu.updateChatState("streaming");
    assistant.setExpression("neutral", { duration: 0 });
    const controller = new AbortController();
    requestController = controller;

    try {
      const output = await apiClient.complete(config, requestMessages, {
        signal: controller.signal,
        stream: true,
        onToken: (token) => {
          if (requestVersion === conversationVersion) chat.appendAssistantToken(token);
        },
      });
      if (requestVersion !== conversationVersion) return;
      chat.finishAssistantMessage(output ? "" : "我没有收到可显示的内容。");
      contextMenu.updateChatState("open");
      assistant.setExpression("joy");
    } catch (error) {
      if (requestVersion !== conversationVersion) return;
      if (error.name === "AbortError") {
        if (chat.activeAssistantIndex >= 0) {
          const active = chat.messages[chat.activeAssistantIndex];
          if (active?.text) chat.finishAssistantMessage();
          else chat.removeActiveAssistantMessage();
        }
        contextMenu.updateChatState(chat.open ? "open" : "closed");
        assistant.setExpression("neutral", { duration: 0 });
      } else {
        chat.removeActiveAssistantMessage();
        chat.addError(error.message || "请求失败，请检查接口配置。");
        contextMenu.updateChatState("error");
        assistant.setExpression("sadness");
        chatStateTimer = window.setTimeout(() => {
          if (chat.open && !chat.streaming) contextMenu.updateChatState("open");
        }, 3200);
      }
    } finally {
      if (requestController === controller) requestController = null;
      if (requestVersion === conversationVersion) restoreGaze();
    }
  }

  const controls = document.querySelector("#expression-controls");
  const description = document.querySelector("#expression-description");

  if (controls && description) {
    Object.entries(window.AssistantExpressions).forEach(([name, expression]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "expression-control";
      button.textContent = expression.label;
      button.dataset.expression = name;
      button.setAttribute("aria-pressed", name === "neutral" ? "true" : "false");
      button.addEventListener("click", () => {
        controls.querySelectorAll("button").forEach((item) => {
          item.setAttribute("aria-pressed", String(item === button));
        });
        description.textContent = expression.description;
        assistant.setExpression(name, { announce: true, duration: 0 });
      });
      controls.append(button);
    });
  }

  window.robotAssistant = assistant;
  window.robotAssistantApp = {
    assistant,
    contextMenu,
    apiPanel,
    personaPanel,
    chat,
    store,
  };
})();
