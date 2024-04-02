// const { Map, OrderedSet, Record } = require('immutable');

const Map = require("immutable").Map;
const OrderedSet = require("immutable").OrderedSet;
const Record = require("immutable").Record;
// Immutable.map is typed such that the value for every key in the map
// must be the same type
let EMPTY_SET = OrderedSet();

let defaultRecord = {
  style: EMPTY_SET,
  entity: null,
};

let CharacterMetadataRecord = Record(defaultRecord);

class CharacterMetadata extends CharacterMetadataRecord {
  getStyle() {
    return this.get('style');
  }

  getEntity() {
    return this.get('entity');
  }

  hasStyle(style) {
    return this.getStyle().includes(style);
  }

  static applyStyle(record, style) {
    const withStyle = record.set('style', record.getStyle().add(style));
    return CharacterMetadata.create(withStyle);
  }

  static removeStyle(record, style) {
    const withoutStyle = record.set('style', record.getStyle().remove(style));
    return CharacterMetadata.create(withoutStyle);
  }

  static applyEntity(record, entityKey) {
    const withEntity =
      record.getEntity() === entityKey
        ? record
        : record.set('entity', entityKey);
    return CharacterMetadata.create(withEntity);
  }

  /**
   * Use this function instead of the `CharacterMetadata` constructor.
   * Since most content generally uses only a very small number of
   * style/entity permutations, we can reuse these objects as often as
   * possible.
   */
  static create(config) {
    if (!config) {
      return EMPTY;
    }

    let defaultConfig = {
      style: EMPTY_SET,
      entity: null,
    };

    // Fill in unspecified properties, if necessary.
    let configMap = Map(defaultConfig).merge(config);

    let existing = pool.get(configMap);
    if (existing) {
      return existing;
    }

    let newCharacter = new CharacterMetadata(configMap);
    pool = pool.set(configMap, newCharacter);
    return newCharacter;
  }

  static fromJS({ style, entity }) {
    return new CharacterMetadata({
      style: Array.isArray(style) ? OrderedSet(style) : style,
      entity: Array.isArray(entity) ? OrderedSet(entity) : entity,
    });
  }
}

let EMPTY = new CharacterMetadata();
let pool = Map([[Map(defaultRecord), EMPTY]]);

CharacterMetadata.EMPTY = EMPTY;

module.exports = CharacterMetadata
// module.exports = CharacterMetadata;