/**
 * Mock Sales System API Server
 * Simulates Sales System API on port 3001
 * Endpoint: GET /api/sales/documents?vin=
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock database of sales documents
const salesDocumentsDb = {
  'WBADT43452G808140': [
    {
      id: 'sales-001',
      documentId: 'INV-2026-001',
      vin: 'WBADT43452G808140',
      title: 'Invoice - Vehicle Purchase',
      type: 'invoice',
      source: 'SALES_SYSTEM',
      createdDate: '2026-01-15T10:30:00Z',
      modifiedDate: '2026-01-15T10:30:00Z',
      contentUrl: 'https://sales-system.example.com/docs/INV-2026-001',
      size: 256000,
      metadata: {
        dealerId: 'DEALER-001',
        salePrice: 45000,
        saleDate: '2026-01-15'
      }
    },
    {
      id: 'sales-002',
      documentId: 'RECEIPT-2026-001',
      vin: 'WBADT43452G808140',
      title: 'Sale Receipt - Payment Confirmation',
      type: 'receipt',
      source: 'SALES_SYSTEM',
      createdDate: '2026-01-16T14:20:00Z',
      modifiedDate: '2026-01-16T14:20:00Z',
      contentUrl: 'https://sales-system.example.com/docs/RECEIPT-2026-001',
      size: 128000,
      metadata: {
        dealerId: 'DEALER-001',
        paymentMethod: 'credit_card',
        transactionId: 'TXN-2026-001'
      }
    }
  ],
  'JH2RC5305MM100001': [
    {
      id: 'sales-003',
      documentId: 'INV-2026-002',
      vin: 'JH2RC5305MM100001',
      title: 'Invoice - Motorcycle Sale',
      type: 'invoice',
      source: 'SALES_SYSTEM',
      createdDate: '2025-11-20T09:15:00Z',
      modifiedDate: '2025-11-20T09:15:00Z',
      contentUrl: 'https://sales-system.example.com/docs/INV-2026-002',
      size: 192000,
      metadata: {
        dealerId: 'DEALER-002',
        salePrice: 12000,
        saleDate: '2025-11-20'
      }
    }
  ],
  '1G1FB1S52D0167435': [
    {
      id: 'sales-004',
      documentId: 'WARRANTY-2026-001',
      vin: '1G1FB1S52D0167435',
      title: 'Warranty Certificate',
      type: 'warranty',
      source: 'SALES_SYSTEM',
      createdDate: '2026-02-01T11:00:00Z',
      modifiedDate: '2026-02-01T11:00:00Z',
      contentUrl: 'https://sales-system.example.com/docs/WARRANTY-2026-001',
      size: 64000,
      metadata: {
        warrantyType: 'full',
        duration_months: 36,
        expirationDate: '2029-02-01'
      }
    }
  ]
};

/**
 * GET /api/sales/documents
 * Returns sales documents for a given VIN
 */
app.get('/api/sales/documents', (req, res) => {
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
  const documents = salesDocumentsDb[vin] || [];

  // Simulate occasional network delays (10% chance of 500ms delay)
  const delay = Math.random() < 0.1 ? 500 : 0;

  setTimeout(() => {
    res.status(200).json({
      success: true,
      data: documents,
      count: documents.length,
      source: 'SALES_SYSTEM',
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
    service: 'sales-system-api',
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
  console.log(`Sales System API mock server running on http://localhost:${PORT}`);
  console.log(`Endpoints: GET /api/sales/documents?vin=<17-char-vin>`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Sales System API server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Sales System API server closed');
    process.exit(0);
  });
});
