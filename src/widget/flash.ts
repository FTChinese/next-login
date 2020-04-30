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
      this.addClass("alert fade show mt-3")
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
      this.addClass(`alert-${this.kind}`);

      if (this.dismissible) {
        this.addClass("alert-dismissible");
        this.appendChild(Button.dismiss());
      }

      return super.render();
    }

    static danger(msg: string): Flash {
        return new Flash(msg).setDanger();
    }

    static success(msg: string): Flash {
        return new Flash(msg).setSuccess();
    }
}
