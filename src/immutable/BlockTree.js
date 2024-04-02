const Immutable = require('immutable');
const findRangesImmutable = require("../utils/findRangesImmutable.js");
const getOwnObjectValues = require("../utils/getOwnObjectValues.js");

const { List, Repeat, Record } = Immutable;

const returnTrue = () => true;

const defaultLeafRange = {
  start: null,
  end: null,
};

const LeafRange = Record(defaultLeafRange);

const defaultDecoratorRange = {
  start: null,
  end: null,
  decoratorKey: null,
  leaves: null,
};

const DecoratorRange = Record(defaultDecoratorRange);

const BlockTree = {
  /**
   * Generate a block tree for a given ContentBlock/decorator pair.
   */
  generate(contentState, block, decorator) {
    const textLength = block.getLength();
    if (!textLength) {
      return List.of(
        new DecoratorRange({
          start: 0,
          end: 0,
          decoratorKey: null,
          leaves: List.of(new LeafRange({ start: 0, end: 0 })),
        })
      );
    }

    const leafSets = [];
    const decorations = decorator ? decorator.getDecorations(block, contentState) : List(Repeat(null, textLength));

    const chars = block.getCharacterList();

    findRangesImmutable(decorations, areEqual, returnTrue, (start, end) => {
      leafSets.push(
        new DecoratorRange({
          start,
          end,
          decoratorKey: decorations.get(start),
          leaves: generateLeaves(chars.slice(start, end).toList(), start),
        })
      );
    });

    return List(leafSets);
  },

  fromJS({ leaves, ...other }) {
    return new DecoratorRange({
      ...other,
      leaves:
        leaves != null
          ? List(Array.isArray(leaves) ? leaves : getOwnObjectValues(leaves)).map(leaf => LeafRange(leaf))
          : null,
    });
  },
};

/**
 * Generate LeafRange records for a given character list.
 */
function generateLeaves(characters, offset) {
  const leaves = [];
  const inlineStyles = characters.map(c => c.getStyle()).toList();
  findRangesImmutable(inlineStyles, areEqual, returnTrue, (start, end) => {
    leaves.push(
      new LeafRange({
        start: start + offset,
        end: end + offset,
      })
    );
  });
  return List(leaves);
}

function areEqual(a, b) {
  return a === b;
}

module.exports = BlockTree;
