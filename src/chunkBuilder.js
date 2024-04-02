import { OrderedSet, Map } from 'immutable';

const SPACE = ' ';
const MAX_DEPTH = 4;

export const getWhitespaceChunk = (entityId) => {
  return {
    text: SPACE,
    inlines: [new OrderedSet()],
    entities: [entityId],
    blocks: [],
  };
};

export const createTextChunk = (node, inlineStyle, entityId) => {
  const text = node.textContent;
  if (text.trim() === '') {
    return { chunk: getWhitespaceChunk(entityId) };
  }
  return {
    chunk: {
      text,
      inlines: Array(text.length).fill(inlineStyle),
      entities: Array(text.length).fill(entityId),
      blocks: [],
    },
  };
};

export const getSoftNewlineChunk = () => {
  return {
    text: '\n',
    inlines: [new OrderedSet()],
    entities: new Array(1),
    blocks: [],
  };
};

export const getEmptyChunk = () => {
  return {
    text: '',
    inlines: [],
    entities: [],
    blocks: [],
  };
};

export const getFirstBlockChunk = (blockType, data) => {
  return {
    text: '',
    inlines: [],
    entities: [],
    blocks: [{
      type: blockType,
      depth: 0,
      data: data || new Map({}),
    }],
  };
};

export const getBlockDividerChunk = (blockType, depth, data) => {
  return {
    text: '\r',
    inlines: [],
    entities: [],
    blocks: [{
      type: blockType,
      depth: Math.max(0, Math.min(MAX_DEPTH, depth)),
      data: data || new Map({}),
    }],
  };
};

export const getAtomicBlockChunk = (entityId) => {
  return {
    text: '\r ',
    inlines: [new OrderedSet()],
    entities: [entityId],
    blocks: [{
      type: 'atomic',
      depth: 0,
      data: new Map({})
    }],
  };
};

export const joinChunks = (A, B) => {
  return {
    text: A.text + B.text,
    inlines: A.inlines.concat(B.inlines),
    entities: A.entities.concat(B.entities),
    blocks: A.blocks.concat(B.blocks),
  };
}
