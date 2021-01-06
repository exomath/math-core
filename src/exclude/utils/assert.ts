export function assert(expression: boolean, message: () => string) {
  if (!expression) {
    throw new Error(typeof message === 'string' ? message : message());
  }
}
