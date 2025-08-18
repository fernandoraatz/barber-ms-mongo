module.exports = {
  async up(db) {
    await db.collection('professional_categories').insertMany([
      { name: 'Barbeiro' },
      { name: 'Cabeleireiro' },
    ]);
  },

  async down(db) {
    await db.collection('professional_categories').deleteMany({
      name: { $in: ['Barbeiro', 'Cabeleireiro'] },
    });
  },
};
