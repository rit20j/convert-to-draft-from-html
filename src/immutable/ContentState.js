// const Immutable = require('immutable');
// const BlockMapBuilder = require('./BlockMapBuilder.js');
// const CharacterMetadata = require('../utils/CharacterMetadata.js');
// const ContentBlock = require('../utils/ContentBlock.js');
// const ContentBlockNode = require('../utils/ContentBlockNode.js');
// const DraftEntity = require('../utils/DraftEntity.js');
// const SelectionState = require('./SelectionState.js');

// const generateRandomKey = require('../utils/generateRandomKey.js');
// const getOwnObjectValues = require('../utils/getOwnObjectValues.js');
// const gkx = require('../utils/gkx.js');

// const sanitizeDraftText = require('../utils/sanitizeDraftText.js');

const Immutable = require('immutable');
const BlockMapBuilder = require('./BlockMapBuilder.js');
const CharacterMetadata = require("../utils/CharacterMetadata.js");
const ContentBlockNode = require("../utils/ContentBlockNode.js");
const DraftEntity = require("../utils/DraftEntity.js");
const ContentBlock = require("../utils/ContentBlock.js");
const SelectionState = require('./SelectionState.js');
const generateRandomKey = require('../utils/generateRandomKey.js');
const getOwnObjectValues = require('../utils/getOwnObjectValues.js');
const gkx = require('../utils/gkx.js');
const sanitizeDraftText = require('../utils/sanitizeDraftText.js');


const { List, Record, Repeat, Map: ImmutableMap, OrderedMap } = Immutable;

const defaultRecord = {
  entityMap: null,
  blockMap: null,
  selectionBefore: null,
  selectionAfter: null,
};

class ContentState extends Record(defaultRecord) {
  getEntityMap() {
    return DraftEntity;
  }

  getBlockMap() {
    return this.get('blockMap');
  }

  getSelectionBefore() {
    return this.get('selectionBefore');
  }

  getSelectionAfter() {
    return this.get('selectionAfter');
  }

  getBlockForKey(key) {
    const block = this.getBlockMap().get(key);
    return block;
  }

  getKeyBefore(key) {
    return this.getBlockMap()
      .reverse()
      .keySeq()
      .skipUntil(v => v === key)
      .skip(1)
      .first();
  }

  getKeyAfter(key) {
    return this.getBlockMap()
      .keySeq()
      .skipUntil(v => v === key)
      .skip(1)
      .first();
  }

  getBlockAfter(key) {
    return this.getBlockMap()
      .skipUntil((_, k) => k === key)
      .skip(1)
      .first();
  }

  getBlockBefore(key) {
    return this.getBlockMap()
      .reverse()
      .skipUntil((_, k) => k === key)
      .skip(1)
      .first();
  }

  getBlocksAsArray() {
    return this.getBlockMap().toArray();
  }

  getFirstBlock() {
    return this.getBlockMap().first();
  }

  getLastBlock() {
    return this.getBlockMap().last();
  }

  getPlainText(delimiter = '\n') {
    return this.getBlockMap()
      .map(block => {
        return block ? block.getText() : '';
      })
      .join(delimiter);
  }

  getLastCreatedEntityKey() {
    return DraftEntity.__getLastCreatedEntityKey();
  }

  hasText() {
    const blockMap = this.getBlockMap();
    return (
      blockMap.size > 1 ||
      escape(blockMap.first().getText()).replace(/%u200B/g, '').length > 0
    );
  }

  createEntity(type, mutability, data) {
    DraftEntity.__create(type, mutability, data);
    return this;
  }

  mergeEntityData(key, toMerge) {
    DraftEntity.__mergeData(key, toMerge);
    return this;
  }

  replaceEntityData(key, newData) {
    DraftEntity.__replaceData(key, newData);
    return this;
  }

  addEntity(instance) {
    DraftEntity.__add(instance);
    return this;
  }

  getEntity(key) {
    return DraftEntity.__get(key);
  }

  getAllEntities() {
    return DraftEntity.__getAll();
  }

  setEntityMap(entityMap) {
    DraftEntity.__loadWithEntities(entityMap);
    return this;
  }

  static mergeEntityMaps(to, from) {
    return to.merge(from.__getAll());
  }

  replaceEntityMap(entityMap) {
    return this.setEntityMap(entityMap.__getAll());
  }

  setSelectionBefore(selection) {
    return this.set('selectionBefore', selection);
  }

  setSelectionAfter(selection) {
    return this.set('selectionAfter', selection);
  }

  setBlockMap(blockMap) {
    return this.set('blockMap', blockMap);
  }

  static createFromBlockArray(blocks, entityMap) {
    const theBlocks = Array.isArray(blocks) ? blocks : blocks.contentBlocks;
    const blockMap = BlockMapBuilder.createFromArray(theBlocks);
    const selectionState = blockMap.isEmpty()
      ? new SelectionState()
      : SelectionState.createEmpty(blockMap.first().getKey());
    return new ContentState({
      blockMap,
      entityMap: entityMap || DraftEntity,
      selectionBefore: selectionState,
      selectionAfter: selectionState,
    });
  }

  static createFromText(text, delimiter = /\r\n?|\n/g) {
    const strings = text.split(delimiter);
    const blocks = strings.map(block => {
      block = sanitizeDraftText(block);
      return new ContentBlockNode({
        key: generateRandomKey(),
        text: block,
        type: 'unstyled',
        characterList: List(Repeat(CharacterMetadata.EMPTY, block.length)),
      });
    });
    return ContentState.createFromBlockArray(blocks);
  }

  static fromJS(state) {
    return new ContentState({
      ...state,
      blockMap: OrderedMap(state.blockMap).map(
        ContentState.createContentBlockFromJS,
      ),
      selectionBefore: new SelectionState(state.selectionBefore),
      selectionAfter: new SelectionState(state.selectionAfter),
    });
  }

  static createContentBlockFromJS(block) {
    const characterList = block.characterList;

    return new ContentBlockNode({
      ...block,
      data: ImmutableMap(block.data),
      characterList:
        characterList != null
          ? List(
              (Array.isArray(characterList)
                ? characterList
                : getOwnObjectValues(characterList)
              ).map(c => CharacterMetadata.fromJS(c)),
            )
          : undefined,
    });
  }
}

module.exports =  ContentState;
