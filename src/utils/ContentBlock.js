// const CharacterMetadata = require('./CharacterMetadata');
// const findRangesImmutable = require('./findRangesImmutable');
// const Immutable = require('immutable');

const CharacterMetadata = require('./CharacterMetadata.js');
const findRangesImmutable = require('./findRangesImmutable.js');
const Immutable = require('immutable');
const { List, Map, OrderedSet, Record, Repeat } = Immutable;

const EMPTY_SET = OrderedSet();

const defaultRecord = {
  key: '',
  type: 'unstyled',
  text: '',
  characterList: List(),
  depth: 0,
  data: Map(),
};

const ContentBlockRecord = Record(defaultRecord);

const decorateCharacterList = (config) => {
  if (!config) {
    return config;
  }

  const { characterList, text } = config;

  if (text && !characterList) {
    config.characterList = List(Repeat(CharacterMetadata.EMPTY, text.length));
  }

  return config;
};

class ContentBlock extends ContentBlockRecord {
  constructor(config) {
    super(decorateCharacterList(config));
  }

  getKey() {
    return this.get('key');
  }

  getType() {
    return this.get('type');
  }

  getText() {
    return this.get('text');
  }

  getCharacterList() {
    return this.get('characterList');
  }

  getLength() {
    return this.getText().length;
  }

  getDepth() {
    return this.get('depth');
  }

  getData() {
    return this.get('data');
  }

  getInlineStyleAt(offset) {
    const character = this.getCharacterList().get(offset);
    return character ? character.getStyle() : EMPTY_SET;
  }

  getEntityAt(offset) {
    const character = this.getCharacterList().get(offset);
    return character ? character.getEntity() : null;
  }

  findStyleRanges(filterFn, callback) {
    findRangesImmutable(
      this.getCharacterList(),
      haveEqualStyle,
      filterFn,
      callback,
    );
  }

  findEntityRanges(filterFn, callback) {
    findRangesImmutable(
      this.getCharacterList(),
      haveEqualEntity,
      filterFn,
      callback,
    );
  }
}

function haveEqualStyle(charA, charB) {
  return charA.getStyle() === charB.getStyle();
}

function haveEqualEntity(charA, charB) {
  return charA.getEntity() === charB.getEntity();
}

module.exports = ContentBlock
// module.exports = ContentBlock;