const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { hierarchyQuerySchema } = require('../validators/meterValidator');
const { getHierarchy } = require('../controllers/hierarchyController');

const router = express.Router();

/**
 * @swagger
 * /api/v1/hierarchy:
 *   get:
 *     summary: Get distribution hierarchy
 *     tags: [Hierarchy]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *     responses:
 *       200:
 *         description: Feeder and transformer hierarchy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', validate(hierarchyQuerySchema, 'query'), asyncHandler(getHierarchy));

module.exports = router;
