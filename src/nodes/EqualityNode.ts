import { Node } from './Node';

interface Internal {
  action: 'assign' | 'evaluate' | 'unknown';
}

const validActionTypes = ['string'];
const validActionValues = ['assign', 'evaluate', 'unknown'];

export class EqualityNode implements Node {
  public readonly class = 'EqualityNode';
  private readonly internal: Internal = {
    action: 'unknown'
  };

  constructor() {
    Object.defineProperty(this, 'action', {
      get() { return this.internal.action; },
      enumerable: true
    });
  }

  public reset() {
    this.internal.action = 'unknown';
  }

  public update(action: 'assign' | 'evaluate' | 'unknown') {
    if (!validActionTypes.includes(typeof action)) {
      throw new TypeError(`EqualityNode: "action" cannot be of type "${typeof action}", must be "${validActionTypes.join('" | "')}"`);
    }

    if (!validActionValues.includes(action)) {
      throw new TypeError(`EqualityNode: "action" cannot be "${action}", must be "${validActionValues.join('" | "')}"`);
    }

    this.internal.action = action;
  }

  public static new() {
    return Object.freeze(new EqualityNode());
  }
}