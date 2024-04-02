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
const Immutable = require('immutable');
const SelectionState = require('./immutable/SelectionState.js');
const BlockTree = require('./immutable/BlockTree.js');
const ContentState = require('./immutable/ContentState.js');
const EditorBidiService = require('./immutable/EditorBidiService.js');


var OrderedSet = Immutable.OrderedSet, Record = Immutable.Record, Stack = Immutable.Stack, OrderedMap = Immutable.OrderedMap, List = Immutable.List;
var defaultRecord = {
    allowUndo: true,
    currentContent: null,
    decorator: null,
    directionMap: null,
    forceSelection: false,
    inCompositionMode: false,
    inlineStyleOverride: null,
    lastChangeType: null,
    nativelyRenderedContent: null,
    redoStack: Stack(),
    selection: null,
    treeMap: null,
    undoStack: Stack(),
};
var EditorStateRecord = (Record(defaultRecord)), any;
var EditorState = /** @class */ (function () {
    function EditorState(immutable) {
        this._immutable = immutable;
    }
    EditorState.createEmpty = function (decorator) {
        return this.createWithText('', decorator);
    };
    EditorState.createWithText = function (text, decorator) {
        return EditorState.createWithContent(ContentState.createFromText(text), decorator);
    };
    EditorState.createWithContent = function (contentState, decorator) {
        if (contentState.getBlockMap().count() === 0) {
            return EditorState.createEmpty(decorator);
        }
        var firstKey = contentState.getBlockMap().first().getKey();
        return EditorState.create({
            currentContent: contentState,
            undoStack: Stack(),
            redoStack: Stack(),
            decorator: decorator || null,
            selection: SelectionState.createEmpty(firstKey),
        });
    };
    EditorState.create = function (config) {
        var currentContent = config.currentContent, decorator = config.decorator;
        var recordConfig = __assign(__assign({}, config), { treeMap: generateNewTreeMap(currentContent, decorator), directionMap: EditorBidiService.getDirectionMap(currentContent) });
        return new EditorState(new EditorStateRecord(recordConfig));
    };
    EditorState.fromJS = function (config) {
        return new EditorState(new EditorStateRecord(__assign(__assign({}, config), { directionMap: config.directionMap != null
                ? OrderedMap(config.directionMap)
                : config.directionMap, inlineStyleOverride: config.inlineStyleOverride != null
                ? OrderedSet(config.inlineStyleOverride)
                : config.inlineStyleOverride, nativelyRenderedContent: config.nativelyRenderedContent != null
                ? ContentState.fromJS(config.nativelyRenderedContent)
                : config.nativelyRenderedContent, redoStack: config.redoStack != null
                ? Stack(config.redoStack.map(function (v) { return ContentState.fromJS(v); }))
                : config.redoStack, selection: config.selection != null
                ? new SelectionState(config.selection)
                : config.selection, treeMap: config.treeMap != null
                ? OrderedMap(config.treeMap).map(function (v) {
                    return List(v).map(function (v) { return BlockTree.fromJS(v); });
                })
                : config.treeMap, undoStack: config.undoStack != null
                ? Stack(config.undoStack.map(function (v) { return ContentState.fromJS(v); }))
                : config.undoStack, currentContent: ContentState.fromJS(config.currentContent) })));
    };
    EditorState.set = function (editorState, put) {
        var map = editorState.getImmutable().withMutations(function (state) {
            var existingDecorator = state.get('decorator');
            var decorator = existingDecorator;
            if (put.decorator === null) {
                decorator = null;
            }
            else if (put.decorator) {
                decorator = put.decorator;
            }
            var newContent = put.currentContent || editorState.getCurrentContent();
            if (decorator !== existingDecorator) {
                var treeMap = state.get('treeMap');
                var newTreeMap = void 0;
                if (decorator && existingDecorator) {
                    newTreeMap = regenerateTreeForNewDecorator(newContent, newContent.getBlockMap(), treeMap, decorator, existingDecorator);
                }
                else {
                    newTreeMap = generateNewTreeMap(newContent, decorator);
                }
                state.merge({
                    decorator: decorator,
                    treeMap: newTreeMap,
                    nativelyRenderedContent: null,
                });
                return;
            }
            var existingContent = editorState.getCurrentContent();
            if (newContent !== existingContent) {
                state.set('treeMap', regenerateTreeForNewBlocks(editorState, newContent.getBlockMap(), newContent.getEntityMap(), decorator));
            }
            state.merge(put);
        });
        return new EditorState(map);
    };
    EditorState.prototype.toJS = function () {
        return this.getImmutable().toJS();
    };
    EditorState.prototype.getAllowUndo = function () {
        return this.getImmutable().get('allowUndo');
    };
    EditorState.prototype.getCurrentContent = function () {
        return this.getImmutable().get('currentContent');
    };
    EditorState.prototype.getUndoStack = function () {
        return this.getImmutable().get('undoStack');
    };
    EditorState.prototype.getRedoStack = function () {
        return this.getImmutable().get('redoStack');
    };
    EditorState.prototype.getSelection = function () {
        return this.getImmutable().get('selection');
    };
    EditorState.prototype.getDecorator = function () {
        return this.getImmutable().get('decorator');
    };
    EditorState.prototype.isInCompositionMode = function () {
        return this.getImmutable().get('inCompositionMode');
    };
    EditorState.prototype.mustForceSelection = function () {
        return this.getImmutable().get('forceSelection');
    };
    EditorState.prototype.getNativelyRenderedContent = function () {
        return this.getImmutable().get('nativelyRenderedContent');
    };
    EditorState.prototype.getLastChangeType = function () {
        return this.getImmutable().get('lastChangeType');
    };
    EditorState.prototype.getInlineStyleOverride = function () {
        return this.getImmutable().get('inlineStyleOverride');
    };
    EditorState.setInlineStyleOverride = function (editorState, inlineStyleOverride) {
        return EditorState.set(editorState, { inlineStyleOverride: inlineStyleOverride });
    };
    EditorState.prototype.getCurrentInlineStyle = function () {
        var override = this.getInlineStyleOverride();
        if (override != null) {
            return override;
        }
        var content = this.getCurrentContent();
        var selection = this.getSelection();
        if (selection.isCollapsed()) {
            return getInlineStyleForCollapsedSelection(content, selection);
        }
        return getInlineStyleForNonCollapsedSelection(content, selection);
    };
    EditorState.prototype.getBlockTree = function (blockKey) {
        return this.getImmutable().getIn(['treeMap', blockKey]);
    };
    EditorState.prototype.isSelectionAtStartOfContent = function () {
        var firstKey = this.getCurrentContent().getBlockMap().first().getKey();
        return this.getSelection().hasEdgeWithin(firstKey, 0, 0);
    };
    EditorState.prototype.isSelectionAtEndOfContent = function () {
        var content = this.getCurrentContent();
        var blockMap = content.getBlockMap();
        var last = blockMap.last();
        var end = last.getLength();
        return this.getSelection().hasEdgeWithin(last.getKey(), end, end);
    };
    EditorState.prototype.getDirectionMap = function () {
        return this.getImmutable().get('directionMap');
    };
    EditorState.acceptSelection = function (editorState, selection) {
        return updateSelection(editorState, selection, false);
    };
    EditorState.forceSelection = function (editorState, selection) {
        if (!selection.getHasFocus()) {
            selection = selection.set('hasFocus', true);
        }
        return updateSelection(editorState, selection, true);
    };
    EditorState.moveSelectionToEnd = function (editorState) {
        var content = editorState.getCurrentContent();
        var lastBlock = content.getLastBlock();
        var lastKey = lastBlock.getKey();
        var length = lastBlock.getLength();
        return EditorState.acceptSelection(editorState, new SelectionState({
            anchorKey: lastKey,
            anchorOffset: length,
            focusKey: lastKey,
            focusOffset: length,
            isBackward: false,
        }));
    };
    EditorState.moveFocusToEnd = function (editorState) {
        var afterSelectionMove = EditorState.moveSelectionToEnd(editorState);
        return EditorState.forceSelection(afterSelectionMove, afterSelectionMove.getSelection());
    };
    EditorState.push = function (editorState, contentState, changeType, forceSelection) {
        if (forceSelection === void 0) { forceSelection = true; }
        if (editorState.getCurrentContent() === contentState) {
            return editorState;
        }
        var directionMap = EditorBidiService.getDirectionMap(contentState, editorState.getDirectionMap());
        if (!editorState.getAllowUndo()) {
            return EditorState.set(editorState, {
                currentContent: contentState,
                directionMap: directionMap,
                lastChangeType: changeType,
                selection: contentState.getSelectionAfter(),
                forceSelection: forceSelection,
                inlineStyleOverride: null,
            });
        }
        var selection = editorState.getSelection();
        var currentContent = editorState.getCurrentContent();
        var undoStack = editorState.getUndoStack();
        var newContent = contentState;
        if (selection !== currentContent.getSelectionAfter() ||
            mustBecomeBoundary(editorState, changeType)) {
            undoStack = undoStack.push(currentContent);
            newContent = newContent.setSelectionBefore(selection);
        }
        else if (changeType === 'insert-characters' ||
            changeType === 'backspace-character' ||
            changeType === 'delete-character') {
            newContent = newContent.setSelectionBefore(currentContent.getSelectionBefore());
        }
        var inlineStyleOverride = editorState.getInlineStyleOverride();
        var overrideChangeTypes = [
            'adjust-depth',
            'change-block-type',
            'split-block',
        ];
        if (overrideChangeTypes.indexOf(changeType) === -1) {
            inlineStyleOverride = null;
        }
        var editorStateChanges = {
            currentContent: newContent,
            directionMap: directionMap,
            undoStack: undoStack,
            redoStack: Stack(),
            lastChangeType: changeType,
            selection: contentState.getSelectionAfter(),
            forceSelection: forceSelection,
            inlineStyleOverride: inlineStyleOverride,
        };
        return EditorState.set(editorState, editorStateChanges);
    };
    EditorState.undo = function (editorState) {
        if (!editorState.getAllowUndo()) {
            return editorState;
        }
        var undoStack = editorState.getUndoStack();
        var newCurrentContent = undoStack.peek();
        if (!newCurrentContent) {
            return editorState;
        }
        var currentContent = editorState.getCurrentContent();
        var directionMap = EditorBidiService.getDirectionMap(newCurrentContent, editorState.getDirectionMap());
        return EditorState.set(editorState, {
            currentContent: newCurrentContent,
            directionMap: directionMap,
            undoStack: undoStack.shift(),
            redoStack: editorState.getRedoStack().push(currentContent),
            forceSelection: true,
            inlineStyleOverride: null,
            lastChangeType: 'undo',
            nativelyRenderedContent: null,
            selection: currentContent.getSelectionBefore(),
        });
    };
    EditorState.redo = function (editorState) {
        if (!editorState.getAllowUndo()) {
            return editorState;
        }
        var redoStack = editorState.getRedoStack();
        var newCurrentContent = redoStack.peek();
        if (!newCurrentContent) {
            return editorState;
        }
        var currentContent = editorState.getCurrentContent();
        var directionMap = EditorBidiService.getDirectionMap(newCurrentContent, editorState.getDirectionMap());
        return EditorState.set(editorState, {
            currentContent: newCurrentContent,
            directionMap: directionMap,
            undoStack: editorState.getUndoStack().push(currentContent),
            redoStack: redoStack.shift(),
            forceSelection: true,
            inlineStyleOverride: null,
            lastChangeType: 'redo',
            nativelyRenderedContent: null,
            selection: newCurrentContent.getSelectionAfter(),
        });
    };
    EditorState.prototype.getImmutable = function () {
        return this._immutable;
    };
    return EditorState;
}());
function updateSelection(editorState, selection, forceSelection) {
    return EditorState.set(editorState, {
        selection: selection,
        forceSelection: forceSelection,
        nativelyRenderedContent: null,
        inlineStyleOverride: null,
    });
}
function generateNewTreeMap(contentState, decorator) {
    return contentState
        .getBlockMap()
        .map(function (block) { return BlockTree.generate(contentState, block, decorator); })
        .toOrderedMap();
}
function regenerateTreeForNewBlocks(editorState, newBlockMap, newEntityMap, decorator) {
    var contentState = editorState
        .getCurrentContent()
        .replaceEntityMap(newEntityMap);
    var prevBlockMap = contentState.getBlockMap();
    var prevTreeMap = editorState.getImmutable().get('treeMap');
    return prevTreeMap.merge(newBlockMap
        .toSeq()
        .filter(function (block, key) { return block !== prevBlockMap.get(key); })
        .map(function (block) { return BlockTree.generate(contentState, block, decorator); }));
}
function regenerateTreeForNewDecorator(content, blockMap, previousTreeMap, decorator, existingDecorator) {
    return previousTreeMap.merge(blockMap
        .toSeq()
        .filter(function (block) {
        return (decorator.getDecorations(block, content) !==
            existingDecorator.getDecorations(block, content));
    })
        .map(function (block) { return BlockTree.generate(content, block, decorator); }));
}
function mustBecomeBoundary(editorState, changeType) {
    var lastChangeType = editorState.getLastChangeType();
    return (changeType !== lastChangeType ||
        (changeType !== 'insert-characters' &&
            changeType !== 'backspace-character' &&
            changeType !== 'delete-character'));
}
function getInlineStyleForCollapsedSelection(content, selection) {
    var startKey = selection.getStartKey();
    var startOffset = selection.getStartOffset();
    var startBlock = content.getBlockForKey(startKey);
    if (startOffset > 0) {
        return startBlock.getInlineStyleAt(startOffset - 1);
    }
    if (startBlock.getLength()) {
        return startBlock.getInlineStyleAt(0);
    }
    return lookUpwardForInlineStyle(content, startKey);
}
function getInlineStyleForNonCollapsedSelection(content, selection) {
    var startKey = selection.getStartKey();
    var startOffset = selection.getStartOffset();
    var startBlock = content.getBlockForKey(startKey);
    if (startOffset < startBlock.getLength()) {
        return startBlock.getInlineStyleAt(startOffset);
    }
    if (startOffset > 0) {
        return startBlock.getInlineStyleAt(startOffset - 1);
    }
    return lookUpwardForInlineStyle(content, startKey);
}
function lookUpwardForInlineStyle(content, fromKey) {
    var lastNonEmpty = content
        .getBlockMap()
        .reverse()
        .skipUntil(function (_, k) { return k === fromKey; })
        .skip(1)
        .skipUntil(function (block, _) { return block.getLength(); })
        .first();
    if (lastNonEmpty) {
        return lastNonEmpty.getInlineStyleAt(lastNonEmpty.getLength() - 1);
    }
    return OrderedSet();
}

module.exports = EditorState;
