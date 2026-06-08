// Web Worker timer — not throttled when the tab is hidden.
// Posts a "tick" message at the requested interval so the main
// thread can run emotion detection even when the tab is backgrounded.
let timerId = null;

self.onmessage = (e) => {
  const { type, interval } = e.data || {};
  if (type === "start") {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      self.postMessage({ type: "tick", at: Date.now() });
    }, interval || 3000);
  } else if (type === "stop") {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }
};
