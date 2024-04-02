// const { CharacterMetadata, ContentBlock, generateRandomKey,  DraftEntity } = require('./utils')
import CharacterMetadata from './utils/CharacterMetadata.js';
import ContentBlock from './utils/ContentBlock.js';
import generateRandomKey from './utils/generateRandomKey.js';
import DraftEntity from './utils/DraftEntity.js';
import { Map, List, OrderedMap, OrderedSet } from 'immutable';
import getSafeBodyFromHTML from './getSafeBodyFromHTML.js';
import {
  createTextChunk,
  getSoftNewlineChunk,
  getEmptyChunk,
  getBlockDividerChunk,
  getFirstBlockChunk,
  getAtomicBlockChunk,
  joinChunks,
} from './chunkBuilder.js';
import getBlockTypeForTag from './getBlockTypeForTag.js';
import processInlineTag from './processInlineTag.js';
import getBlockData from './getBlockData.js';
import getEntityId from './getEntityId.js';
import convertFromDraftStateToRaw from './convertfromstatetoRaw.js';
import ContentState from "./immutable/ContentState.js"
import EditorState from './EditorState.js'
import convertToRaw from './convertToRaw.js'

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
  console.log("node",node)
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
  console.log("safeBody",safeBody.nodeName)
  firstBlock = true;
  const { chunk } = genFragment(safeBody, new OrderedSet(), -1, '', undefined, customChunkGenerator);
  return { chunk };
}

function htmlToDraft(html, customChunkGenerator) {
  const chunkData = getChunkForHTML(html, customChunkGenerator);
  if (chunkData) {
    const { chunk } = chunkData;
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


export default function htmlToRawContent(html){
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




