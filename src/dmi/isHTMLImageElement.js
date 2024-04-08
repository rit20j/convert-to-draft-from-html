const isElement = require('./isElement.js');

function isHTMLImageElement(node) {
  if (!node || !node.ownerDocument) {
    return false;
  }
  return isElement(node) && node.nodeName === 'IMG';
}

module.exports = isHTMLImageElement;