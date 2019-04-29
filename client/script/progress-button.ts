class ProgressButton {
  readonly btnElm: HTMLButtonElement;

  constructor(formEl: HTMLFormElement) {
    this.btnElm = formEl.querySelector<HTMLButtonElement>(`button[type="submit"]`);

    formEl.addEventListener("submit", event => this.onSumbmit(event));
  }

  onSumbmit(event: Event) {
    const attrName = "data-disable-with";
    if (this.btnElm.hasAttribute(attrName)) {
      this.btnElm.textContent = this.btnElm.getAttribute(attrName);
    } else {
      const spinnerElm = this.btnElm.querySelector(".spinner-border");
      if (spinnerElm) {
        spinnerElm.setAttribute("aria-hidden", "false");
      }
    }
    
    if (this.btnElm instanceof HTMLButtonElement) {
      this.btnElm.disabled = true;
    }
  }

  static init(): ProgressButton[] {
    const instances: ProgressButton[] = [];

    const forms = document.forms;

    for (let i = 0; i < forms.length; i++) {
      instances.push(new ProgressButton(forms[i]));
    }

    return instances;
  }
}

export default ProgressButton;
