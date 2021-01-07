import { Node } from './Node';

const validValueTypes = ['boolean', 'number', 'string'];

export class LiteralNode implements Node {
  public readonly class = 'LiteralNode';

  constructor(public readonly value: boolean | number | string) {
    if (!validValueTypes.includes(typeof value)) {
      throw new TypeError(`LiteralNode: "value" cannot be of type "${typeof value}", must be "${validValueTypes.join('"|"')}"`);
    }
  }

  public static new(value: boolean | number | string) {
    return Object.freeze(new LiteralNode(value));
  }
}