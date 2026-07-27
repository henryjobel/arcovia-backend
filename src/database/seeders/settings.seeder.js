import { Setting } from '../../modules/settings/setting.model.js';
import { SETTINGS_DEFAULTS } from '../../modules/settings/settings.defaults.js';
import { logger } from '../../core/utils/logger.js';

export const seedSettings = async () => {
  for (const [group, def] of Object.entries(SETTINGS_DEFAULTS)) {
    const exists = await Setting.exists({ group });
    if (exists) continue;
    await Setting.create({ group, values: def.values, isPublic: def.isPublic });
    logger.info(`  + settings group: ${group}`);
  }
};
