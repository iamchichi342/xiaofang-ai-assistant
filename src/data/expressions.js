(() => {
  const expressions = {
    neutral: {
      label: "中性",
      description: "保持完整的竖向胶囊眼，适合注视和等待。",
      duration: 0,
      eye: {
        left: { scaleX: 1, scaleY: 1, rotate: 0, x: 0, y: 0 },
        right: { scaleX: 1, scaleY: 1, rotate: 0, x: 0, y: 0 },
      },
      head: { roll: 0, pitch: 0 },
    },
    joy: {
      label: "喜悦",
      description: "双眼变成向上拱起的弧线，略微向中间靠拢，配合两次柔和弹跳。",
      duration: 1900,
      action: "bounce",
      eye: {
        left: { scaleX: 1, scaleY: 1, rotate: 4, x: 1, y: 2 },
        right: { scaleX: 1, scaleY: 1, rotate: -4, x: -1, y: 2 },
      },
      head: { roll: 0, pitch: -1 },
    },
    anger: {
      label: "愤怒",
      description: "双眼压窄并向内倾斜，快速左右震动一次。",
      duration: 1700,
      action: "shake",
      eye: {
        left: { scaleX: 1.08, scaleY: 0.72, rotate: 16, x: 1, y: -2 },
        right: { scaleX: 1.08, scaleY: 0.72, rotate: -16, x: -1, y: -2 },
      },
      head: { roll: 0, pitch: 2 },
    },
    sadness: {
      label: "悲伤",
      description: "双眼下移并向外侧倾斜，头部缓慢下沉后回正。",
      duration: 2200,
      action: "sigh",
      eye: {
        left: { scaleX: 1.12, scaleY: 0.6, rotate: -23, x: 0, y: 5 },
        right: { scaleX: 1.12, scaleY: 0.6, rotate: 23, x: 0, y: 5 },
      },
      head: { roll: 0, pitch: -5 },
    },
    excitement: {
      label: "兴奋",
      description: "双眼放大并拉开一点，连续弹跳三次。",
      duration: 2100,
      action: "celebrate",
      eye: {
        left: { scaleX: 1.18, scaleY: 1.22, rotate: -3, x: -2, y: -1 },
        right: { scaleX: 1.18, scaleY: 1.22, rotate: 3, x: 2, y: -1 },
      },
      head: { roll: 0, pitch: 1 },
    },
    surprise: {
      label: "惊讶",
      description: "双眼突然放大、略微分开，并产生一次快速弹出。",
      duration: 1350,
      action: "pop",
      eye: {
        left: { scaleX: 1.28, scaleY: 1.3, rotate: 0, x: -2, y: -2 },
        right: { scaleX: 1.28, scaleY: 1.3, rotate: 0, x: 2, y: -2 },
      },
      head: { roll: 0, pitch: 2 },
    },
    curious: {
      label: "好奇",
      description: "一只眼轻微眯起，头部偏向一侧持续观察。",
      duration: 2100,
      action: "peek",
      eye: {
        left: { scaleX: 1.08, scaleY: 0.58, rotate: -5, x: 0, y: 1 },
        right: { scaleX: 1, scaleY: 1.08, rotate: 2, x: 0, y: -1 },
      },
      head: { roll: -7, pitch: 0 },
    },
    sleepy: {
      label: "困倦",
      description: "双眼压成低矮细条并下移，随后进行一次慢眨眼。",
      duration: 2600,
      action: "sigh",
      eye: {
        left: { scaleX: 1.25, scaleY: 0.28, rotate: -2, x: 0, y: 5 },
        right: { scaleX: 1.25, scaleY: 0.28, rotate: 2, x: 0, y: 5 },
      },
      head: { roll: 2, pitch: -4 },
    },
  };

  window.AssistantExpressions = expressions;
})();
