const ContentBlock = require('./utils/ContentBlock.js');
const ContentBlockNode = require('./utils/ContentBlockNode.js');
const DraftStringKey = require('./utils/DraftStringKey.js');
const encodeEntityRanges = require('./utils/encodeEntityRanges.js');
const encodeInlineStyleRanges = require('./utils/encodeInlineStyleRanges.js');
const invariant = require("invariant");


const createRawBlock = (block, entityStorageMap) => {
  return {
    key: block.getKey(),
    text: block.getText(),
    type: block.getType(),
    depth: block.getDepth(),
    inlineStyleRanges: encodeInlineStyleRanges(block),
    entityRanges: encodeEntityRanges(block, entityStorageMap),
    data: block.getData().toObject(),
  };
};

const insertRawBlock = (block, entityMap, rawBlocks, blockCacheRef) => {
  if (block instanceof ContentBlock) {
    rawBlocks.push(createRawBlock(block, entityMap));
    return;
  }

  invariant(block instanceof ContentBlockNode, 'block is not a BlockNode');

  const parentKey = block.getParentKey();
  const rawBlock = (blockCacheRef[block.getKey()] = {
    ...createRawBlock(block, entityMap),
    children: [],
  });

  if (parentKey) {
    blockCacheRef[parentKey].children.push(rawBlock);
    return;
  }

  rawBlocks.push(rawBlock);
};

const encodeRawBlocks = (contentState, rawState) => {
  const { entityMap } = rawState;

  const rawBlocks = [];

  const blockCacheRef = {};
  const entityCacheRef = {};
  let entityStorageKey = 0;

  contentState.getBlockMap().forEach(block => {
    block.findEntityRanges(
      character => character.getEntity() !== null,
      start => {
        const entityKey = block.getEntityAt(start);
        const stringifiedEntityKey = DraftStringKey.stringify(entityKey);
        if (entityCacheRef[stringifiedEntityKey]) {
          return;
        }
        entityCacheRef[stringifiedEntityKey] = entityKey;
        entityMap[stringifiedEntityKey] = `${entityStorageKey}`;
        entityStorageKey++;
      },
    );

    insertRawBlock(block, entityMap, rawBlocks, blockCacheRef);
  });

  return {
    blocks: rawBlocks,
    entityMap,
  };
};

const encodeRawEntityMap = (contentState, rawState) => {
  const { blocks, entityMap } = rawState;

  const rawEntityMap = {};

  Object.keys(entityMap).forEach((key, index) => {
    const entity = contentState.getEntity(DraftStringKey.unstringify(key));
    rawEntityMap[index] = {
      type: entity.getType(),
      mutability: entity.getMutability(),
      data: entity.getData(),
    };
  });

  return {
    blocks,
    entityMap: rawEntityMap,
  };
};

const convertToRaw = contentState => {
  let rawDraftContentState = {
    entityMap: {},
    blocks: [],
  };

  rawDraftContentState = encodeRawBlocks(contentState, rawDraftContentState);
  rawDraftContentState = encodeRawEntityMap(contentState, rawDraftContentState);

  return rawDraftContentState;
};

// export default convertFromDraftStateToRaw;
module.exports = convertToRaw;
