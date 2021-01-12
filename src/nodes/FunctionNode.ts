import { Node, IdentifierNode } from '.';
import { hasType } from '../utils';

const TYPE = 'FunctionNode';

export class FunctionNode extends Node {
  public constructor(
    public readonly fn: IdentifierNode,
    public readonly args: Node[]
  ) {
    super(TYPE);

    if (!IdentifierNode.isIdentifierNode(fn)) {
      throw new TypeError(`${TYPE}: "fn" must be of type IdentifierNode`);
    }

    if (!Node.isNodeArray(args)) {
      throw new TypeError(`${TYPE}: "args" must be of type *Node[]`);
    }

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