import { Node } from '.';
import { hasType, isString } from '..';

const TYPE = 'OperatorNode';

export class OperatorNode extends Node {
  private constructor(
    public readonly operator: string,
    public readonly operands: Node[]
  ) {
    super(TYPE);

    if (!isString(operator)) {
      throw new TypeError(`${TYPE}: "operator" must be of type string`);
    }

    if (!Node.isNodeArray(operands)) {
      throw new TypeError(`${TYPE}: "operands" must be of type *Node[]`);
    }

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