const DraftStringKey = require('./DraftStringKey.js');
const UnicodeUtils = require("../immutable/UnicodeUtils.js")
const { strlen } = UnicodeUtils;

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
        offset: strlen(text.slice(0, start)),
        length: strlen(text.slice(start, end)),
        // Encode the key as a number for range storage.
        key: Number(storageMap[DraftStringKey.stringify(key)]),
      });
    },
  );
  console.log('encoded-----------',encoded)
  return encoded;
}

module.exports = encodeEntityRanges;
