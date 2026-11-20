(() => {
function createAssistantState() {
  return {
    pointer: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      hasMoved: false,
    },
    gaze: {
      active: false,
      x: 0,
      y: 0,
    },
    position: {
      x: 0,
      y: 0,
    },
    drag: {
      active: false,
      pointerId: null,
      offsetX: 0,
      offsetY: 0,
      distance: 0,
      lastX: 0,
      lastY: 0,
    },
    motion: {
      eyeX: 0,
      eyeY: 0,
      eyeScaleX: 1,
      eyeScaleY: 1,
      yaw: 0,
      pitch: 0,
      roll: 0,
      faceShiftX: 0,
      faceScaleX: 1,
      pressDepth: 0,
    },
    interaction: {
      pressed: false,
      speaking: false,
      bubbleTimer: null,
      lastPointerMoveAt: performance.now(),
    },
    idle: {
      automatic: false,
      manual: false,
      manualUntil: 0,
    },
    expression: {
      name: "neutral",
      headRoll: 0,
      headPitch: 0,
    },
  };
}

window.AssistantState = {
  createAssistantState,
};
})();
