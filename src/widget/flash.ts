import { Attributes } from "./attributes";

type FlashKind = "success" | "danger";

const dismisBtn = `
<button type="button" class="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
</button>`;

export class Flash {
    message: string = "";
    kind: FlashKind;
    dismissible: boolean = true;
    readonly attrs: Attributes;

    constructor(msg: string) {
        this.message = msg;
        this.attrs = (new Attributes)
          .setClassNames("alert fade show mt-3")
          .set("role", "alert");
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

    private renderDismissible(): string {
      return `
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>`;
    }

    render(): string {
      this.attrs.addClassName(`alert-${this.kind}`);

      if (this.dismissible) {
        this.attrs.addClassName("alert-dismissible")
      }
      
      return `
      <div ${this.attrs.build()}>
        <span>${this.message}</span>
        ${this.dismissible ? this.renderDismissible() : ""}
      </div>`
    }
    static danger(msg: string): Flash {
        return new Flash(msg).setDanger();
    }

    static success(msg: string): Flash {
        return new Flash(msg).setSuccess();
    }
}
