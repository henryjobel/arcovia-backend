import { connectDB, disconnectDB } from '../../config/db.js';
import { logger } from '../../core/utils/logger.js';
import { seedRoles } from './roles.seeder.js';
import { seedSuperAdmin } from './admin.seeder.js';
import { seedSettings } from './settings.seeder.js';
import { seedPages } from './pages.seeder.js';
import { seedContent } from './content.seeder.js';
import { seedBlog } from './blog.seeder.js';

/**
 * Idempotent — safe to run repeatedly. Existing data is never overwritten,
 * only missing pieces are created.
 *   npm run seed
 */
const run = async () => {
  await connectDB();

  logger.info('Seeding roles…');
  await seedRoles();

  logger.info('Seeding super admin…');
  await seedSuperAdmin();

  logger.info('Seeding settings groups…');
  await seedSettings();

  logger.info('Seeding content (services, portfolio, team, testimonials, process)…');
  await seedContent();

  logger.info('Seeding blog…');
  await seedBlog();

  logger.info('Seeding system pages…');
  await seedPages();

  logger.info('✔ Seeding complete');
  await disconnectDB();
  process.exit(0);
};

run().catch(async (err) => {
  logger.error(`Seeding failed: ${err.message}`, { stack: err.stack });
  await disconnectDB().catch(() => {});
  process.exit(1);
});
