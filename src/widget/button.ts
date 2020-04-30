import { Element } from "./element";

type BtnType = "button" | "submit";
type BtnStyle = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark" | "link";
type BtnSize = "sm" | "lg" | "block";

/**
 * @description Build a button's appearance.
 * Using Bootstrap class: btn btn-primary/btn-outline-primary btn-block
 */
export class Button extends Element {

  private style?: BtnStyle;
  private size?: BtnSize;
  private outline?: boolean;

  constructor() {
    super("button");
    this.setAttribute("type", "submit");
    this.addClass("btn");
  }

  setName(s: string): Button {
    this.textContent = s;
    return this;
  }

  setDisableWith(s: string): Button {
    this.setAttribute("data-disable-with", s);
    return this;
  }

  setType(t: BtnType): Button {
    this.setAttribute("type", t);
    return this;
  }

  setStyle(s: BtnStyle): Button {
    this.style = s;
    return this;
  }

  setSize(s: BtnSize): Button {
    this.size = s;
    return this;
  }

  setBlock(): Button {
    this.size = "block";
    return this;
  }

  render(): string {
    
    // A string like: btn-outline-primary or btn-primary
    if (this.style) {
      this.addClass(`btn${this.outline ? '-outline' : '-'}${this.style}`)
    }

    // A string like btn-block
    if (this.size) {
      this.addClass(`btn-${this.size}`);
    }

    return super.render();
  }

  static primary(): Button {
    return new Button()
      .setStyle("primary")
  }

  static secondary(): Button {
    return new Button()
      .setStyle("secondary");
  }

  /**
   * <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
   */
  static dismiss(): Button {
    const b = new Button()
      .setType("button");
    
    b.addClass("close")
      .setAttribute("data-disimiss", "alert")
      .setAttribute("aria-label", "Close")
      .appendChild(
        (new Element("span"))
          .setAttribute("aria-hidden", "true")
          .withText("&times;")
      );
    
    return b;
  }
}
