const isElement = require('./isElement.js');

function isHTMLBRElement(node) {
  if (!node || !node.ownerDocument) {
    return false;
  }
  return isElement(node) && node.nodeName === 'BR';
}

module.exports = isHTMLBRElement;