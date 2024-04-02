const Map = require('immutable').Map;

module.exports = function getBlockData(
  node
) {
  if (node.style.textAlign) {
    return new Map({
      'text-align': node.style.textAlign,
    })
  } else if (node.style.marginLeft) {
    return new Map({
      'margin-left': node.style.marginLeft,
    })
  }
  return undefined;
}
