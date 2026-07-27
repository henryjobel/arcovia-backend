import { NotFoundError } from '../errors/AppError.js';
import { QueryBuilder } from '../utils/QueryBuilder.js';

/**
 * Generic data-access layer. Module repositories extend this and add
 * their custom queries; services never touch Mongoose models directly.
 */
export class BaseRepository {
  /** @param {import('mongoose').Model} model */
  constructor(model, { resourceName } = {}) {
    this.model = model;
    this.resourceName = resourceName || model.modelName;
  }

  async create(data) {
    return this.model.create(data);
  }

  async findById(id, { populate, select, lean = false } = {}) {
    let q = this.model.findById(id);
    if (populate) q = q.populate(populate);
    if (select) q = q.select(select);
    if (lean) q = q.lean();
    return q;
  }

  async findByIdOrFail(id, opts) {
    const doc = await this.findById(id, opts);
    if (!doc || doc.deletedAt) throw new NotFoundError(this.resourceName);
    return doc;
  }

  async findOne(filter, { populate, select } = {}) {
    let q = this.model.findOne(filter);
    if (populate) q = q.populate(populate);
    if (select) q = q.select(select);
    return q;
  }

  async updateById(id, data, { populate } = {}) {
    let q = this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (populate) q = q.populate(populate);
    const doc = await q;
    if (!doc) throw new NotFoundError(this.resourceName);
    return doc;
  }

  async softDeleteById(id) {
    return this.updateById(id, { deletedAt: new Date() });
  }

  async deleteById(id) {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new NotFoundError(this.resourceName);
    return doc;
  }

  async exists(filter) {
    return this.model.exists(filter);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  /** Paginated list using the standard query contract. */
  async list(queryParams, options) {
    return new QueryBuilder(this.model, queryParams, options).exec();
  }
}
