/*
 * 简易性能埋点：首屏加载、交互延迟与 FPS 采样。
 * 若 Tauri 事件可用，则向 MCP/后端上报；否则退化为 console 日志。
 */

type PerfPayload = {
  type: 'fcp' | 'tti' | 'fps';
  value: number;
};

const safeEmit = async (payload: PerfPayload) => {
  try {
    const api = await import('@tauri-apps/api/event');
    await api.emit('perf-metrics', payload);
  } catch {
    // 非 Tauri 环境或未启用事件时，静默降级
    if (import.meta.env.DEV) {
      console.info('[perf]', payload);
    }
  }
};

export const startPerfProbes = () => {
  // 首屏时间（DOMContentLoaded 到 now）
  if (performance.timing?.domContentLoadedEventEnd) {
    const fcp = performance.now();
    safeEmit({ type: 'fcp', value: fcp });
  }

  // 简易交互就绪时间：next tick
  queueMicrotask(() => {
    const tti = performance.now();
    safeEmit({ type: 'tti', value: tti });
  });

  // FPS 采样（1s 窗口）
  let frames = 0;
  let last = performance.now();
  const loop = (ts: number) => {
    frames += 1;
    if (ts - last >= 1000) {
      const fps = Math.round((frames * 1000) / (ts - last));
      safeEmit({ type: 'fps', value: fps });
      frames = 0;
      last = ts;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};
