import { MediaAsset } from './mediaAsset.model.js';
import { MediaFolder } from './mediaFolder.model.js';
import { BaseRepository } from '../../core/repositories/BaseRepository.js';
import { uploadBuffer, destroyAsset } from '../../core/services/cloudinary.service.js';
import { BusinessRuleError, NotFoundError, ConflictError } from '../../core/errors/AppError.js';
import { slugify } from '../../core/utils/slugify.js';
import { eventBus, EVENTS } from '../../core/services/event.bus.js';
import { logger } from '../../core/utils/logger.js';
import { sanitizeSvgBuffer } from '../../core/utils/sanitizeSvg.js';

const assetRepo = new BaseRepository(MediaAsset, { resourceName: 'Media asset' });

const kindFromMime = (mime) => {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  if (/word|excel|spreadsheet|text\/|csv/.test(mime)) return 'document';
  return 'other';
};

/* ── Assets ──────────────────────────────────────────────────── */

export const listAssets = (query) =>
  assetRepo.list(query, {
    searchFields: ['title', 'publicId', 'format'],
    allowedFilters: ['kind', 'folder', 'tags', 'uploadedBy'],
    baseFilter: { deletedAt: null },
    populate: { path: 'folder', select: 'name path' },
  });

export const getAsset = (id) => assetRepo.findByIdOrFail(id, { populate: { path: 'folder', select: 'name path' } });

export const uploadAssets = async (files, { folderId, actorId }) => {
  if (!files?.length) throw new BusinessRuleError('No files received. Send multipart field "files".');

  let folder = null;
  if (folderId) {
    folder = await MediaFolder.findById(folderId);
    if (!folder) throw new NotFoundError('Folder');
  }

  const uploaded = [];
  for (const file of files) {
    const buffer = file.mimetype === 'image/svg+xml' ? sanitizeSvgBuffer(file.buffer) : file.buffer;
    const result = await uploadBuffer(buffer, {
      folder: folder ? folder.path.replace(/^\//, '') : '',
      resourceType: 'auto',
    });

    const asset = await MediaAsset.create({
      folder: folder?._id || null,
      kind: kindFromMime(file.mimetype),
      publicId: result.public_id,
      resourceType: result.resource_type,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format || file.mimetype.split('/')[1],
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      duration: result.duration,
      title: file.originalname.replace(/\.[^.]+$/, ''),
      uploadedBy: actorId,
    });
    uploaded.push(asset);
  }

  eventBus.safeEmit(EVENTS.MEDIA_UPLOADED, { count: uploaded.length, actorId });
  return uploaded;
};

export const updateAsset = (id, data) => assetRepo.updateById(id, data, { populate: { path: 'folder', select: 'name path' } });

/**
 * Replace the binary while keeping the same publicId → every reference
 * to this asset across the CMS updates instantly, URLs stay stable.
 */
export const replaceAsset = async (id, file) => {
  const asset = await assetRepo.findByIdOrFail(id);
  if (!file) throw new BusinessRuleError('No file received. Send multipart field "file".');

  const newKind = kindFromMime(file.mimetype);
  if (newKind !== asset.kind) {
    throw new BusinessRuleError(`Replacement must be the same media kind (${asset.kind})`);
  }

  const buffer = file.mimetype === 'image/svg+xml' ? sanitizeSvgBuffer(file.buffer) : file.buffer;
  const result = await uploadBuffer(buffer, {
    publicId: asset.publicId,
    resourceType: asset.resourceType,
    overwrite: true,
  });

  Object.assign(asset, {
    url: result.url,
    secureUrl: result.secure_url,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    duration: result.duration,
  });
  await asset.save();
  return asset;
};

const destroyOnCloudinary = async (asset) => {
  try {
    await destroyAsset(asset.publicId, asset.resourceType);
  } catch (err) {
    logger.error(`Cloudinary destroy failed for ${asset.publicId}: ${err.message}`);
  }
};

export const deleteAsset = async (id) => {
  const asset = await assetRepo.findByIdOrFail(id);
  await destroyOnCloudinary(asset);
  asset.deletedAt = new Date();
  await asset.save();
  return asset;
};

export const bulkDeleteAssets = async (ids) => {
  const assets = await MediaAsset.find({ _id: { $in: ids }, deletedAt: null });
  for (const asset of assets) await destroyOnCloudinary(asset);
  await MediaAsset.updateMany({ _id: { $in: assets.map((a) => a._id) } }, { deletedAt: new Date() });
  return { deleted: assets.length };
};

/* ── Folders ─────────────────────────────────────────────────── */

export const listFolders = async () =>
  MediaFolder.find().sort('path').lean();

export const createFolder = async ({ name, parent }, actorId) => {
  let parentDoc = null;
  if (parent) {
    parentDoc = await MediaFolder.findById(parent);
    if (!parentDoc) throw new NotFoundError('Parent folder');
  }
  const path = `${parentDoc ? parentDoc.path : ''}/${slugify(name)}`;
  if (await MediaFolder.exists({ path })) throw new ConflictError('A folder with this name already exists here');

  return MediaFolder.create({ name, parent: parentDoc?._id || null, path, createdBy: actorId });
};

export const renameFolder = async (id, name) => {
  const folder = await MediaFolder.findById(id);
  if (!folder) throw new NotFoundError('Folder');

  const parentPath = folder.path.slice(0, folder.path.lastIndexOf('/'));
  const newPath = `${parentPath}/${slugify(name)}`;
  if (newPath !== folder.path && (await MediaFolder.exists({ path: newPath }))) {
    throw new ConflictError('A folder with this name already exists here');
  }

  const oldPath = folder.path;
  folder.name = name;
  folder.path = newPath;
  await folder.save();

  // cascade the materialized path to all descendants
  const descendants = await MediaFolder.find({ path: { $regex: `^${oldPath}/` } });
  for (const d of descendants) {
    d.path = newPath + d.path.slice(oldPath.length);
    await d.save();
  }
  return folder;
};

export const deleteFolder = async (id) => {
  const folder = await MediaFolder.findById(id);
  if (!folder) throw new NotFoundError('Folder');

  const [childCount, assetCount] = await Promise.all([
    MediaFolder.countDocuments({ parent: id }),
    MediaAsset.countDocuments({ folder: id, deletedAt: null }),
  ]);
  if (childCount || assetCount) {
    throw new BusinessRuleError('Folder is not empty. Move or delete its contents first.');
  }
  await folder.deleteOne();
};
