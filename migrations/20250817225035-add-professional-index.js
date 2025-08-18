// migrations/xxxx-add-professional-indexes.js
module.exports = {
  async up(db) {
    await db.collection('professionals').createIndex({ userId: 1 }, { unique: true });
    await db.collection('professionals').createIndex({ status: 1, categoryId: 1 });
    await db.collection('professionals').createIndex({ name: 'text', description: 'text' });
  },
  async down(db) {
    await db.collection('professionals').dropIndexes();
  },
};
