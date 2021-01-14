import { Node } from '.';
import { assert, hasType, isBoolean, isNumber, isString } from '..';

const TYPE = 'LiteralNode';

export class LiteralNode extends Node {
  private constructor(
    public readonly value: boolean | number | string
  ) {
    super(TYPE);

    assert(isBoolean(value) || isNumber(value) || isString(value), () => {
      return '"value" must be of type boolean | number | string';
    }, TYPE);
  }

  public static new(value: boolean | number | string) {
    return Object.freeze(new LiteralNode(value));
  }

  public static isLiteralNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}