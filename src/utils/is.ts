export function isArray(value: any): boolean {
  return Array.isArray(value);
}

export function isBoolean(value: any): boolean {
  return typeof value === 'boolean' || value instanceof Boolean;
}

export function isInteger(value: any): boolean {
  return isNumber(value) && Number.isInteger(value);
}

export function isIntegerArray(value: any): boolean {
  return isArray(value) && value.every((item: any) => isInteger(item));
}

export function isNaN(value: any): boolean {
  return isNumber(value) && Number.isNaN(value);
}

export function isNull(value: any): boolean {
  return value === null;
}

export function isObject(value: any): boolean {
  return typeof value === 'object';
}

export function isNumber(value: any): boolean {
  return typeof value === 'number' || value instanceof Number;
}

export function isNumberArray(value: any): boolean {
  return isArray(value) && value.every((item: any) => isNumber(item));
}

export function isString(value: any): boolean {
  return typeof value === 'string' || value instanceof String;
}