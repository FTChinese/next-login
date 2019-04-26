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

  static init() {
    const container = document.querySelector(".global-spinner");
    if (!container) {
      return;
    }

    const spinner = container.querySelector<HTMLElement>("spinner-border");

    if (!spinner) {
      return;
    }

    const inst = new Spinner(spinner);

    window.addEventListener("load", () => {
      inst.show();
    });

    return inst;
  }
}
