const request = require('supertest');
const app = require('../src/app');
const { MeterService } = require('../src/services/meterService');
const { HierarchyService } = require('../src/services/hierarchyService');
const { getClient } = require('../src/services/clientProvider');
const { AppError } = require('../src/models/responseModels');

jest.mock('../src/services/clientProvider', () => {
  const mockClient = {
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    getMeters: jest.fn(),
    getMeterById: jest.fn(),
    getMeterConsumption: jest.fn(),
    getHierarchy: jest.fn(),
    auth: { isAuthenticated: false },
    sessionManager: {
      isSessionExpired: jest.fn().mockReturnValue(false),
      reauthenticate: jest.fn(),
    },
  };

  return {
    portalClient: mockClient,
    getClient: jest.fn(() => mockClient),
  };
});

const mockClient = getClient();

describe('Health endpoint', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/v1/auth/login authenticates successfully', async () => {
    const res = await request(app).post('/api/v1/auth/login');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.authenticated).toBe(true);
    expect(mockClient.login).toHaveBeenCalledTimes(1);
  });

  it('POST /api/v1/auth/login handles login failure', async () => {
    mockClient.login.mockRejectedValueOnce(new AppError('Invalid credentials', 401));

    const res = await request(app).post('/api/v1/auth/login');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid credentials');
  });
});

describe('Meters API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/v1/meters returns meter list', async () => {
    mockClient.getMeters.mockResolvedValueOnce({
      meters: [
        {
          id: 'MTR-001',
          serialNumber: 'SN001',
          make: 'Genus',
          phaseType: '1-Phase',
          status: 'Installed',
          dtCode: 'DT-01',
        },
      ],
      total: 1,
      page: 1,
    });

    const res = await request(app).get('/api/v1/meters');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.meters).toHaveLength(1);
    expect(res.body.data.meters[0].id).toBe('MTR-001');
  });

  it('GET /api/v1/meters/:id returns meter detail', async () => {
    mockClient.getMeterById.mockResolvedValueOnce({
      id: 'MTR-001',
      serialNumber: 'SN001',
      status: 'Installed',
      hierarchy: [],
      nameplate: [],
    });

    const res = await request(app).get('/api/v1/meters/MTR-001');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('MTR-001');
  });

  it('GET /api/v1/meters/:id/consumption returns readings', async () => {
    mockClient.getMeterConsumption.mockResolvedValueOnce({
      meterId: 'MTR-001',
      readings: [
        { timestamp: '2026-01-01T00:00:00.000Z', kwh: 100, kvah: 110, voltageR: 230 },
      ],
      count: 1,
    });

    const res = await request(app).get('/api/v1/meters/MTR-001/consumption');

    expect(res.status).toBe(200);
    expect(res.body.data.readings).toHaveLength(1);
  });

  it('GET /api/v1/meters/:id returns 404 for unknown meter', async () => {
    mockClient.getMeterById.mockRejectedValueOnce(new AppError('Meter not found: BAD', 404));

    const res = await request(app).get('/api/v1/meters/BAD');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/meters rejects invalid page parameter', async () => {
    const res = await request(app).get('/api/v1/meters?page=0');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Hierarchy API', () => {
  it('GET /api/v1/hierarchy returns feeder tree', async () => {
    mockClient.getHierarchy.mockResolvedValueOnce({
      feeders: [{ feeder: 'FDR-01', transformers: [{ code: 'DT-01', name: 'DT One' }] }],
      transformers: [{ code: 'DT-01', name: 'DT One', feederCode: 'FDR-01', capacityKva: 100 }],
      total: 1,
      page: 1,
    });

    const res = await request(app).get('/api/v1/hierarchy');

    expect(res.status).toBe(200);
    expect(res.body.data.feeders).toHaveLength(1);
  });
});

describe('Session and retry logic', () => {
  it('MeterService propagates session errors', async () => {
    const service = new MeterService(mockClient);
    mockClient.getMeters.mockRejectedValueOnce(new AppError('Session expired', 401));

    await expect(service.listMeters({})).rejects.toMatchObject({ statusCode: 401 });
  });

  it('HierarchyService delegates to client', async () => {
    const service = new HierarchyService(mockClient);
    mockClient.getHierarchy.mockResolvedValueOnce({ feeders: [], transformers: [], total: 0, page: 1 });

    const result = await service.getHierarchy({ page: 1 });
    expect(result.total).toBe(0);
  });
});

describe('Not found', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('UrjaParser', () => {
  const UrjaParser = require('../src/client/parser');

  it('parses meters list JSON', () => {
    const parser = new UrjaParser();
    const result = parser.parseMetersList({
      data: [{ meterId: 'M1', serialNo: 'S1', make: 'X', phaseType: '1P', installStatus: 'OK', dtCode: 'DT1' }],
      total: 1,
    });

    expect(result.meters[0].id).toBe('M1');
    expect(result.total).toBe(1);
  });

  it('parses consumption readings', () => {
    const parser = new UrjaParser();
    const readings = parser.parseConsumption({
      data: [{ timestamp: '2026-01-01', kwh: '10.5', kvah: '11', voltR: '230' }],
    });

    expect(readings[0].kwh).toBe(10.5);
    expect(readings[0].voltageR).toBe(230);
  });
});

describe('Retry utility', () => {
  const { retry } = require('../src/utils/retry');

  it('retries on failure then succeeds', async () => {
    let attempts = 0;
    const result = await retry(
      async () => {
        attempts += 1;
        if (attempts < 2) throw new Error('transient');
        return 'ok';
      },
      { maxAttempts: 3, baseDelayMs: 10 }
    );

    expect(result).toBe('ok');
    expect(attempts).toBe(2);
  });
});
