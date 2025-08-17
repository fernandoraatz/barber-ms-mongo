module.exports = {
  async up(db) {
    await db.collection('professionalcategories').insertMany([
      { name: 'Barbeiro' },
      { name: 'Cabeleireiro' },
    ]);
  },

  async down(db) {
    await db.collection('professionalcategories').deleteMany({
      name: { $in: ['Barbeiro', 'Cabeleireiro'] },
    });
  },
};
