import { ValidationError } from "@hapi/joi";

export abstract class DataBuilder<T> {
  errors: Map<string, string> = new Map(); // Hold validator error for each form field. Key is field's name attribute.
  flashMsg?: string; // Hold message for API non-422 error.
  data: T;

  constructor(data: T) {
    this.data = data;
  }

  abstract async validate(): Promise<boolean>

  reduceJoiErrors(e: ValidationError) {
    for (const item of e.details) {
      const key = item.path.join("_");
      this.errors.set(key, item.message);
    }
  }
}
