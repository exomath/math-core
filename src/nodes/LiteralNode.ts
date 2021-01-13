import { Node } from '.';
import { hasType, isBoolean, isNumber, isString } from '..';

const TYPE = 'LiteralNode';

export class LiteralNode extends Node {
  private constructor(
    public readonly value: boolean | number | string
  ) {
    super(TYPE);

    if (!(isBoolean(value) || isNumber(value) || isString(value))) {
      throw new TypeError(`${TYPE}: "value" must be of type boolean | number | string`);
    }
  }

  public static new(value: boolean | number | string) {
    return Object.freeze(new LiteralNode(value));
  }

  public static isLiteralNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}