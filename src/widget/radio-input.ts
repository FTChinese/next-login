import { InputElement } from "./element";
import { RadioInputOptions, CheckboxInputOptions } from "./widget";

export class RadioInputElement extends InputElement {
  constructor(opts: RadioInputOptions) {
    super("input");

    this.id = opts.id;
    this.name = opts.name;

    this.addSharedAttributes(opts);
    this.setAttribute("type", "radio");
    this.setAttribute("value", opts.value);
    this.addClass("form-check-input");

    if (opts.checked) {
      this.setAttribute("checked", "");
    }
  }
}

export class CheckboxInputElement extends InputElement {
  constructor(opts: CheckboxInputOptions) {
    super("input");
    this.id = opts.id;
    this.name = opts.name;

    this.addSharedAttributes(opts);
    this.setAttribute("type", "checkbox");
    this.setAttribute("value", "true");
    this.addClass("form-check-input");

    if (opts.checked) {
      this.setAttribute("checked", "");
    }
  }
}
