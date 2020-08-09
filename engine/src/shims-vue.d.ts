declare module "*.vue" {
  import Vue from "vue";
  export default Vue;
}

declare module "perf-marks";

interface Window {
  ResizeObserver: ResizeObserver;
}
interface ResizeObserver {
  new (callback: ResizeObserverCallback): any;
  observe: (target: Element) => void;
  unobserve: (target: Element) => void;
  disconnect: () => void;
}
interface ResizeObserverCallback {
  (entries: ResizeObserverEntry[], observer: ResizeObserver): void;
}
interface ResizeObserverEntry {
  new (target: Element): any;
  readonly target: Element;
  readonly contentRect: DOMRectReadOnly;
}
