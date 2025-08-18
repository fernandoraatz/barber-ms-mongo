module.exports = {
  async up(db) {
    await db.collection('services').createIndex({ status: 1 });
    await db.collection('services').createIndex({ name: 'text', description: 'text' });
  },
  async down(db) {
    try { await db.collection('services').dropIndexes(); } catch {}
  },
};
