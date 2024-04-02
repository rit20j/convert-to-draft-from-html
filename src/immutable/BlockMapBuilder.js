import Immutable from 'immutable';

const { OrderedMap } = Immutable;

const BlockMapBuilder = {
  createFromArray(blocks) {
    return OrderedMap(blocks.map(block => [block.getKey(), block]));
  },
};

export default BlockMapBuilder;
