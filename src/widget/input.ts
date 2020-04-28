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

    this.attrs = Attributes.formField(opts);
    this.attrs.set("type", opts.type);

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
    return `<input class="form-control" ${this.attrs.build()} />`
  }
}
