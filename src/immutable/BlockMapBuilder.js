const Immutable = require('immutable');

const { OrderedMap } = Immutable;

const BlockMapBuilder = {
  createFromArray(blocks) {
    return OrderedMap(blocks.map(block => [block.getKey(), block]));
  },
};

module.exports = BlockMapBuilder;
