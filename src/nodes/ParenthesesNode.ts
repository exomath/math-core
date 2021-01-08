import { Node } from './';

export class ParenthesesNode implements Node {
  readonly class = 'ParenthesesNode';

  constructor(public readonly content: Node) {
    if (!(typeof content === 'object' && content.hasOwnProperty('class') && content.class.endsWith('Node'))) {
      throw new TypeError('ParenthesesNode: "content" must be of class "Node"');
    }
  }

  public static new(content: Node) {
    return Object.freeze(new ParenthesesNode(content));
  }
}