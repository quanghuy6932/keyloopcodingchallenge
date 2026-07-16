#!/usr/bin/env node

/**
 * Mock API Server for Sales/Service APIs
 * Used for testing the main application in Docker Compose
 */

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3001;
const API_TYPE = process.env.API_TYPE || 'sales'; // 'sales' or 'service'

// Mock data for different API types
const mockData = {
  sales: {
    documents: [
      {
        id: '1',
        vin: 'WBADT43452G808140',
        type: 'PURCHASE_RECEIPT',
        documentNumber: 'DOC001',
        issueDate: '2024-01-15',
        documentUrl: 'https://example.com/docs/purchase-001.pdf'
      },
      {
        id: '2',
        vin: 'WBADT43452G808140',
        type: 'SALES_INVOICE',
        documentNumber: 'INV002',
        issueDate: '2024-01-20',
        documentUrl: 'https://example.com/docs/invoice-002.pdf'
      }
    ]
  },
  service: {
    documents: [
      {
        id: '1',
        vin: 'WBADT43452G808140',
        type: 'SERVICE_RECORD',
        serviceDate: '2024-02-10',
        mileage: 45000,
        documentUrl: 'https://example.com/docs/service-001.pdf'
      },
      {
        id: '2',
        vin: 'WBADT43452G808140',
        type: 'REPAIR_INVOICE',
        serviceDate: '2024-02-20',
        mileage: 47500,
        documentUrl: 'https://example.com/docs/repair-001.pdf'
      }
    ]
  }
};

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  // Handle health check
  if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', service: API_TYPE }));
    return;
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle API routes
  if (pathname === '/api/sales/documents' || pathname === '/api/service/documents') {
    const vin = query.vin;

    // Validate VIN
    if (!vin || vin.length !== 17) {
      res.writeHead(400);
      res.end(JSON.stringify({
        error: 'Invalid VIN',
        message: 'VIN must be exactly 17 characters'
      }));
      return;
    }

    // Simulate occasional API failures (10% chance)
    if (Math.random() < 0.1) {
      res.writeHead(503);
      res.end(JSON.stringify({
        error: 'Service Unavailable',
        message: 'API temporarily unavailable'
      }));
      return;
    }

    // Return mock data
    res.writeHead(200);
    const response = {
      vin: vin,
      documents: mockData[API_TYPE].documents.filter(doc => doc.vin === vin)
    };
    res.end(JSON.stringify(response));
    return;
  }

  // Handle 404
  res.writeHead(404);
  res.end(JSON.stringify({
    error: 'Not Found',
    message: `Route ${pathname} not found`
  }));
});

// Start server
server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Mock ${API_TYPE.toUpperCase()} API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] SIGTERM received, shutting down gracefully`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] SIGINT received, shutting down gracefully`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
