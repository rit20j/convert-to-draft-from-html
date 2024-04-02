const DraftStringKey = require('./DraftStringKey.js');
// import UnicodeUtils from "UnicodeUtils"
// const { strlen } = UnicodeUtils;

/**
 * Convert to UTF-8 character counts for storage.
 */
function encodeEntityRanges(block, storageMap) {
  const encoded = [];
  block.findEntityRanges(
    character => !!character.getEntity(),
    (start, end) => {
      const text = block.getText();
      const key = block.getEntityAt(start);
      encoded.push({
        offset: text.slice(0, start).length,
        length: text.slice(start, end).length,
        // Encode the key as a number for range storage.
        key: Number(storageMap[DraftStringKey.stringify(key)]),
      });
    },
  );
  return encoded;
}

module.exports = encodeEntityRanges;
