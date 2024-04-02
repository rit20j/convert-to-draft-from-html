const DraftStringKey = {
	stringify(key) {
	  return '_' + String(key);
	},
  
	unstringify(key) {
	  return key.slice(1);
	},
  };
  
  export default DraftStringKey;