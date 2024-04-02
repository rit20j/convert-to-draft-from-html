 const gkx = (name)=> {
	if (typeof window !== 'undefined' && window.__DRAFT_GKX) {
	  return !!window.__DRAFT_GKX[name];
	}
	return false;
  };

  module.exports = gkx

  