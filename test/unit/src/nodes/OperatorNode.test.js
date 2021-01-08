import { expect } from 'chai';
import { LiteralNode } from '../../../../lib/nodes/LiteralNode';
import { OperatorNode } from '../../../../lib/nodes/OperatorNode';

describe('OperatorNode', () => {
  it('Should be a function', () => {
    expect(OperatorNode).to.be.a('function');
  });

  describe('OperatorNode instance', () => {
    it('Should be instantiated with "new" keyword', () => {
      const node = new OperatorNode('+', [LiteralNode.new(1), LiteralNode.new(1)]);

      expect(node).to.be.an('object');
    });

    it('Should be instantiated with "new" factory method', () => {
      const node = OperatorNode.new('+', [LiteralNode.new(1), LiteralNode.new(1)]);

      expect(node).to.be.an('object');
    });

    it('Should have property "type", which equals "OperatorNode"', () => {
      const node = OperatorNode.new('+', [LiteralNode.new(1), LiteralNode.new(1)]);

      expect(node).to.have.own.property('type');
      expect(node.type).to.equal('OperatorNode');
    });

    it('Should have property "operator", which equals the first argument', () => {
      const operator = '+';
      const node = OperatorNode.new(operator, [LiteralNode.new(1), LiteralNode.new(1)]);

      expect(node).to.have.own.property('operator');
      expect(node.operator).to.equal(operator);
    });

    it('Should have property "operands", which equals the second argument', () => {
      const operands = [LiteralNode.new(1), LiteralNode.new(1)];
      const node = OperatorNode.new('+', operands);

      expect(node).to.have.own.property('operands');
      expect(node.operands).to.deep.equal(operands);
    });

    it('Should throw error with invalid argument(s)', () => {
      expect(() => OperatorNode.new(1, [LiteralNode.new(1), LiteralNode.new(1)])).to.throw(TypeError);
      expect(() => OperatorNode.new('+', 1)).to.throw(TypeError);
    });
  });
});