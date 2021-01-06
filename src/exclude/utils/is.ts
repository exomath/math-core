export function isArray (value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isBoolean (value: unknown): value is boolean {
  return typeof value === 'boolean' || value instanceof Boolean;
}

export function isInteger (value: unknown): boolean {
  return isNumber(value) && Number.isInteger(value);
}

export function isNaN (value: unknown): boolean {
  return isNumber(value) && Number.isNaN(value);
}

export function isNumber (value: unknown): value is number {
  return typeof value === 'number' || value instanceof Number;
}

export function isString (value: unknown): value is string {
  return typeof value === 'string' || value instanceof String;
}
