const DraftEntity = require("./utils/DraftEntity.js");

const getEntityId = (node) => {
  let entityId = undefined;

  if (
    node
  ) {
    const entityConfig = {};

    console.log('node----------------', node.getAttribute)
    if (node.dataset && node.dataset.mention !== undefined) {
      entityConfig.url = node.href;
      entityConfig.text = node.innerHTML;
      entityConfig.value = node.dataset.value;
      entityId = DraftEntity.__create(
        'MENTION',
        'IMMUTABLE',
        entityConfig,
      );
    } else if(node && node.getAttribute && node.getAttribute('href')){

      entityConfig.url = node.getAttribute ? node.getAttribute('href') || node.href : node.href;
      entityConfig.title = node.innerHTML;
      entityConfig.targetOption = node.target;
      entityId = DraftEntity.__create(
        'LINK',
        'MUTABLE',
        entityConfig,
      );
    } else {
      console.log('entityConfig0000', entityConfig)
      // entityConfig.url = "";
      // entityConfig.text = "";
      // entityConfig.value = "";
      // entityId = DraftEntity.__create(
      //   'MENTION',
      //   'IMMUTABLE',
      //   entityConfig,
      // );
    }
    
  }
  return entityId;
}

module.exports = getEntityId;
