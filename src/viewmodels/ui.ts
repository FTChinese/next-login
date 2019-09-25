export const alerts = new Map([
    ["saved", "保存成功！"],
    ["password_saved", "密码修改成功"],
]);

export interface IDataList {
    id: string;
    options: Array<string>;
}

export interface ITextInput {
    label: string;
    id: string;
    type: string;
    name: string;
    value?: string | null;
    placeholder: string;
    required: boolean;
    readonly?: boolean;
    minlength?: string;
    maxlength?: string;
    desc?: string;
    error?: string | null;
    datalist?: IDataList;
}

export interface ICheckBoxInput {
    label: string;
    id: string;
    value: string;
    checked: boolean;
}

export interface ISelectOption {
    value: string;
    text: string;
    selected: boolean;
}

export interface IListItem {
    label: string;
    text: string;
    link?: string;
}

export interface IAnchor {
    href: string;
    text: string;
}
// UI components to show a raw error message as last resort if the error cannot be built programatically.
export interface IErrors {
    message: string;
}

// UI components to show a known error or alert message.
export interface IAlert {
    message: string;
    link?: IAnchor;
}

export interface IActionDone {
    message: string;
    link?: IAnchor;
}

export interface UIBase {
    errors?: IErrors;
    alert?: IAlert;
}
