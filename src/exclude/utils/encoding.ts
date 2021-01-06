const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeString (str: string): Uint8Array {
  return encoder.encode(str);
}

export function decodeString (bytes: Uint8Array): string {
  return decoder.decode(bytes);
}
