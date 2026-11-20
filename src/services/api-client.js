(() => {
  class ApiClientError extends Error {
    constructor(message, details = {}) {
      super(message);
      this.name = "ApiClientError";
      this.status = details.status;
      this.code = details.code;
    }
  }

  function normalizeBaseUrl(value) {
    return String(value || "")
      .trim()
      .replace(/\/+$/, "")
      .replace(/\/chat\/completions$/i, "");
  }

  function extractText(payload) {
    return (
      payload?.choices?.[0]?.message?.content ??
      payload?.choices?.[0]?.text ??
      payload?.output_text ??
      ""
    );
  }

  function normalizeMessages(messages) {
    return (Array.isArray(messages) ? messages : [])
      .map((message) => ({
        role: String(message?.role || "user"),
        content: String(message?.content ?? message?.text ?? ""),
      }))
      .filter((message) => message.content);
  }

  class ApiClient {
    validateConfig(config) {
      if (!String(config?.baseUrl || "").trim()) {
        throw new ApiClientError("请先填写 API Base URL。", { code: "config" });
      }
      if (!String(config?.apiKey || "").trim()) {
        throw new ApiClientError("请先填写 API Key。", { code: "config" });
      }
      if (!String(config?.model || "").trim()) {
        throw new ApiClientError("请先填写模型名称。", { code: "config" });
      }
    }

    async testConnection(config, signal) {
      const response = await this.complete(
        config,
        [{ role: "user", content: "Reply with OK." }],
        { signal, stream: false, maxTokens: 4 },
      );
      return response || "OK";
    }

    async complete(config, messages, options = {}) {
      this.validateConfig(config);
      const baseUrl = normalizeBaseUrl(config.baseUrl);
      const endpoint = `${baseUrl}/chat/completions`;
      let response;

      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: normalizeMessages(messages),
            stream: options.stream !== false,
            ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
          }),
          signal: options.signal,
        });
      } catch (error) {
        if (error.name === "AbortError") throw error;
        throw new ApiClientError(
          "浏览器无法连接该接口。请检查地址、网络以及接口是否允许浏览器跨域访问。",
          { code: "network" },
        );
      }

      if (!response.ok) {
        throw await this.createResponseError(response);
      }

      const contentType = response.headers.get("content-type") || "";
      if (options.stream !== false && response.body && contentType.includes("text/event-stream")) {
        return this.readEventStream(response.body, options.onToken);
      }

      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new ApiClientError("接口返回了无法识别的数据。", {
          status: response.status,
          code: "invalid-response",
        });
      }
      const text = extractText(payload);
      if (text) options.onToken?.(text);
      return text;
    }

    async readEventStream(stream, onToken) {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let output = "";

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split(/\r?\n/);
        buffer = done ? "" : lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const payload = JSON.parse(data);
            const token =
              payload?.choices?.[0]?.delta?.content ??
              payload?.choices?.[0]?.message?.content ??
              "";
            if (token) {
              output += token;
              onToken?.(token);
            }
          } catch {
            // Ignore comments and provider-specific keep-alive events.
          }
        }

        if (done) break;
      }

      return output;
    }

    async createResponseError(response) {
      let providerMessage = "";
      try {
        const payload = await response.json();
        providerMessage = payload?.error?.message || payload?.message || "";
      } catch {
        providerMessage = "";
      }

      const fallback = {
        401: "API Key 无效或没有访问权限。",
        403: "当前密钥没有调用该模型的权限。",
        404: "没有找到接口或模型，请检查 Base URL 和模型名称。",
        429: "请求过于频繁或额度不足，请稍后再试。",
      }[response.status];

      return new ApiClientError(
        providerMessage || fallback || `接口请求失败（${response.status}）。`,
        { status: response.status, code: "http" },
      );
    }
  }

  window.AssistantApiClient = ApiClient;
})();
