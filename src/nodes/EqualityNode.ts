import { Node } from './Node';

const validActionTypes = ['string'];
const validActionValues = ['assign', 'evaluate', 'unknown'];

export class EqualityNode implements Node {
  public readonly class = 'EqualityNode';
  private _action: string = 'unknown';

  constructor() {}

  public get action(): string {
    return this._action;
  }

  public reset() {
    this._action = 'unknown';
  }

  public update(action: string) {
    if (!validActionTypes.includes(typeof action)) {
      throw new TypeError(`EqualityNode: "action" cannot be of type "${typeof action}", must be "${validActionTypes.join('"|"')}"`);
    }

    if (!validActionValues.includes(action)) {
      throw new TypeError(`EqualityNode: "action" cannot be "${action}", must be "${validActionValues.join('"|"')}"`);
    }

    this._action = action;
  }

  public static new() {
    return Object.freeze(new EqualityNode());
  }
}