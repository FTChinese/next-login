import { Attributes } from "./attributes";
import { FormWidget, FieldSharedAttrs } from "./widget";

export interface TextAreaOptions extends FieldSharedAttrs {
  cols?: number;
  rows?: number;
  wrap?: "hard" | "soft";

  value?: string;
}

export class TextArea implements FormWidget {

  readonly id: string;
  readonly name: string;
  readonly value?: string;

  private attrs: Attributes;
  
  constructor(opts: TextAreaOptions) {
    this.id = opts.id;
    this.name = opts.name;
    this.value = opts.value;

    this.attrs = Attributes.formField(opts);

    if (opts.cols) {
      this.attrs.set("cols", `${opts.cols}`);
    }

    if (opts.rows) {
      this.attrs.set("rows", `${opts.rows}`);
    }

    if (opts.wrap) {
      this.attrs.set("wrap", `${opts.wrap}`);
    }
  }

  render(): string {
    return `<textarea class="form-control" ${this.attrs.build()}>${this.value ? this.value : ""}</textarea>`;
  }
}
