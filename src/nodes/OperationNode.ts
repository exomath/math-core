import { Node } from './Node';

const validOperatorTypes = ['string'];

export class OperationNode implements Node {
  public readonly class = 'OperationNode';

  constructor(public readonly operator: string, public readonly operands: Node[]) {
    if (!validOperatorTypes.includes(typeof operator)) {
      throw new TypeError(`OperationNode: "operator" cannot be of type "${typeof operator}", must be "${validOperatorTypes.join('"|"')}"`);
    }

    if (!(Array.isArray(operands) && operands.every(operand => operand.hasOwnProperty('class') && operand.class.endsWith('Node')))) {
      throw new TypeError('OperationNode: "operands" must be an Array with items of class "Node"');
    }
  }

  public get arity() {
    return this.operands.length;
  }

  public static new(operator: string, operands: Node[]) {
    return Object.freeze(new OperationNode(operator, operands));
  }
}