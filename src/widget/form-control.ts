import { FormWidget, LabelOptions, ControlOptions, ControlType } from "./widget";
import { Element, InputElement } from "./element";
import { Attributes } from "./attributes";

class ControlDesc {
  readonly desc: string;

  constructor (desc: string) {
    this.desc = desc;
  }
  
  render(): string {
    return `<small class="form-text text-muted">${this.desc}</small>`;
  }
}

class ControlError {
  readonly msg: string;

  constructor (msg: string) {
    this.msg = msg;
  }

  render(): string {
    return `<div class="form-errortext">${this.msg}</div>` 
  }
}

function isCheck(controlType: ControlType): boolean {
  return (controlType === ControlType.Checkbox) || (controlType === ControlType.Radio);
}

export class FormControl {
  readonly wrapper: Element;
  // Determing containing div class names:
  // form-check for checkbox and radio,
  // form-group otherwise.
  readonly controlType: ControlType;
  // The field element like input, textarea, select.
  readonly field: InputElement;

  private suffixLabel = false;

  readonly label?: Element;
  private desc?: Element;
  private error?: Element
  
  constructor (opts: ControlOptions) {
    const isCheckOrRadio = isCheck(opts.controlType);

    this.wrapper = (new Element("div"))
      .withAttributes(
        (new Attributes())
          .setClassNames(`${isCheckOrRadio ? 'form-check' : 'form-group'}`)
      );

    if (opts.wrapperClass) {
      this.wrapper.attrs?.addClassName(opts.wrapperClass);
    }

    this.field = opts.field;

    if (opts.label) {
      this.label = (new Element("label"))
        .withText(opts.label.text)
        .withAttributes(
          (new Attributes())
            .set("for", opts.field.id)
            .setClassNames(`${isCheckOrRadio ? 'form-check-label' : 'form-label'}`)
        );
      this.suffixLabel = opts.label.suffix || false;
    }

    if (opts.desc) {
      this.setDesc(opts.desc);
    }

    if (opts.error) {
      this.setError(opts.error);
    }
  }

  setDesc(desc: string): FormControl {
    this.desc = (new Element("small"))
      .withAttributes(new Attributes()
        .setClassNames("form-text text-muted")
      )
      .withText(desc);

    return this;
  }

  setError(errMsg: string): FormControl {
    this.error = (new Element("div"))
      .withAttributes(new Attributes()
        .setClassNames("form-errortext")
      )
      .withText(errMsg);
    return this;
  }

  render(): string {
    if (this.label) {
      if (this.suffixLabel) {
        this.wrapper.appendChild(this.field);
        this.wrapper.appendChild(this.label)
      } else {
        this.wrapper.appendChild(this.label)
        this.wrapper.appendChild(this.field);
      }
    } else {
      this.wrapper.appendChild(this.field);
    }

    if (this.desc) {
      this.wrapper.appendChild(this.desc);
    }

    if (this.error) {
      this.wrapper.appendChild(this.error);
    }

    return this.wrapper.render();
  }
}
