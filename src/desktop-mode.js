(() => {
  const desktopMode =
    Boolean(window.desktopShell?.isDesktop) ||
    new URLSearchParams(window.location.search).get("desktop") === "1";

  if (!desktopMode) return;

  document.documentElement.classList.add("desktop-mode");
  document.body.classList.add("desktop-mode");

  const interactiveSelector = [
    ".screen-assistant",
    '.assistant-function-ball[data-visible="true"]',
    '.assistant-chat[data-open="true"]',
    '.assistant-tool-panel[data-open="true"]',
  ].join(",");
  let updateFrame = null;

  function updateInteractiveRegions() {
    updateFrame = null;
    const regions = [...document.querySelectorAll(interactiveSelector)]
      .filter((element) => getComputedStyle(element).pointerEvents !== "none")
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      });
    window.desktopShell?.updateInteractiveRegions(regions);
  }

  function scheduleRegionUpdate() {
    if (updateFrame !== null) return;
    updateFrame = requestAnimationFrame(updateInteractiveRegions);
  }

  const observer = new MutationObserver(scheduleRegionUpdate);
  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ["data-open", "data-visible", "style"],
  });
  window.addEventListener("resize", scheduleRegionUpdate);
  window.addEventListener("load", scheduleRegionUpdate, { once: true });
  requestAnimationFrame(scheduleRegionUpdate);
})();
