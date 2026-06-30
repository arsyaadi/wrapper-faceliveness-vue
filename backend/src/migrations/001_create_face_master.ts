import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('face_master', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable().unique();
    table.text('photo', 'longtext').notNullable();
    table.decimal('confidence', 5, 2).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('face_master');
}
