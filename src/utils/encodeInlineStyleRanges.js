// const UnicodeUtils = require('UnicodeUtils');
// const findRangesImmutable = require('./findRangesImmutable');
const findRangesImmutable = require('./findRangesImmutable.js');
const areEqual = (a, b) => a === b;
const isTruthy = a => !!a;
const EMPTY_ARRAY = [];

/**
 * Helper function for getting encoded styles for each inline style. Convert
 * to UTF-8 character counts for storage.
 */
function getEncodedInlinesForType(block, styleList, styleToEncode) {
  const ranges = [];

  // Obtain an array with ranges for only the specified style.
  const filteredInlines = styleList
    .map(style => style.has(styleToEncode))
    .toList();

  findRangesImmutable(
    filteredInlines,
    areEqual,
    // We only want to keep ranges with nonzero style values.
    isTruthy,
    (start, end) => {
      const text = block.getText();
      ranges.push({
        offset: text.slice(0, start).length,
        length: text.slice(start, end).length,
        style: styleToEncode,
      });
    },
  );

  return ranges;
}

/*
 * Retrieve the encoded arrays of inline styles, with each individual style
 * treated separately.
 */
function encodeInlineStyleRanges(block) {
  const styleList = block
    .getCharacterList()
    .map(c => c.getStyle())
    .toList();
  const ranges = styleList
    .flatten()
    .toSet()
    .map(style => getEncodedInlinesForType(block, styleList, style));

  // $FlowFixMe[method-unbinding] added when improving typing for this parameters
  return Array.prototype.concat.apply(EMPTY_ARRAY, ranges.toJS());
}

module.exports = encodeInlineStyleRanges;
