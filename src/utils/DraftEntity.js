// const DraftEntityInstance = require('./DraftEntityInstance.js');
const DraftEntityInstance = require('./DraftEntityInstance.js');
const Immutable = require('immutable');
const invariant = require('invariant');
const uuidv4 = require('uuid').v4;



// const uuid = require('uuid');

const { OrderedMap } = Immutable;

let instances = OrderedMap();
let instanceKey = uuidv4();

const DraftEntity = {
  __getAll() {
    return instances;
  },

  __loadWithEntities(entities) {
    instances = entities;
    instanceKey = uuidv4();
  },

  __getLastCreatedEntityKey() {
    return instanceKey;
  },

  __create(type, mutability, data = {}) {
    console.log('create----------', type, "-------------",mutability, data)
    return DraftEntity.__add(
      new DraftEntityInstance({ type, mutability, data: data }),
    );
  },

  __add(instance) {
    instanceKey = uuidv4();
    instances = instances.set(instanceKey, instance);
    return instanceKey;
  },

  __get(key) {
    const instance = instances.get(key);
    invariant(!!instance, 'Unknown DraftEntity key: %s.', key);
    return instance;
  },

  get(key) {
    return DraftEntity.__get(key);
  },

  set(key, newInstance) {
    instances = instances.set(key, newInstance);
    return DraftEntity;
  },

  last() {
    return instances.last();
  },

  __mergeData(key, toMerge) {
    const instance = DraftEntity.__get(key);
    const newData = { ...instance.getData(), ...toMerge };
    const newInstance = instance.set('data', newData);
    instances = instances.set(key, newInstance);
    return newInstance;
  },

  __replaceData(key, newData) {
    const instance = DraftEntity.__get(key);
    const newInstance = instance.set('data', newData);
    instances = instances.set(key, newInstance);
    return newInstance;
  },
};

module.exports = DraftEntity;
