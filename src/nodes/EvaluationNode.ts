import { Node, QuantityNode, ResultNode } from '.';
import { assert, hasType } from '..';

const TYPE = 'EvaluationNode';

export class EvaluationNode extends Node {
  private constructor(
    public readonly expression: Node,
    public readonly result: Node
  ) {
    super(TYPE);

    assert(Node.isNode(expression), '"expression" must be of type *Node', TYPE);

    if (!ResultNode.isResultNode(result) && QuantityNode.isQuantityNode(result)) {
      assert(
        ResultNode.isResultNode((result as QuantityNode).value),
        'If "result" is of type QuanityNode, it must have "value" of type ResultNode',
        TYPE
      );
    }
  }

  public static new(expression: Node, result: Node) {
    return Object.freeze(new EvaluationNode(expression, result));
  }

  public static isEvaluationNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}