const isElement = require('./isElement.js');

function isHTMLAnchorElement(node) {
  if (!node || !node.ownerDocument) {
    return false;
  }
  return isElement(node) && node.nodeName === 'A';
}

module.exports = isHTMLAnchorElement;