import { Node } from '.';
import { assert, hasType, isString } from '..';

const TYPE = 'OperatorNode';

export class OperatorNode extends Node {
  private constructor(
    public readonly operator: string,
    public readonly operands: Node[]
  ) {
    super(TYPE);

    assert(isString(operator), '"operator" must be of type string', TYPE);
    assert(Node.isNodeArray(operands), '"operands" must be of type *Node[]', TYPE);

    Object.defineProperty(this, 'arity', {
      get: () => { return this.operands.length; },
      enumerable: true
    });
  }

  public static new(operator: string, operands: Node[]) {
    return Object.freeze(new OperatorNode(operator, operands));
  }

  public static isOperatorNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}