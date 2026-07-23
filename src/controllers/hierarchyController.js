const hierarchyService = require('../services/hierarchyService');
const { successResponse } = require('../models/responseModels');

async function getHierarchy(req, res) {
  const hierarchy = await hierarchyService.getHierarchy(req.query);
  res.status(200).json(successResponse('Success', hierarchy));
}

module.exports = {
  getHierarchy,
};
