import { Role } from '../../modules/roles/role.model.js';
import { ROLE_DEFINITIONS } from '../../config/constants.js';
import { logger } from '../../core/utils/logger.js';

export const seedRoles = async () => {
  for (const def of ROLE_DEFINITIONS) {
    const existing = await Role.findOne({ slug: def.slug });
    if (existing) {
      // keep admin-customized permissions; only refresh system flags
      existing.isSystem = def.isSystem;
      existing.level = def.level;
      if (def.slug === 'super-admin') existing.permissions = ['*']; // never drifts
      await existing.save();
      continue;
    }
    await Role.create(def);
    logger.info(`  + role: ${def.name}`);
  }
};
