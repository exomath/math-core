import { Node, QuantityNode, ResultNode } from '.';
import { hasType } from '..';

const TYPE = 'EvaluationNode';

export class EvaluationNode extends Node {
  private constructor(
    public readonly expression: Node,
    public readonly result: Node
  ) {
    super(TYPE);

    if (!Node.isNode(expression)) {
      throw new TypeError(`${TYPE}: "expression" must be of type *Node`);
    }

    const { isQuantityNode } = QuantityNode;
    const { isResultNode } = ResultNode;

    if (!isResultNode(result)) {
      if (isQuantityNode(result) && !isResultNode((result as QuantityNode).value)) {
        throw new TypeError(`${TYPE}: if "result" is of type QuanityNode, it must have "value" of type ResultNode`);
      }
    }
  }

  public static new(expression: Node, result: Node) {
    return Object.freeze(new EvaluationNode(expression, result));
  }

  public static isEvaluationNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}