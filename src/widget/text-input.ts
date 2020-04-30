import { TextInputOptions } from "./widget";
import { InputElement } from "./element";

export class TextInputElement extends InputElement {

  readonly value?: string | number;

  constructor(opts: TextInputOptions) {
    super("input");
    this.withSeflClosing();

    this.id = opts.id;
    this.name = opts.name;
    this.value = opts.value;

    this.addClass("form-control");
    // Add all shared attributes of any field.
    this.addSharedAttributes(opts);
    this.setAttribute("type", opts.type)
    
    if (opts.value) {
      this.setAttribute("value", `${opts.value}`);
    }

    if (opts.max) {
      this.setAttribute("max", `${opts.max}`);
    }

    if (opts.min) {
      this.setAttribute("min", `${opts.min}`);
    }

    if (opts.pattern) {
      this.setAttribute("pattern", opts.pattern);
    }
  }
}
