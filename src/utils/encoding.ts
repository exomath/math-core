import { assert, isUint8Array } from '.';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeString (str: string): Uint8Array {
  assert(typeof str === 'string', () => {
    return `encodeString: "str" must be of type string, got ${typeof str}`;
  });

  return encoder.encode(str);
}

export function decodeString (bytes: Uint8Array): string {
  assert(isUint8Array(bytes), () => {
    return `decodeString: "bytes" must be of type Uint8Array, got ${typeof bytes}`;
  });

  return decoder.decode(bytes);
}