class ProgressButton {
  private btnElm: HTMLButtonElement;

  constructor(formEl: HTMLFormElement) {
    this.btnElm = formEl.querySelector<HTMLButtonElement>(`button[data-disable-with]`);

    formEl.addEventListener("submit", event => this.onSumbmit(event));
  }

  onSumbmit(event: Event) {

    const disableText = this.btnElm.getAttribute("data-disable-with");
    
    this.btnElm.textContent = disableText;

    if (this.btnElm instanceof HTMLButtonElement) {
      this.btnElm.disabled = true;
    }
  }

  static init() {
    const instances: ProgressButton[] = [];

    const forms = document.forms;
    
    // const btnEls = el.querySelectorAll<HTMLElement>("[data-disable-with]");

    for (let i = 0; i < forms.length; i++) {
      instances.push(new ProgressButton(forms[i]));
    }
  }
}

export default ProgressButton;
