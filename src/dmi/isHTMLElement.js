const isHTMLElement=(node)=> {
	if (!node || !node.ownerDocument) {
	  return false;
	}
	return true 
	
	if (!node.ownerDocument.defaultView) {
	  return node instanceof HTMLElement;
	}
	if (node instanceof node.ownerDocument.defaultView.HTMLElement) {
	  return true;
	}
	return false;
  }
  
  module.exports = isHTMLElement;