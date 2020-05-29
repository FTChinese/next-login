import { ControlOptions, ControlType } from "./widget";
import { Element, InputElement } from "./element";

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
    this.controlType = opts.controlType;
    this.field = opts.field;

    const isCheckOrRadio = isCheck(opts.controlType);
    
    this.wrapper = (new Element("div"))
      .addClass(isCheckOrRadio
        ? "form-check"
        : "form-group");
      
    if (opts.extraWrapperClass) {
      this.wrapper.addClass(opts.extraWrapperClass);
    }

    if (opts.label) {
      this.label = (new Element("label"))
        .withText(opts.label.text)
        .setAttribute("for", opts.field.id)
        .addClass(isCheckOrRadio 
          ? 'form-check-label' 
          : 'form-label');

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
      .addClass("form-text text-muted")
      .withText(desc);

    return this;
  }

  setError(errMsg: string): FormControl {
    this.error = (new Element("div"))
      .addClass("form-errortext")
      .withText(errMsg);
    return this;
  }

  render(): string {

    if (this.label) {
      if (this.suffixLabel) {
        this.wrapper
          .appendChild(this.field)
          .appendChild(this.label)
      } else {
        this.wrapper
          .appendChild(this.label)
          .appendChild(this.field);
      }
    } else {
      this.wrapper.appendChild(this.field)
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
