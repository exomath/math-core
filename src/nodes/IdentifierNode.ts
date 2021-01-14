import { Node } from '.';
import { assert, hasType, isString } from '..';

const TYPE = 'IdentifierNode';

export class IdentifierNode extends Node {
  private constructor(
    public readonly identifier: string
  ) {
    super(TYPE);

    assert(isString(identifier), () => {
      return '"identifier" must be of type string';
    }, TYPE);
  }

  public static new(identifier: string) {
    return Object.freeze(new IdentifierNode(identifier));
  }

  public static isIdentifierNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}