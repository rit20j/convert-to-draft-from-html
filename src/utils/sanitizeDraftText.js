const REGEX_BLOCK_DELIMITER = /\r/g;

function sanitizeDraftText(input) {
  return input.replace(REGEX_BLOCK_DELIMITER, '');
}

export default sanitizeDraftText;
