/**
 * Non-blocking background work — never blocks the user request path.
 * Uses setImmediate on Node; falls back to microtask elsewhere.
 */

export function deferBackground(task: () => void | Promise<void>): void {
  const run = () => {
    void Promise.resolve()
      .then(task)
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("[background]", error);
        }
      });
  };

  if (typeof setImmediate === "function") {
    setImmediate(run);
  } else {
    queueMicrotask(run);
  }
}
