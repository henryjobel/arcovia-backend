/** Uniform success envelope: { success, message, data, meta } */
export const ok = (res, { message = 'OK', data = null, meta = undefined, status = 200 } = {}) =>
  res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });

export const created = (res, { message = 'Created', data = null } = {}) =>
  ok(res, { message, data, status: 201 });

export const paginated = (res, { message = 'OK', data, pagination }) =>
  ok(res, { message, data, meta: { pagination } });
