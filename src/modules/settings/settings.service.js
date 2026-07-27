import { Setting } from './setting.model.js';
import { SETTINGS_DEFAULTS, SECRET_PATHS } from './settings.defaults.js';
import { GROUP_SCHEMAS } from './settings.validation.js';
import { NotFoundError, ValidationError } from '../../core/errors/AppError.js';
import { cache } from '../../core/services/cache.service.js';
import { eventBus, EVENTS } from '../../core/services/event.bus.js';
import { CACHE_KEYS, SECRET_MASK } from '../../config/constants.js';

const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const setPath = (obj, path, value) => {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] ??= {}), obj);
  target[last] = value;
};

const maskSecrets = (group, values) => {
  const paths = SECRET_PATHS[group];
  if (!paths) return values;
  const clone = structuredClone(values);
  for (const p of paths) {
    if (getPath(clone, p)) setPath(clone, p, SECRET_MASK);
  }
  return clone;
};

/** Raw values (secrets intact) — internal use only (mail service, jobs). */
export const getGroupValues = async (group) => {
  if (!SETTINGS_DEFAULTS[group]) throw new NotFoundError(`Settings group '${group}'`);

  const cached = await cache.get(CACHE_KEYS.settingsGroup(group));
  if (cached) return cached;

  const doc = await Setting.findOne({ group }).lean();
  const values = { ...SETTINGS_DEFAULTS[group].values, ...(doc?.values || {}) };
  await cache.set(CACHE_KEYS.settingsGroup(group), values);
  return values;
};

/** Admin read — secrets masked. */
export const getGroup = async (group) => maskSecrets(group, await getGroupValues(group));

export const getAllGroups = async () => {
  const result = {};
  for (const group of Object.keys(SETTINGS_DEFAULTS)) {
    result[group] = await getGroup(group);
  }
  return result;
};

export const updateGroup = async (group, incoming, actorId) => {
  const schema = GROUP_SCHEMAS[group];
  if (!schema) throw new NotFoundError(`Settings group '${group}'`);

  const parsed = schema.safeParse(incoming);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues.map((i) => ({ field: i.path.join('.') || group, message: i.message }))
    );
  }

  const current = await getGroupValues(group);
  const next = { ...current, ...parsed.data };

  // masked secret sent back unchanged → keep the stored value
  for (const p of SECRET_PATHS[group] || []) {
    if (getPath(next, p) === SECRET_MASK) setPath(next, p, getPath(current, p));
  }

  await Setting.updateOne(
    { group },
    { $set: { values: next, updatedBy: actorId, isPublic: SETTINGS_DEFAULTS[group].isPublic } },
    { upsert: true }
  );

  await cache.del(CACHE_KEYS.settingsGroup(group), CACHE_KEYS.settingsPublic);
  eventBus.safeEmit(EVENTS.SETTINGS_UPDATED, { group });
  return getGroup(group);
};

/** Merged public payload for the website (only isPublic groups, secrets never included). */
export const getPublicSettings = async () => {
  const cached = await cache.get(CACHE_KEYS.settingsPublic);
  if (cached) return cached;

  const result = {};
  for (const [group, def] of Object.entries(SETTINGS_DEFAULTS)) {
    if (!def.isPublic) continue;
    result[group] = maskSecrets(group, await getGroupValues(group));
  }
  await cache.set(CACHE_KEYS.settingsPublic, result);
  return result;
};

export const isMaintenanceMode = async () => {
  const m = await getGroupValues('maintenance').catch(() => null);
  return Boolean(m?.enabled);
};
