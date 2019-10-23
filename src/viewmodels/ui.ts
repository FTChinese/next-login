export interface IDataList {
    id: string;
    options: Array<string>;
}

export interface ITextInput {
    label?: string;
    id?: string;
    type: string;
    name: string;
    value?: string | null;
    placeholder?: string;
    required?: boolean;
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

export interface ICheckBox {
    title?: string;
    name: string;
    items: Array<ICheckBoxInput>
    desc?: string;
    error?: string;
}

export interface IRadioInput {
    label: string;
    imageUrl?: string;
    gap?: number;
    id: string;
    value: string;
    checked: boolean;
}

export interface IRadio {
    title?: string;
    name: string;
    inputs: Array<IRadioInput>;
    required?: boolean;
    desc?: string;
    error?: string;
}

export interface ISelectOption {
    value: string;
    text: string;
    selected: boolean;
}

export interface ISubmitButton {
    disableWith?: string;
    text: string;
}

export interface IForm {
    disabled?: boolean;
    action?: string;
    inputs?: Array<ITextInput>;
    checkBoxes?: Array<ICheckBox>;
    radios?: Array<IRadio>;
    submitBtn?: ISubmitButton;
    cancelBtn?: IAnchor;
    deleteBtn?: IAnchor;
}

export interface IListItem {
    label: string;
    value?: string;
    link?: string;
    linkText?: string;
}

export interface ICard {
    header?: string;
    list: Array<IListItem>;
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

export interface UIForm extends UIBase {
    form: IForm;
}

export interface UISingleInput extends UIBase {
    heading?: string;
    input: ITextInput;
}

export interface UIMultiInputs extends UIBase {
    heading?: string;
    inputs: Array<ITextInput>;
}
