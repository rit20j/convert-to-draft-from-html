const Immutable = require('immutable');

const {Record} = Immutable;

const DraftEntityInstanceRecord = (Record({
  type: 'TOKEN',
  mutability: 'IMMUTABLE',
  data: Object,
}));


class DraftEntityInstance extends DraftEntityInstanceRecord {
  getType() {
    return this.get('type');
  }

  getMutability() {
    return this.get('mutability');
  }

  getData() {
    return this.get('data');
  }
}
module.exports = DraftEntityInstance

// module.exports = DraftEntityInstance;