import { expect } from 'chai';
import { IdentifierNode } from '../../../../lib/nodes/IdentifierNode';

describe('IdentifierNode', () => {
  it('Should be a function', () => {
    expect(IdentifierNode).to.be.a('function');
  });

  describe('IdentifierNode instance', () => {
    it('Should be instantiated with "new" keyword', () => {
      const node = new IdentifierNode('a');

      expect(node).to.be.an('object');
    });

    it('Should be instantiated with "new" factory method', () => {
      const node = IdentifierNode.new('a');

      expect(node).to.be.an('object');
    });

    it('Should have property "class", which equals "IdentifierNode"', () => {
      const node = IdentifierNode.new('a');

      expect(node).to.have.own.property('class');
      expect(node.class).to.equal('IdentifierNode');
    });

    it('Should have property "name", which equals the first argument', () => {
      const firstArgument = 'a';

      const node = IdentifierNode.new(firstArgument);

      expect(node).to.have.own.property('name');
      expect(node.name).to.equal(firstArgument);
    });

    it('Should throw error with invalid argument(s)', () => {
      expect(() => IdentifierNode.new(1)).to.throw(TypeError);
    });
  });
});