const { Schema } = require('mongoose');

const organizationRef = { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true };
const userRef = { type: Schema.Types.ObjectId, ref: 'User' };
const matterRef = { type: Schema.Types.ObjectId, ref: 'Matter', required: true };

module.exports = { Schema, organizationRef, userRef, matterRef };
