(() => {
  const API_KEY = "robot-assistant-api-v1";
  const PERSONA_KEY = "robot-assistant-persona-v1";

  const defaultPersona = Object.freeze({
    name: "小方",
    identity: "一个安静、敏锐的网页小助手",
    systemPrompt:
      "你是一个通过简短文字、眼神和动作表达的网页小机器人。回答要直接、温和、具体，不要假装拥有网页之外的能力，也不要主动连续发言。",
    tone: "温和直接",
    responseLength: "简短",
    proactive: false,
  });

  function read(key, fallback) {
    try {
      const value = JSON.parse(sessionStorage.getItem(key));
      return value && typeof value === "object" ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The assistant keeps the current in-memory values when storage is blocked.
    }
    return value;
  }

  class SessionStore {
    constructor() {
      this.apiConfig = read(API_KEY, {
        provider: "openai-compatible",
        baseUrl: "",
        apiKey: "",
        model: "",
      });
      this.persona = {
        ...defaultPersona,
        ...read(PERSONA_KEY, {}),
      };
    }

    getApiConfig() {
      return { ...this.apiConfig };
    }

    saveApiConfig(config) {
      this.apiConfig = {
        provider: config.provider || "openai-compatible",
        baseUrl: String(config.baseUrl || "").trim(),
        apiKey: String(config.apiKey || "").trim(),
        model: String(config.model || "").trim(),
      };
      return write(API_KEY, this.apiConfig);
    }

    getPersona() {
      return { ...this.persona };
    }

    savePersona(persona) {
      this.persona = {
        ...defaultPersona,
        ...persona,
      };
      return write(PERSONA_KEY, this.persona);
    }

    resetPersona() {
      this.persona = { ...defaultPersona };
      return write(PERSONA_KEY, this.persona);
    }

    getDefaultPersona() {
      return { ...defaultPersona };
    }
  }

  window.AssistantSessionStore = SessionStore;
})();
