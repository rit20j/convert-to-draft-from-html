/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall draft_js
 */
'use strict';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var CharacterMetadata = require('./utils/CharacterMetadata.js');
var ContentBlock = require('./utils/ContentBlock.js');
var ContentBlockNode = require('./utils/ContentBlockNode.js');
var ContentState = require('./immutable/ContentState.js');
var DefaultDraftBlockRenderMap = require('./utils/DefaultDraftBlockRenderMap.js');
var URI = require('./utils/URI');
// var cx = require('cx');
var generateRandomKey = require('./utils/generateRandomKey.js');
var getSafeBodyFromHTML = require('./getSafeBodyFromHTML.js');
var gkx = require('./utils/gkx.js');
var _b = require('immutable'), List = _b.List, Map = _b.Map, OrderedSet = _b.OrderedSet;
var isHTMLAnchorElement = require('./dmi/isHTMLAnchorElement.js');
var isHTMLBRElement = require('./dmi/isHTMLBRElement.js');
var isHTMLElement = require('./dmi/isHTMLElement.js');
var isHTMLImageElement = require('./dmi/isHTMLImageElement.js');

var experimentalTreeDataSupport = gkx('draft_tree_data_support');
var allowPastingAltText = gkx('draftjs_paste_emojis');
var NBSP = '&nbsp;';
var SPACE = ' ';
// used for replacing characters in HTML
var REGEX_CR = new RegExp('\r', 'g');
var REGEX_LF = new RegExp('\n', 'g');
var REGEX_LEADING_LF = new RegExp('^\n', 'g');
var REGEX_NBSP = new RegExp(NBSP, 'g');
var REGEX_CARRIAGE = new RegExp('&#13;?', 'g');
var REGEX_ZWS = new RegExp('&#8203;?', 'g');
// https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight
var boldValues = ['bold', 'bolder', '500', '600', '700', '800', '900'];
var notBoldValues = [
    'light',
    'lighter',
    'normal',
    '100',
    '200',
    '300',
    '400',
];
var anchorAttr = ['className', 'href', 'rel', 'target', 'title'];
var imgAttr = ['alt', 'className', 'height', 'src', 'width'];
var knownListItemDepthClasses = (_a = {},
    _a['public/DraftStyleDefault/depth0'] = 0,
    _a['public/DraftStyleDefault/depth1'] = 1,
    _a['public/DraftStyleDefault/depth2'] = 2,
    _a['public/DraftStyleDefault/depth3'] = 3,
    _a['public/DraftStyleDefault/depth4'] = 4,
    _a);
var HTMLTagToRawInlineStyleMap = Map({
    b: 'BOLD',
    code: 'CODE',
    del: 'STRIKETHROUGH',
    em: 'ITALIC',
    i: 'ITALIC',
    s: 'STRIKETHROUGH',
    strike: 'STRIKETHROUGH',
    strong: 'BOLD',
    u: 'UNDERLINE',
    mark: 'HIGHLIGHT',
});
/**
 * Build a mapping from HTML tags to draftjs block types
 * out of a BlockRenderMap.
 *
 * The BlockTypeMap for the default BlockRenderMap looks like this:
 *   Map({
 *     h1: 'header-one',
 *     h2: 'header-two',
 *     h3: 'header-three',
 *     h4: 'header-four',
 *     h5: 'header-five',
 *     h6: 'header-six',
 *     blockquote: 'blockquote',
 *     figure: 'atomic',
 *     pre: ['code-block'],
 *     div: 'unstyled',
 *     p: 'unstyled',
 *     li: ['ordered-list-item', 'unordered-list-item'],
 *   })
 */
var buildBlockTypeMap = function (blockRenderMap) {
    var blockTypeMap = {};
    blockRenderMap.mapKeys(function (blockType, desc) {
        var elements = [desc.element];
        if (desc.aliasedElements !== undefined) {
            elements.push.apply(elements, desc.aliasedElements);
        }
        elements.forEach(function (element) {
            if (blockTypeMap[element] === undefined) {
                blockTypeMap[element] = blockType;
            }
            else if (typeof blockTypeMap[element] === 'string') {
                blockTypeMap[element] = [blockTypeMap[element], blockType];
            }
            else {
                blockTypeMap[element].push(blockType);
            }
        });
    });
    return Map(blockTypeMap);
};
var detectInlineStyle = function (node) {
    if (isHTMLElement(node)) {
        var element = node
        // Currently only used to detect preformatted inline code
        if (element.style.fontFamily.includes('monospace')) {
            return 'CODE';
        }
    }
    return null;
};
/**
 * If we're pasting from one DraftEditor to another we can check to see if
 * existing list item depth classes are being used and preserve this style
 */
var getListItemDepth = function (node, depth) {
    if (depth === void 0) { depth = 0; }
    Object.keys(knownListItemDepthClasses).some(function (depthClass) {
        if (node.classList.contains(depthClass)) {
            depth = knownListItemDepthClasses[depthClass];
        }
    });
    return depth;
};
/**
 * Return true if the provided HTML Element can be used to build a
 * Draftjs-compatible link.
 */
var isValidAnchor = function (node) {
    if (!isHTMLAnchorElement(node)) {
        return false;
    }
    var anchorNode = function (node) { return ; };
    if (!anchorNode.href ||
        (anchorNode.protocol !== 'http:' &&
            anchorNode.protocol !== 'https:' &&
            anchorNode.protocol !== 'mailto:' &&
            anchorNode.protocol !== 'tel:')) {
        return false;
    }
    try {
        // Just checking whether we can actually create a URI
        var _ = new URI(anchorNode.href);
        return true;
    }
    catch (_a) {
        return false;
    }
};
/**
 * Return true if the provided HTML Element can be used to build a
 * Draftjs-compatible image.
 */
var isValidImage = function (node) {
    if (!isHTMLImageElement(node)) {
        return false;
    }
    var imageNode = function (node) { return ; };
    return !!(imageNode.attributes.getNamedItem('src') &&
        imageNode.attributes.getNamedItem('src').value);
};
/**
 * Try to guess the inline style of an HTML element based on its css
 * styles (font-weight, font-style and text-decoration).
 */
var styleFromNodeAttributes =  (node, style) => {
    console.log('nodenode-----', node)
    if (!isHTMLElement(node)) {
        return style;
    }
    var htmlElement = node
    var fontWeight = htmlElement.style.fontWeight;
    var fontStyle = htmlElement.style.fontStyle;
    var textDecoration = htmlElement.style.textDecoration;
    return style.withMutations(function (style) {
        if (boldValues.indexOf(fontWeight) >= 0) {
            style.add('BOLD');
        }
        else if (notBoldValues.indexOf(fontWeight) >= 0) {
            style.remove('BOLD');
        }
        if (fontStyle === 'italic') {
            style.add('ITALIC');
        }
        else if (fontStyle === 'normal') {
            style.remove('ITALIC');
        }
        if (textDecoration === 'underline') {
            style.add('UNDERLINE');
        }
        if (textDecoration === 'line-through') {
            style.add('STRIKETHROUGH');
        }
        if (textDecoration === 'none') {
            style.remove('UNDERLINE');
            style.remove('STRIKETHROUGH');
        }
    });
};
/**
 * Determine if a nodeName is a list type, 'ul' or 'ol'
 */
var isListNode = function (nodeName) {
    return nodeName === 'ul' || nodeName === 'ol';
};
/**
 * ContentBlocksBuilder builds a list of ContentBlocks and an Entity Map
 * out of one (or several) HTMLElement(s).
 *
 * The algorithm has two passes: first it builds a tree of ContentBlockConfigs
 * by walking through the HTML nodes and their children, then it walks the
 * ContentBlockConfigs tree to compute parents/siblings and create
 * the actual ContentBlocks.
 *
 * Typical usage is:
 *     new ContentBlocksBuilder()
 *        .addDOMNode(someHTMLNode)
 *        .addDOMNode(someOtherHTMLNode)
 *       .getContentBlocks();
 *
 */
var ContentBlocksBuilder = /** @class */ (function () {
    function ContentBlocksBuilder(blockTypeMap, disambiguate) {
        // Most of the method in the class depend on the state of the content builder
        // (i.e. currentBlockType, currentDepth, currentEntity etc.). Though it may
        // be confusing at first, it made the code simpler than the alternative which
        // is to pass those values around in every call.
        // The following attributes are used to accumulate text and styles
        // as we are walking the HTML node tree.
        this.characterList = List();
        this.currentBlockType = 'unstyled';
        this.currentDepth = 0;
        this.currentEntity = null;
        this.currentText = '';
        this.wrapper = null;
        // Describes the future ContentState as a tree of content blocks
        this.blockConfigs = [];
        // The content blocks generated from the blockConfigs
        this.contentBlocks = [];
        // Entity map use to store links and images found in the HTML nodes
        this.contentState = ContentState.createFromText('');
        this.clear();
        this.blockTypeMap = blockTypeMap;
        this.disambiguate = disambiguate;
    }
    /**
     * Clear the internal state of the ContentBlocksBuilder
     */
    ContentBlocksBuilder.prototype.clear = function () {
        this.characterList = List();
        this.blockConfigs = [];
        this.currentBlockType = 'unstyled';
        this.currentDepth = 0;
        this.currentEntity = null;
        this.currentText = '';
        this.contentState = ContentState.createFromText('');
        this.wrapper = null;
        this.contentBlocks = [];
    };
    /**
     * Add an HTMLElement to the ContentBlocksBuilder
     */
    ContentBlocksBuilder.prototype.addDOMNode = function (node) {
        var _a;
        this.contentBlocks = [];
        this.currentDepth = 0;
        // Converts the HTML node to block config
        (_a = this.blockConfigs).push.apply(_a, this._toBlockConfigs([node], OrderedSet()));
        // There might be some left over text in the builder's
        // internal state, if so make a ContentBlock out of it.
        this._trimCurrentText();
        if (this.currentText !== '') {
            this.blockConfigs.push(this._makeBlockConfig());
        }
        // for chaining
        return this;
    };
    /**
     * Return the ContentBlocks and the EntityMap that corresponds
     * to the previously added HTML nodes.
     */
    ContentBlocksBuilder.prototype.getContentBlocks = function () {
        if (this.contentBlocks.length === 0) {
            if (experimentalTreeDataSupport) {
                this._toContentBlocks(this.blockConfigs);
            }
            else {
                this._toFlatContentBlocks(this.blockConfigs);
            }
        }
        return {
            contentBlocks: this.contentBlocks,
            entityMap: this.contentState.getEntityMap(),
        };
    };
    // ***********************************WARNING******************************
    // The methods below this line are private - don't call them directly.
    /**
     * Generate a new ContentBlockConfig out of the current internal state
     * of the builder, then clears the internal state.
     */
    ContentBlocksBuilder.prototype._makeBlockConfig = function (config) {
        if (config === void 0) { config = {}; }
        var key = config.key || generateRandomKey();
        var block = __assign({ key: key, type: this.currentBlockType, text: this.currentText, characterList: this.characterList, depth: this.currentDepth, parent: null, children: List(), prevSibling: null, nextSibling: null, childConfigs: [] }, config);
        this.characterList = List();
        this.currentBlockType = 'unstyled';
        this.currentText = '';
        return block;
    };
    /**
     * Converts an array of HTML elements to a multi-root tree of content
     * block configs. Some text content may be left in the builders internal
     * state to enable chaining sucessive calls.
     */
    ContentBlocksBuilder.prototype._toBlockConfigs = function (nodes, style) {
        var blockConfigs = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var nodeName = node.nodeName.toLowerCase();
            if (nodeName === 'body' || isListNode(nodeName)) {
                // body, ol and ul are 'block' type nodes so create a block config
                // with the text accumulated so far (if any)
                this._trimCurrentText();
                if (this.currentText !== '') {
                    blockConfigs.push(this._makeBlockConfig());
                }
                // body, ol and ul nodes are ignored, but their children are inlined in
                // the parent block config.
                var wasCurrentDepth = this.currentDepth;
                var wasWrapper = this.wrapper;
                if (isListNode(nodeName)) {
                    this.wrapper = nodeName;
                    if (isListNode(wasWrapper)) {
                        this.currentDepth++;
                    }
                }
                blockConfigs.push.apply(blockConfigs, this._toBlockConfigs(Array.from(node.childNodes), style));
                this.currentDepth = wasCurrentDepth;
                this.wrapper = wasWrapper;
                continue;
            }
            var blockType = this.blockTypeMap.get(nodeName);
            if (blockType !== undefined) {
                // 'block' type node means we need to create a block config
                // with the text accumulated so far (if any)
                this._trimCurrentText();
                if (this.currentText !== '') {
                    blockConfigs.push(this._makeBlockConfig());
                }
                var wasCurrentDepth = this.currentDepth;
                var wasWrapper = this.wrapper;
                this.wrapper = nodeName === 'pre' ? 'pre' : this.wrapper;
                if (typeof blockType !== 'string') {
                    blockType =
                        this.disambiguate(nodeName, this.wrapper) ||
                            blockType[0] ||
                            'unstyled';
                }
                if (!experimentalTreeDataSupport &&
                    isHTMLElement(node) &&
                    (blockType === 'unordered-list-item' ||
                        blockType === 'ordered-list-item')) {
                    var htmlElement = function (node) { return ; };
                    this.currentDepth = getListItemDepth(htmlElement, this.currentDepth);
                }
                var key = generateRandomKey();
                var childConfigs = this._toBlockConfigs(Array.from(node.childNodes), style);
                this._trimCurrentText();
                blockConfigs.push(this._makeBlockConfig({
                    key: key,
                    childConfigs: childConfigs,
                    type: blockType,
                }));
                this.currentDepth = wasCurrentDepth;
                this.wrapper = wasWrapper;
                continue;
            }
            if (nodeName === '#text') {
                this._addTextNode(node, style);
                continue;
            }
            if (nodeName === 'br') {
                this._addBreakNode(node, style);
                continue;
            }
            if (isValidImage(node)) {
                this._addImgNode(node, style);
                continue;
            }
            if (isValidAnchor(node)) {
                this._addAnchorNode(node, blockConfigs, style);
                continue;
            }
            var newStyle = style;
            if (HTMLTagToRawInlineStyleMap.has(nodeName)) {
                newStyle = newStyle.add(HTMLTagToRawInlineStyleMap.get(nodeName));
            }
            newStyle = styleFromNodeAttributes(node, newStyle);
            var inlineStyle = detectInlineStyle(node);
            if (inlineStyle != null) {
                newStyle = newStyle.add(inlineStyle);
            }
            blockConfigs.push.apply(blockConfigs, this._toBlockConfigs(Array.from(node.childNodes), newStyle));
        }
        return blockConfigs;
    };
    /**
     * Append a string of text to the internal buffer.
     */
    ContentBlocksBuilder.prototype._appendText = function (text, style) {
        var _a;
        this.currentText += text;
        var characterMetadata = CharacterMetadata.create({
            style: style,
            entity: this.currentEntity,
        });
        this.characterList = (_a = this.characterList).push.apply(_a, Array(text.length).fill(characterMetadata));
    };
    /**
     * Trim the text in the internal buffer.
     */
    ContentBlocksBuilder.prototype._trimCurrentText = function () {
        var l = this.currentText.length;
        var begin = l - this.currentText.trimLeft().length;
        var end = this.currentText.trimRight().length;
        // We should not trim whitespaces for which an entity is defined.
        var entity = this.characterList.findEntry(function (characterMetadata) { return characterMetadata.getEntity() !== null; });
        begin = entity !== undefined ? Math.min(begin, entity[0]) : begin;
        entity = this.characterList
            .reverse()
            .findEntry(function (characterMetadata) { return characterMetadata.getEntity() !== null; });
        end = entity !== undefined ? Math.max(end, l - entity[0]) : end;
        if (begin > end) {
            this.currentText = '';
            this.characterList = List();
        }
        else {
            this.currentText = this.currentText.slice(begin, end);
            this.characterList = this.characterList.slice(begin, end);
        }
    };
    /**
     * Add the content of an HTML text node to the internal state
     */
    ContentBlocksBuilder.prototype._addTextNode = function (node, style) {
        var text = node.textContent;
        var trimmedText = text.trim();
        // If we are not in a pre block and the trimmed content is empty,
        // normalize to a single space.
        if (trimmedText === '' && this.wrapper !== 'pre') {
            text = ' ';
        }
        if (this.wrapper !== 'pre') {
            // Trim leading line feed, which is invisible in HTML
            text = text.replace(REGEX_LEADING_LF, '');
            // Can't use empty string because MSWord
            text = text.replace(REGEX_LF, SPACE);
        }
        this._appendText(text, style);
    };
    ContentBlocksBuilder.prototype._addBreakNode = function (node, style) {
        if (!isHTMLBRElement(node)) {
            return;
        }
        this._appendText('\n', style);
    };
    /**
     * Add the content of an HTML img node to the internal state
     */
    ContentBlocksBuilder.prototype._addImgNode = function (node, style) {
        if (!isHTMLImageElement(node)) {
            return;
        }
        var image = function (node) { return ; };
        var entityConfig = {};
        imgAttr.forEach(function (attr) {
            var imageAttribute = image.getAttribute(attr);
            if (imageAttribute) {
                entityConfig[attr] = imageAttribute;
            }
        });
        this.contentState = this.contentState.createEntity('IMAGE', 'IMMUTABLE', entityConfig);
        this.currentEntity = this.contentState.getLastCreatedEntityKey();
        // The child text node cannot just have a space or return as content (since
        // we strip those out)
        var alt = image.getAttribute('alt');
        if (allowPastingAltText && alt != null && alt.length > 0) {
            this._appendText(alt, style);
        }
        else {
            this._appendText('\ud83d\udcf7', style);
        }
        this.currentEntity = null;
    };
    /**
     * Add the content of an HTML 'a' node to the internal state. Child nodes
     * (if any) are converted to Block Configs and appended to the provided
     * blockConfig array.
     */
    ContentBlocksBuilder.prototype._addAnchorNode = function (node, blockConfigs, style) {
        // The check has already been made by isValidAnchor but
        // we have to do it again to keep flow happy.
        if (!isHTMLAnchorElement(node)) {
            return;
        }
        var anchor = function (node) { return ; };
        var entityConfig = {};
        anchorAttr.forEach(function (attr) {
            var anchorAttribute = anchor.getAttribute(attr);
            if (anchorAttribute) {
                entityConfig[attr] = anchorAttribute;
            }
        });
        entityConfig.url = new URI(anchor.href).toString();
        this.contentState = this.contentState.createEntity('LINK', 'MUTABLE', entityConfig || {});
        this.currentEntity = this.contentState.getLastCreatedEntityKey();
        blockConfigs.push.apply(blockConfigs, this._toBlockConfigs(Array.from(node.childNodes), style));
        this.currentEntity = null;
    };
    /**
     * Walk the BlockConfig tree, compute parent/children/siblings,
     * and generate the corresponding ContentBlockNode
     */
    ContentBlocksBuilder.prototype._toContentBlocks = function (blockConfigs, parent) {
        if (parent === void 0) { parent = null; }
        var l = blockConfigs.length - 1;
        for (var i = 0; i <= l; i++) {
            var config = blockConfigs[i];
            config.parent = parent;
            config.prevSibling = i > 0 ? blockConfigs[i - 1].key : null;
            config.nextSibling = i < l ? blockConfigs[i + 1].key : null;
            config.children = List(config.childConfigs.map(function (child) { return child.key; }));
            this.contentBlocks.push(new ContentBlockNode(__assign({}, config)));
            this._toContentBlocks(config.childConfigs, config.key);
        }
    };
    /**
     * Remove 'useless' container nodes from the block config hierarchy, by
     * replacing them with their children.
     */
    ContentBlocksBuilder.prototype._hoistContainersInBlockConfigs = function (blockConfigs) {
        var _this = this;
        var hoisted = List(blockConfigs).flatMap(function (blockConfig) {
            // Don't mess with useful blocks
            if (blockConfig.type !== 'unstyled' || blockConfig.text !== '') {
                return [blockConfig];
            }
            return _this._hoistContainersInBlockConfigs(blockConfig.childConfigs);
        });
        return hoisted;
    };
    // ***********************************************************************
    // The two methods below are used for backward compatibility when
    // experimentalTreeDataSupport is disabled.
    /**
     * Same as _toContentBlocks but replaces nested blocks by their
     * text content.
     */
    ContentBlocksBuilder.prototype._toFlatContentBlocks = function (blockConfigs) {
        var _this = this;
        var cleanConfigs = this._hoistContainersInBlockConfigs(blockConfigs);
        cleanConfigs.forEach(function (config) {
            var _a = _this._extractTextFromBlockConfigs(config.childConfigs), text = _a.text, characterList = _a.characterList;
            _this.contentBlocks.push(new ContentBlock(__assign(__assign({}, config), { text: config.text + text, characterList: config.characterList.concat(characterList) })));
        });
    };
    /**
     * Extract the text and the associated inline styles form an
     * array of content block configs.
     */
    ContentBlocksBuilder.prototype._extractTextFromBlockConfigs = function (blockConfigs) {
        var l = blockConfigs.length - 1;
        var text = '';
        var characterList = List();
        for (var i = 0; i <= l; i++) {
            var config = blockConfigs[i];
            text += config.text;
            characterList = characterList.concat(config.characterList);
            if (text !== '' && config.type !== 'unstyled') {
                text += '\n';
                characterList = characterList.push(characterList.last());
            }
            var children = this._extractTextFromBlockConfigs(config.childConfigs);
            text += children.text;
            characterList = characterList.concat(children.characterList);
        }
        return { text: text, characterList: characterList };
    };
    return ContentBlocksBuilder;
}());
/**
 * Converts an HTML string to an array of ContentBlocks and an EntityMap
 * suitable to initialize the internal state of a Draftjs component.
 */
const convertFromHTMLToContentBlocks = (
    html,
    DOMBuilder = getSafeBodyFromHTML,
    blockRenderMap = DefaultDraftBlockRenderMap,
  ) => {
    html = html
      .trim()
      .replace(REGEX_CR, '')
      .replace(REGEX_NBSP, SPACE)
      .replace(REGEX_CARRIAGE, '')
      .replace(REGEX_ZWS, '');
  
    const safeBody = DOMBuilder(html);
    if (!safeBody) {
      return null;
    }
  
    const blockTypeMap = buildBlockTypeMap(blockRenderMap);
  
    const disambiguate = (tag, wrapper) => {
      if (tag === 'li') {
        return wrapper === 'ol' ? 'ordered-list-item' : 'unordered-list-item';
      }
      return null;
    };
  
    return new ContentBlocksBuilder(blockTypeMap, disambiguate)
      .addDOMNode(safeBody)
      .getContentBlocks();
  }

module.exports = convertFromHTMLToContentBlocks;
