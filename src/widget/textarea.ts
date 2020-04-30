import { FieldSharedAttrs } from "./widget";
import { InputElement } from "./element";

export interface TextAreaOptions extends FieldSharedAttrs {
  cols?: number;
  rows?: number;
  wrap?: "hard" | "soft";

  value?: string;
}

export class TextArea extends InputElement {

  constructor(opts: TextAreaOptions) {
    super("textarea");

    this.id = opts.id;
    this.name = opts.name;
    
    if (opts.value) {
      this.textContent = opts.value;
    }

    this.addSharedAttributes(opts);

    if (opts.cols) {
      this.setAttribute("cols", `${opts.cols}`);
    }

    if (opts.rows) {
      this.setAttribute("rows", `${opts.rows}`);
    }

    if (opts.wrap) {
      this.setAttribute("wrap", `${opts.wrap}`);
    }
  }
}
