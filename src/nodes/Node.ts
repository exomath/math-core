import { hasOwnProperty, isArray } from '../utils';

export abstract class Node {
  public constructor(public readonly type: string) {}

  public static isNode(value: any): boolean {
    // Returns true for all *Node (e.g., LiteralNode, IdentifierNode, etc.)
    return hasOwnProperty(value, 'type') && value.type.endsWith('Node');
  }

  public static isNodeArray(value: any): boolean {
    return isArray(value) && value.every((item: any) => Node.isNode(item));
  }
}