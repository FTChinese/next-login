interface FieldAttributes {
    id: string;
    type: "hidden" | "text" | "email" | "password" | "url" | "number" | "search" | "month" | "date" | "week" | "tel" | "image" | "file";
    name: string;
    value?: any;
    placeholder?: string;
    required?: boolean;
    readonly?: boolean;
    checked?: boolean;
    minlength?: number;
    maxlength?: number;
    pattern?: string;
}

export interface FormControl {
    label?: string;
    attrs: FieldAttributes;
    desc?: string;
    error?: string;
}
