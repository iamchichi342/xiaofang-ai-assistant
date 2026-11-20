(() => {
  const icons = {
    settings: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path>
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.55v-.08A1.7 1.7 0 0 0 8.4 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.2V9.55h.08A1.7 1.7 0 0 0 4 8.4a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.46 3.6l.06.06A1.7 1.7 0 0 0 8.4 4a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.2h4.05v.08A1.7 1.7 0 0 0 15 4a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8.4a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4.05h-.08A1.7 1.7 0 0 0 19.4 15Z"></path>
      </svg>`,
    persona: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"></path>
        <path d="M4.5 20c.5-4 2.8-6 7-6 1 0 1.9.1 2.7.4"></path>
        <path d="m17.5 13.5.8-1.8.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8Z"></path>
      </svg>`,
    chat: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 15a4 4 0 0 1-4 4H8l-4 3v-7a4 4 0 0 1-1-2.7V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v8Z"></path>
      </svg>`,
    close: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 6 12 12M18 6 6 18"></path>
      </svg>`,
    stop: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="7" y="7" width="10" height="10" rx="1"></rect>
      </svg>`,
    alert: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 2.8 20h18.4L12 3Z"></path>
        <path d="M12 9v5M12 17.5v.1"></path>
      </svg>`,
    idle: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5"></circle>
        <path d="M9.5 9v6M14.5 9v6"></path>
      </svg>`,
    resume: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9 7 8 5-8 5V7Z"></path>
      </svg>`,
  };

  window.AssistantMenuData = {
    icons,
    items: [
      {
        id: "api",
        label: "配置 API",
        color: "#58a6ff",
        icon: icons.settings,
      },
      {
        id: "persona",
        label: "提示词与人设",
        color: "#c084fc",
        icon: icons.persona,
      },
      {
        id: "chat",
        label: "与它对话",
        color: "#43d69f",
        icon: icons.chat,
      },
      {
        id: "idle",
        label: "闲置 5 分钟",
        color: "#f5b84b",
        icon: icons.idle,
      },
    ],
  };
})();
