/**
 * Mock Service System API Server
 * Simulates Service System API on port 3002
 * Endpoint: GET /api/service/documents?vin=
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Mock database of service documents
const serviceDocumentsDb = {
  'WBADT43452G808140': [
    {
      id: 'service-001',
      documentId: 'MAINT-2026-001',
      vin: 'WBADT43452G808140',
      title: 'Maintenance Record - Oil Change',
      type: 'maintenance',
      source: 'SERVICE_SYSTEM',
      createdDate: '2026-03-10T08:45:00Z',
      modifiedDate: '2026-03-10T08:45:00Z',
      contentUrl: 'https://service-system.example.com/docs/MAINT-2026-001',
      size: 95000,
      metadata: {
        serviceCenter: 'SC-MAIN-001',
        mileage: 15200,
        cost: 89.99,
        serviceType: 'oil_change'
      }
    },
    {
      id: 'service-002',
      documentId: 'REPAIR-2026-001',
      vin: 'WBADT43452G808140',
      title: 'Repair Invoice - Brake System Repair',
      type: 'repair',
      source: 'SERVICE_SYSTEM',
      createdDate: '2026-04-22T13:30:00Z',
      modifiedDate: '2026-04-22T13:30:00Z',
      contentUrl: 'https://service-system.example.com/docs/REPAIR-2026-001',
      size: 215000,
      metadata: {
        serviceCenter: 'SC-MAIN-001',
        mileage: 22500,
        cost: 450.00,
        repairType: 'brake_system'
      }
    },
    {
      id: 'service-003',
      documentId: 'INSP-2026-001',
      vin: 'WBADT43452G808140',
      title: 'Vehicle Inspection Report',
      type: 'inspection',
      source: 'SERVICE_SYSTEM',
      createdDate: '2026-05-05T10:00:00Z',
      modifiedDate: '2026-05-05T10:00:00Z',
      contentUrl: 'https://service-system.example.com/docs/INSP-2026-001',
      size: 180000,
      metadata: {
        serviceCenter: 'SC-MAIN-001',
        mileage: 25000,
        inspectionType: 'annual'
      }
    }
  ],
  'JH2RC5305MM100001': [
    {
      id: 'service-004',
      documentId: 'MAINT-2026-002',
      vin: 'JH2RC5305MM100001',
      title: 'Maintenance Record - Tire Rotation',
      type: 'maintenance',
      source: 'SERVICE_SYSTEM',
      createdDate: '2025-12-15T09:20:00Z',
      modifiedDate: '2025-12-15T09:20:00Z',
      contentUrl: 'https://service-system.example.com/docs/MAINT-2026-002',
      size: 72000,
      metadata: {
        serviceCenter: 'SC-BRANCH-002',
        mileage: 8500,
        cost: 65.00,
        serviceType: 'tire_rotation'
      }
    }
  ]
};

/**
 * GET /api/service/documents
 * Returns service documents for a given VIN
 */
app.get('/api/service/documents', (req, res) => {
  const { vin } = req.query;

  // Validation
  if (!vin) {
    return res.status(400).json({
      error: 'Missing required parameter: vin',
      code: 'MISSING_PARAMETER'
    });
  }

  if (typeof vin !== 'string' || vin.length !== 17) {
    return res.status(400).json({
      error: 'Invalid VIN format',
      code: 'INVALID_VIN'
    });
  }

  // Check if documents exist for this VIN
  const documents = serviceDocumentsDb[vin] || [];

  // Simulate occasional network delays (15% chance of 600ms delay)
  const delay = Math.random() < 0.15 ? 600 : 0;

  setTimeout(() => {
    res.status(200).json({
      success: true,
      data: documents,
      count: documents.length,
      source: 'SERVICE_SYSTEM',
      timestamp: new Date().toISOString()
    });
  }, delay);
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'service-system-api',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    code: 'NOT_FOUND',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Service System API mock server running on http://localhost:${PORT}`);
  console.log(`Endpoints: GET /api/service/documents?vin=<17-char-vin>`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Service System API server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Service System API server closed');
    process.exit(0);
  });
});
