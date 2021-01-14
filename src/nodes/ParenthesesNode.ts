import { Node } from '.';
import { assert, hasType } from '..';

const TYPE = 'ParenthesesNode';

export class ParenthesesNode extends Node {
  private constructor(
    public readonly content: Node
  ) {
    super(TYPE);

    assert(Node.isNode(content), '"content" must be of type *Node', TYPE);
  }

  public static new(content: Node) {
    return Object.freeze(new ParenthesesNode(content));
  }

  public static isParenthesesNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}