import { Node } from '.';
import { hasType } from '../utils';

const TYPE = 'ParenthesesNode';

export class ParenthesesNode extends Node {
  public constructor(
    public readonly content: Node
  ) {
    super(TYPE);

    if (!Node.isNode(content)) {
      throw new TypeError(`${TYPE}: "content" must be of type *Node`);
    }
  }

  public static new(content: Node) {
    return Object.freeze(new ParenthesesNode(content));
  }

  public static isParenthesesNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}