// const { CharacterMetadata, ContentBlock, generateRandomKey,  DraftEntity } = require('./utils')
const CharacterMetadata = require('./utils/CharacterMetadata.js');
const ContentBlock = require('./utils/ContentBlock.js');
const generateRandomKey = require('./utils/generateRandomKey.js');
const DraftEntity = require('./utils/DraftEntity.js');
const Map = require('immutable').Map;
const List = require('immutable').List;
const OrderedMap = require('immutable').OrderedMap;
const OrderedSet = require('immutable').OrderedSet;
const getSafeBodyFromHTML = require('./getSafeBodyFromHTML.js');
const createTextChunk = require('./chunkBuilder.js').createTextChunk;
const getSoftNewlineChunk = require('./chunkBuilder.js').getSoftNewlineChunk;
const getEmptyChunk = require('./chunkBuilder.js').getEmptyChunk;
const getBlockDividerChunk = require('./chunkBuilder.js').getBlockDividerChunk;
const getFirstBlockChunk = require('./chunkBuilder.js').getFirstBlockChunk;
const getAtomicBlockChunk = require('./chunkBuilder.js').getAtomicBlockChunk;
const joinChunks = require('./chunkBuilder.js').joinChunks;
const convertFromHTMLToContentBlocks = require('./convertFromHTMLToContentBlocks.js') // draft.js

const getBlockTypeForTag = require('./getBlockTypeForTag.js');
const processInlineTag = require('./processInlineTag.js');
const getBlockData = require('./getBlockData.js');
const getEntityId = require('./getEntityId.js');
const ContentState = require("./immutable/ContentState.js");
const EditorState = require('./EditorState.js');
const convertToRaw = require('./convertToRaw.js');

const SPACE = ' ';
const REGEX_NBSP = new RegExp('&nbsp;', 'g');

let firstBlock = true;

function genFragment(
  node,
  inlineStyle,
  depth,
  lastList,
  inEntity,
  customChunkGenerator
) {
  const nodeName = node.nodeName.toLowerCase();

  if (customChunkGenerator) {
    const value = customChunkGenerator(nodeName, node);
    if (value) {
   
      const entityId = DraftEntity.__create(
        value.type,
        value.mutability,
        value.data || {}
      );
      return { chunk: getAtomicBlockChunk(entityId) };
    }
  }

  if (nodeName === '#text' && node.textContent !== '\n') {
    return createTextChunk(node, inlineStyle, inEntity);
  }

  if (nodeName === 'br') {
    return { chunk: getSoftNewlineChunk() };
  }

  if (
    nodeName === 'img' &&
    node instanceof HTMLImageElement
  ) {
    const entityConfig = {};
    entityConfig.src = node.getAttribute ? node.getAttribute('src') || node.src : node.src;
    entityConfig.alt = node.alt;
    entityConfig.height = node.style.height;
    entityConfig.width = node.style.width;
    if (node.style.float) {
      entityConfig.alignment = node.style.float;
    }
    const entityId = DraftEntity.__create(
      'IMAGE',
      'MUTABLE',
      entityConfig,
    );
    return { chunk: getAtomicBlockChunk(entityId) };
  }

  if (
    nodeName === 'video' &&
    node instanceof HTMLVideoElement
  ) {
    const entityConfig = {};
    entityConfig.src = node.getAttribute ? node.getAttribute('src') || node.src : node.src;
    entityConfig.alt = node.alt;
    entityConfig.height = node.style.height;
    entityConfig.width = node.style.width;
    if (node.style.float) {
      entityConfig.alignment = node.style.float;
    }
    const entityId = DraftEntity.__create(
      'VIDEO',
      'MUTABLE',
      entityConfig,
    );
    return { chunk: getAtomicBlockChunk(entityId) };
  }

  if (
    nodeName === 'iframe' &&
    node instanceof HTMLIFrameElement
  ) {
    const entityConfig = {};
    entityConfig.src = node.getAttribute ? node.getAttribute('src') || node.src : node.src;
    entityConfig.height = node.height;
    entityConfig.width = node.width;
    const entityId = DraftEntity.__create(
      'EMBEDDED_LINK',
      'MUTABLE',
      entityConfig,
    );
    return { chunk: getAtomicBlockChunk(entityId) };
  }

  const blockType = getBlockTypeForTag(nodeName, lastList);
  let chunk;
  if (blockType) {
    if (nodeName === 'ul' || nodeName === 'ol') {
      lastList = nodeName;
      depth += 1;
    } else {
      if (
         blockType !== 'unordered-list-item' &&
         blockType !== 'ordered-list-item'
       ) {
         lastList = '';
         depth = -1;
       }
       if (!firstBlock) {
         chunk = getBlockDividerChunk(
           blockType,
           depth,
           getBlockData(node)
         );
       } else {
         chunk = getFirstBlockChunk(
           blockType,
           getBlockData(node)
         );
         firstBlock = false;
       }
    }
  }
  if (!chunk) {
    chunk = getEmptyChunk();
  }

  inlineStyle = processInlineTag(nodeName, node, inlineStyle);

  let child = node.firstChild;
  while (child) {
    const entityId = getEntityId(child);
    const { chunk: generatedChunk } = genFragment(child, inlineStyle, depth, lastList, (entityId || inEntity), customChunkGenerator);
    chunk = joinChunks(chunk, generatedChunk);
    const sibling = child.nextSibling;
    child = sibling;
  }

  return { chunk };
}

function getChunkForHTML(html, customChunkGenerator) {
  const sanitizedHtml = html.trim().replace(REGEX_NBSP, SPACE);
  const safeBody = getSafeBodyFromHTML(sanitizedHtml);
  if (!safeBody) {
    return null;
  }
  firstBlock = true;
  const { chunk } = genFragment(safeBody, new OrderedSet(), -1, '', undefined, customChunkGenerator);
  return { chunk };
}

function htmlToDraft(html, customChunkGenerator) {

  const chunkData = getChunkForHTML(html, customChunkGenerator);
  if (chunkData) {
    const { chunk } = chunkData;

    console.log('chunkData-----221----', JSON.stringify(chunk))
    let entityMap = new OrderedMap({});
  
    chunk.entities && chunk.entities.forEach(entity => {

      if (entity) {
        entityMap = entityMap.set(entity, DraftEntity.__get(entity));
      }
    });
    let start = 0;
    return {
      contentBlocks: chunk.text.split('\r')
        .map(
          (textBlock, ii) => {
            const end = start + textBlock.length;
            const inlines = chunk && chunk.inlines.slice(start, end);
            const entities = chunk && chunk.entities.slice(start, end);
            const characterList = new List(
              inlines.map((style, index) => {
                const data = { style, entity: null };
                if (entities[index]) {
                  data.entity = entities[index];
                }
                return CharacterMetadata.create(data);
              }),
            );
            start = end;
            return new ContentBlock({
              key: generateRandomKey(),
              type: (chunk && chunk.blocks[ii] && chunk.blocks[ii].type) || 'unstyled',
              depth: chunk && chunk.blocks[ii] && chunk.blocks[ii].depth,
              data: (chunk && chunk.blocks[ii] && chunk.blocks[ii].data) || new Map({}),
              text: textBlock,
              characterList,
            });
          },
        ),
      entityMap,
    };
  }
  return null;
}


 function htmlToRawContent(html){
  // let blocksFromHTML = convertFromHTMLToContentBlocks(html)
  let blocksFromHTML = htmlToDraft(html)
  const state = ContentState.createFromBlockArray(
    blocksFromHTML.contentBlocks,
    blocksFromHTML.entityMap,
  );
  
  const editorState =  EditorState.createWithContent(
    state,
    null,
  )
  
  const content = editorState.getCurrentContent();
  
  return JSON.stringify(convertToRaw(content))
}


console.log(htmlToRawContent('<div><a href=\"https://www.w3schools.com/\" style=\"-webkit-tap-highlight-color: rgba(26, 26, 26, 0.3); -webkit-text-size-adjust: auto; font-family: Times; font-size: medium; font-variant-ligatures: normal; orphans: 2; widows: 2;\">Visit W3Schools.com!</a></div>'))





