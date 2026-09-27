const mongoose = require('mongoose');
const { fail, ok, parsePagination } = require('../utils');

function pickFields(source, fields) {
  return fields.reduce((result, field) => {
    if (source[field] !== undefined) result[field] = source[field];
    return result;
  }, {});
}

function createResourceController({ Model, name, searchFields, fields }) {
  const findFilter = (req) => {
    const filter = { organizationId: req.organizationId, isArchived: { $ne: true } };
    if (req.query.q) {
      filter.$or = searchFields.map((field) => ({ [field]: { $regex: req.query.q, $options: 'i' } }));
    }
    for (const field of searchFields) {
      if (req.query[field]) filter[field] = req.query[field];
    }
    return filter;
  };

  const getId = (req) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail('Invalid resource id', 400, 'INVALID_ID');
    return req.params.id;
  };

  return {
    list: async (req, res, next) => {
      try {
        const { page, limit, skip } = parsePagination(req.query);
        const filter = findFilter(req);
        const [data, total] = await Promise.all([
          Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
          Model.countDocuments(filter),
        ]);
        ok(res, data, `${name} fetched successfully`, { page, limit, total, totalPages: Math.ceil(total / limit) });
      } catch (error) {
        next(error);
      }
    },

    create: async (req, res, next) => {
      try {
        const data = await Model.create({
          ...pickFields(req.body, fields),
          organizationId: req.organizationId,
          createdBy: req.user._id,
        });
        ok(res, data, `${name} created successfully`);
      } catch (error) {
        next(error);
      }
    },

    getById: async (req, res, next) => {
      try {
        const data = await Model.findOne({ _id: getId(req), organizationId: req.organizationId, isArchived: { $ne: true } }).lean();
        if (!data) throw fail(`${name} not found`, 404, `${name.toUpperCase()}_NOT_FOUND`);
        ok(res, data, `${name} fetched successfully`);
      } catch (error) {
        next(error);
      }
    },

    update: async (req, res, next) => {
      try {
        const data = await Model.findOneAndUpdate(
          { _id: getId(req), organizationId: req.organizationId, isArchived: { $ne: true } },
          { $set: { ...pickFields(req.body, fields), updatedBy: req.user._id } },
          { new: true, runValidators: true },
        );
        if (!data) throw fail(`${name} not found`, 404, `${name.toUpperCase()}_NOT_FOUND`);
        ok(res, data, `${name} updated successfully`);
      } catch (error) {
        next(error);
      }
    },

    archive: async (req, res, next) => {
      try {
        const data = await Model.findOneAndUpdate(
          { _id: getId(req), organizationId: req.organizationId, isArchived: { $ne: true } },
          { $set: { isArchived: true, archivedAt: new Date(), archivedBy: req.user._id } },
          { new: true },
        );
        if (!data) throw fail(`${name} not found`, 404, `${name.toUpperCase()}_NOT_FOUND`);
        ok(res, data, `${name} archived successfully`);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createResourceController };
