import { expect } from 'chai';
import { LiteralNode } from '../../../../lib/nodes/LiteralNode';
import { OperationNode } from '../../../../lib/nodes/OperationNode';

describe('OperationNode', () => {
  it('Should be a function', () => {
    expect(OperationNode).to.be.a('function');
  });

  describe('OperationNode instance', () => {
    it('Should be instantiated with "new" keyword', () => {
      const node = new OperationNode('+', [LiteralNode.new(1), LiteralNode.new(1)]);

      expect(node).to.be.an('object');
    });

    it('Should be instantiated with "new" factory method', () => {
      const node = OperationNode.new('+', [LiteralNode.new(1), LiteralNode.new(1)]);

      expect(node).to.be.an('object');
    });

    it('Should have property "type", which equals "OperationNode"', () => {
      const node = OperationNode.new('+', [LiteralNode.new(1), LiteralNode.new(1)]);

      expect(node).to.have.own.property('type');
      expect(node.type).to.equal('OperationNode');
    });

    it('Should have property "operator", which equals the first argument', () => {
      const operator = '+';
      const node = OperationNode.new(operator, [LiteralNode.new(1), LiteralNode.new(1)]);

      expect(node).to.have.own.property('operator');
      expect(node.operator).to.equal(operator);
    });

    it('Should have property "operands", which equals the second argument', () => {
      const operands = [LiteralNode.new(1), LiteralNode.new(1)];
      const node = OperationNode.new('+', operands);

      expect(node).to.have.own.property('operands');
      expect(node.operands).to.deep.equal(operands);
    });

    it('Should throw error with invalid argument(s)', () => {
      expect(() => OperationNode.new(1, [LiteralNode.new(1), LiteralNode.new(1)])).to.throw(TypeError);
      expect(() => OperationNode.new('+', 1)).to.throw(TypeError);
    });
  });
});