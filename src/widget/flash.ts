import { Element } from "./element";
import { Button } from "./button";

type FlashKind = "success" | "danger";

export class Flash extends Element{
    message: string = "";
    kind: FlashKind;
    dismissible: boolean = true;

    constructor(msg: string) {
      super("div");
      this.message = msg;
      this
        .setAttribute("role", "alert")
        .appendChild((new Element("span")).withText(msg));
    }

    setSuccess(): Flash {
        this.kind = "success";
        return this;
    }

    setDanger(): Flash {
        this.kind = "danger";
        return this;
    }

    setDismissible(dismiss: boolean): Flash {
        this.dismissible = dismiss;
        
        return this;
    }

    render(): string {
      
      this
        .addClass("alert")
        .addClass(`alert-${this.kind}`);

      if (this.dismissible) {
        this.addClass("alert-dismissible");
        this.appendChild(Flash.dismissBtn());
      }

      this.addClass("fade show mt-3");

      return super.render();
    }

    static danger(msg: string): Flash {
        return new Flash(msg).setDanger();
    }

    static success(msg: string): Flash {
        return new Flash(msg).setSuccess();
    }

    /**
     * <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
    */
    static dismissBtn(): Element {
      return (new Element("button"))
        .addClass("close")
        .setAttribute("type", "button")
        .setAttribute("data-dismiss", "alert")
        .setAttribute("aria-label", "Close")
        .appendChild(
          (new Element("span"))
            .setAttribute("aria-hidden", "true")
            .withText("&times;")
        );
    }
}
