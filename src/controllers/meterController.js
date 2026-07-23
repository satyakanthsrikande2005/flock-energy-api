const meterService = require('../services/meterService');
const { successResponse } = require('../models/responseModels');

async function listMeters(req, res) {
  const result = await meterService.listMeters(req.query);
  res.status(200).json(successResponse('Success', result));
}

async function getMeter(req, res) {
  const meter = await meterService.getMeter(req.params.id);
  res.status(200).json(successResponse('Success', meter));
}

async function getConsumption(req, res) {
  const consumption = await meterService.getConsumption(req.params.id);
  res.status(200).json(successResponse('Success', consumption));
}

module.exports = {
  listMeters,
  getMeter,
  getConsumption,
};
