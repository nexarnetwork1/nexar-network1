type RefreshListener = () => void;

const listeners = new Set<RefreshListener>();

export function notifyPresaleRefresh() {
  listeners.forEach((listener) => listener());
}

export function subscribePresaleRefresh(listener: RefreshListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
