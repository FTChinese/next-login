type FlashKind = "success" | "danger";

const dismisBtn = `
<button type="button" class="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
</button>`;

export class Flash {
    message: string = "";
    kind: FlashKind;
    dismissible: boolean = true;

    constructor(msg: string) {
        this.message = msg;
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

    static danger(msg: string): Flash {
        return new Flash(msg).setDanger();
    }

    static success(msg: string): Flash {
        return new Flash(msg).setSuccess();
    }
}
