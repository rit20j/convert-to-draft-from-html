function isElement(node) {
	if (!node || !node.ownerDocument) {
	  return false;
	}
	return true
	// return node.nodeType === Node.ELEMENT_NODE;
  }
  
  module.exports = isElement;