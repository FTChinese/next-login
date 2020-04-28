import { FormWidget, InputOptions } from "./widget";
import { Attributes } from "./attributes";

export class TextInput implements FormWidget {

  readonly id: string;
  readonly name: string;

  readonly value?: string | number;

  private attrs: Attributes;

  constructor(opts: InputOptions) {
    this.id = opts.id;
    this.name = opts.name;
    this.value = opts.value;

    this.attrs = Attributes.fieldSharedAttrs(opts)
      .set("type", opts.type);

    switch (opts.type) {
      case "checkbox":
      case "radio":
        this.attrs.setClassNames("form-check-input");
        break;

      default:
        this.attrs.setClassNames("form-control");
        break;
    }

    if (opts.value) {
      this.attrs.set("value", `${opts.value}`);
    }

    if (opts.checked) {
      this.attrs.setBoolean("checked");
    }

    if (opts.max) {
      this.attrs.set("max", `${opts.max}`);
    }

    if (opts.min) {
      this.attrs.set("min", `${opts.min}`);
    }

    if (opts.pattern) {
      this.attrs.set("pattern", opts.pattern);
    }
  }

  render(): string {
    return `<input ${this.attrs.build()} />`
  }
}
