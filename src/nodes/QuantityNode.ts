import { Node, ResultNode, TensorNode } from '.';
import { hasType, isString } from '..';

const TYPE = 'QuantityNode';

export class QuantityNode extends Node {
  private constructor(
    public readonly value: TensorNode | ResultNode,
    public readonly unit: string
  ) {
    super(TYPE);

    if (!(TensorNode.isTensorNode(value) || ResultNode.isResultNode(value))) {
      throw new TypeError(`${TYPE}: "value" must be of type TensorNode | ResultNode`);
    }

    if (!isString(unit)) {
      throw new TypeError(`${TYPE}: "unit" must be of type string`);
    }
  }

  public static new(value: TensorNode | ResultNode, unit: string) {
    return Object.freeze(new QuantityNode(value, unit));
  }

  public static isQuantityNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}