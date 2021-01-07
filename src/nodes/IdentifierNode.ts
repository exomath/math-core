import { Node } from './Node';

const validNameTypes = ['string'];

export class IdentifierNode implements Node {
  public readonly class = 'IdentifierNode';

  constructor(public readonly name: string) {
    if (!validNameTypes.includes(typeof name)) {
      throw new TypeError(`IdentifierNode: "name" cannot be of type "${typeof name}", must be "${validNameTypes.join('"|"')}"`);
    }
  }

  public static new(name: string) {
    return Object.freeze(new IdentifierNode(name));
  }
}