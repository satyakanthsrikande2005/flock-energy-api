const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
  meterIdParamSchema,
  meterListQuerySchema,
} = require('../validators/meterValidator');
const {
  listMeters,
  getMeter,
  getConsumption,
} = require('../controllers/meterController');

const router = express.Router();

/**
 * @swagger
 * /api/v1/meters:
 *   get:
 *     summary: List smart meters
 *     tags: [Meters]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by meter number or serial
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *     responses:
 *       200:
 *         description: Paginated meter list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', validate(meterListQuerySchema, 'query'), asyncHandler(listMeters));

/**
 * @swagger
 * /api/v1/meters/{id}:
 *   get:
 *     summary: Get meter details
 *     tags: [Meters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meter detail
 *       404:
 *         description: Meter not found
 */
router.get(
  '/:id',
  validate(meterIdParamSchema, 'params'),
  asyncHandler(getMeter)
);

/**
 * @swagger
 * /api/v1/meters/{id}/consumption:
 *   get:
 *     summary: Get meter consumption history
 *     tags: [Meters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consumption readings
 *       404:
 *         description: Meter not found
 */
router.get(
  '/:id/consumption',
  validate(meterIdParamSchema, 'params'),
  asyncHandler(getConsumption)
);

module.exports = router;
