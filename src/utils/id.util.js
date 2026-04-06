/**
 * So sánh hai ID (có thể là ObjectId hoặc chuỗi)
 * @param {any} id1 
 * @param {any} id2 
 * @returns {boolean}
 */
const isSameId = (id1, id2) => {
  if (!id1 || !id2) return false;
  return id1.toString() === id2.toString();
};

/**
 * Kiểm tra xem một mảng các ID hoặc đối tượng có chứa ID cần tìm không
 * @param {Array} items 
 * @param {any} targetId 
 * @returns {boolean}
 */
const includesId = (items, targetId) => {
  if (!items || !Array.isArray(items) || !targetId) return false;
  return items.some(item => {
    const itemId = item._id || item.id || item;
    return itemId.toString() === targetId.toString();
  });
};

module.exports = {
  isSameId,
  includesId,
};
