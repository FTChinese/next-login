import { throws } from "assert";

class Spinner {
  private rootEl: HTMLElement;

  constructor(rootEl: HTMLElement) {
    this.rootEl = rootEl;
  }

  show() {
    this.rootEl.classList.remove("hide");
    this.rootEl.classList.add("show");
  }

  hide() {
    this.rootEl.classList.remove("show");
    this.rootEl.classList.add("hide");
  }
}
