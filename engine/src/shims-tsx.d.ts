import Vue, { VNode } from "vue";

declare global {
  /*   namespace JSX {
    // tslint:disable no-empty-interface
    interface Element extends VNode {}
    // tslint:disable no-empty-interface
    interface ElementClass extends Vue {}
    interface IntrinsicElements {
      [elem: string]: any;
    } */

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
}
