module.exports = {
  async up(db) {
    await db.collection('professional_categories').createIndex({ name: 1 }, { unique: true });
    await db.collection('professional_categories').createIndex({ status: 1 });
    await db.collection('professional_categories').createIndex({ name: 'text' });

    // Seeds iniciais
    await db.collection('professional_categories').insertMany([
      { name: 'Barbeiro', status: true },
      { name: 'Cabeleireiro', status: true },
    ], { ordered: false });
  },
  async down(db) {
    try { await db.collection('professional_categories').dropIndexes(); } catch {}
    await db.collection('professional_categories').deleteMany({
      name: { $in: ['Barbeiro', 'Cabeleireiro'] },
    });
  },
};
