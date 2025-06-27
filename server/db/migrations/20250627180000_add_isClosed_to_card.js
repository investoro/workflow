exports.up = (knex) => {
  return knex.schema.table('card', (table) => {
    table.boolean('isClosed').notNullable().defaultTo(false);
  });
};

exports.down = (knex) => {
  return knex.schema.table('card', (table) => {
    table.dropColumn('isClosed');
  });
};
