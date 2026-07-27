import { User } from '../../modules/users/user.model.js';
import { Role } from '../../modules/roles/role.model.js';
import { hashPassword } from '../../modules/users/users.service.js';
import { env, isProd } from '../../config/env.js';
import { logger } from '../../core/utils/logger.js';

export const seedSuperAdmin = async () => {
  const role = await Role.findOne({ slug: 'super-admin' });
  if (!role) throw new Error('super-admin role missing — run roles seeder first');

  const email = env.SEED_SUPERADMIN_EMAIL.toLowerCase();
  if (await User.exists({ email })) {
    logger.info(`  = super admin already exists (${email})`);
    return;
  }

  if (isProd && env.SEED_SUPERADMIN_PASSWORD === 'Admin@12345') {
    throw new Error('Refusing to seed the default password in production. Set SEED_SUPERADMIN_PASSWORD.');
  }

  await User.create({
    name: env.SEED_SUPERADMIN_NAME,
    email,
    passwordHash: await hashPassword(env.SEED_SUPERADMIN_PASSWORD),
    role: role._id,
    status: 'active',
    emailVerifiedAt: new Date(),
  });

  logger.info(`  + super admin: ${email}`);
  if (env.SEED_SUPERADMIN_PASSWORD === 'Admin@12345') {
    logger.warn('  ! Using the default password — change it immediately after first login');
  }
};
