/**
 * Implements the standard list-query contract for every collection:
 *   ?page=2&limit=20
 *   &sort=-createdAt,name
 *   &search=term                          (regex OR across options.searchFields)
 *   &filter[status]=published
 *   &filter[price][gte]=100&filter[price][lte]=500
 *   &filter[categories][in]=a,b
 *   &fields=name,slug
 */
const OPERATORS = { gte: '$gte', gt: '$gt', lte: '$lte', lt: '$lt', ne: '$ne', in: '$in', nin: '$nin' };

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const castValue = (v) => {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  if (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v)) && v.length < 15) return Number(v);
  return v;
};

export class QueryBuilder {
  /**
   * @param {import('mongoose').Model} model
   * @param {object} queryParams  req.query (qs-parsed)
   * @param {object} options { searchFields, allowedFilters, defaultSort, maxLimit, baseFilter, populate, select }
   */
  constructor(model, queryParams = {}, options = {}) {
    this.model = model;
    this.q = queryParams;
    this.opts = {
      searchFields: [],
      allowedFilters: [],
      defaultSort: '-createdAt',
      maxLimit: 100,
      baseFilter: {},
      populate: undefined,
      select: undefined,
      ...options,
    };
  }

  buildFilter() {
    const filter = { ...this.opts.baseFilter };

    const raw = this.q.filter;
    if (raw && typeof raw === 'object') {
      for (const [field, value] of Object.entries(raw)) {
        if (!this.opts.allowedFilters.includes(field)) continue;
        if (value !== null && typeof value === 'object') {
          const conditions = {};
          for (const [op, opValue] of Object.entries(value)) {
            const mongoOp = OPERATORS[op];
            if (!mongoOp) continue;
            conditions[mongoOp] =
              op === 'in' || op === 'nin'
                ? String(opValue).split(',').map((s) => castValue(s.trim()))
                : castValue(opValue);
          }
          if (Object.keys(conditions).length) filter[field] = conditions;
        } else {
          filter[field] = castValue(value);
        }
      }
    }

    const search = typeof this.q.search === 'string' ? this.q.search.trim() : '';
    if (search && this.opts.searchFields.length) {
      filter.$or = this.opts.searchFields.map((f) => ({
        [f]: { $regex: escapeRegex(search), $options: 'i' },
      }));
    }

    return filter;
  }

  buildSort() {
    const sort = typeof this.q.sort === 'string' && this.q.sort.trim() ? this.q.sort : this.opts.defaultSort;
    return sort.split(',').join(' ');
  }

  buildPagination() {
    const page = Math.max(parseInt(this.q.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(this.q.limit, 10) || 20, 1), this.opts.maxLimit);
    return { page, limit, skip: (page - 1) * limit };
  }

  buildProjection() {
    if (typeof this.q.fields === 'string' && this.q.fields.trim()) {
      // never allow opting INTO hidden fields — '-' prefixed or select:false stay excluded
      return this.q.fields
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f && !f.startsWith('-') && !f.startsWith('+'))
        .join(' ');
    }
    return this.opts.select;
  }

  async exec() {
    const filter = this.buildFilter();
    const { page, limit, skip } = this.buildPagination();

    let query = this.model.find(filter).sort(this.buildSort()).skip(skip).limit(limit);
    const projection = this.buildProjection();
    if (projection) query = query.select(projection);
    if (this.opts.populate) query = query.populate(this.opts.populate);

    const [data, total] = await Promise.all([query.lean({ getters: true }), this.model.countDocuments(filter)]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}
