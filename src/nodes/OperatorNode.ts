import { Node } from './';

const validOperatorTypes = ['string'];

export class OperatorNode implements Node {
  public readonly class = 'OperatorNode';

  constructor(public readonly operator: string, public readonly operands: Node[]) {
    if (!validOperatorTypes.includes(typeof operator)) {
      throw new TypeError(`OperatorNode: "operator" cannot be of type "${typeof operator}", must be "${validOperatorTypes.join('" | "')}"`);
    }

    if (!(Array.isArray(operands) && operands.every(operand => operand.hasOwnProperty('class') && operand.class.endsWith('Node')))) {
      throw new TypeError('OperatorNode: "operands" must be an Array with items of class "Node"');
    }

    Object.defineProperty(this, 'arity', {
      get: () => { return this.operands.length; },
      enumerable: true
    });
  }

  public static new(operator: string, operands: Node[]) {
    return Object.freeze(new OperatorNode(operator, operands));
  }
}