import {
    object,
    string,
    ref,
    ValidationErrorItem,
    array,
} from "@hapi/joi"

export function buildJoiErrors(details: ValidationErrorItem[]): object {
    const errors: {[index: string]: string} = {};
    
    for (const item of details) {
        const key = item.path.join("_");
        errors[key] = item.message;
    }

    return errors;
}
