type Listener = () => void;

interface ConfirmState {
  open: boolean;
  message: string;
  resolve: ((v: boolean) => void) | null;
}

let _state: ConfirmState = { open: false, message: '', resolve: null };
const _listeners = new Set<Listener>();

export function getConfirmState(): Readonly<ConfirmState> {
  return _state;
}

export function subscribeConfirm(fn: Listener): () => void {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}

export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    _state = { open: true, message, resolve };
    _listeners.forEach((fn) => fn());
  });
}

export function resolveConfirm(value: boolean): void {
  const { resolve } = _state;
  _state = { open: false, message: '', resolve: null };
  _listeners.forEach((fn) => fn());
  resolve?.(value);
}
