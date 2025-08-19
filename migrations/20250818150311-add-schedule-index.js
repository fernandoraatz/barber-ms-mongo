// mongosh
db.schedule_settings.updateMany(
  { professionalId: { $type: "string" } },
  [ { $set: { professionalId: { $toObjectId: "$professionalId" } } } ]
);

// garanta índice único por profissional
db.schedule_settings.createIndex({ professionalId: 1 }, { unique: true });
