import { Node, IdentifierNode } from '.';
import { assert, hasType } from '..';

const TYPE = 'FunctionNode';

export class FunctionNode extends Node {
  private constructor(
    public readonly fn: IdentifierNode,
    public readonly args: Node[]
  ) {
    super(TYPE);

    assert(IdentifierNode.isIdentifierNode(fn), '"fn" must be of type IdentifierNode', TYPE);
    assert(Node.isNodeArray(args), '"args" must be of type *Node[]', TYPE);

    Object.defineProperty(this, 'arity', {
      get: () => { return this.args.length; },
      enumerable: true
    });
  }

  public static new(fn: IdentifierNode, args: Node[]) {
    return Object.freeze(new FunctionNode(fn, args));
  }

  public static isFunctionNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}