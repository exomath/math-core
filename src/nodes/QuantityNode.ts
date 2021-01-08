import { Node, ResultContainer, TensorNode } from './';
import { hasType, isString } from '../utils';

const TYPE = 'QuantityNode';

export class QuantityNode extends Node implements ResultContainer {
  public constructor(
    public readonly value: TensorNode,
    public readonly unit: string,
    public readonly containsResult = false
  ) {
    super(TYPE);

    if (!TensorNode.isTensorNode(value)) {
      throw new TypeError(`${TYPE}: "value" must be of type TensorNode`);
    }

    if (!isString(unit)) {
      throw new TypeError(`${TYPE}: "unit" must be of type string`);
    }
  }

  public static new(value: TensorNode, unit: string) {
    return Object.freeze(new QuantityNode(value, unit));
  }

  public static isQuantityNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}