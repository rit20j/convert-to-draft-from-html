
const DraftEntity = require('./DraftEntity')
const CharacterMetadata = require('./CharacterMetadata')
const ContentBlock = require('./ContentBlock')
const generateRandomKey = require('./generateRandomKey')

const utils = {
	Entity: DraftEntity,
	CharacterMetadata,
	ContentBlock,
	genKey: generateRandomKey
}

module.exports = utils;