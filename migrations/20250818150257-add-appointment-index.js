module.exports = {
  async up(db) {
    await db.collection('appointments').createIndex({ professionalId: 1, startAt: 1 }, { unique: true, partialFilterExpression: { status: 'SCHEDULED' } });
    await db.collection('appointments').createIndex({ userId: 1, startAt: 1 });
    await db.collection('appointments').createIndex({ status: 1, startAt: 1 });
  },
  async down(db) {
    try { await db.collection('appointments').dropIndexes(); } catch {}
  },
};
