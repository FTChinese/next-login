class Spinner {
  private spinnerEl: HTMLElement;

  constructor() {
    this.spinnerEl = document.querySelector<HTMLElement>(".global-spinner .spinner-border");
  }

  show() {
    if (!this.spinnerEl) {
      return;
    }
    this.spinnerEl.setAttribute("aria-hidden", "false")
  }

  hide() {
    if (!this.spinnerEl) {
      return;
    }
    this.spinnerEl.setAttribute("aria-hidden", "true");
  }

  static init() {
    const inst = new Spinner();

    window.addEventListener("load", () => {
      inst.show();
    });

    return inst;
  }
}
