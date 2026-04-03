const normalizeId = (value) => String(value?._id || value?.id || value || '');

const isSameId = (a, b) => normalizeId(a) === normalizeId(b);

const includesId = (items = [], target) => items.some((item) => isSameId(item, target));

module.exports = { normalizeId, isSameId, includesId };
