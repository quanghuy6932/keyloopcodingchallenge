/**
 * Dependency Injection Container Setup
 * Configures tsyringe DI container with all service registrations
 */

import { container } from 'tsyringe';
import { ValidationService } from '../application/services/ValidationService';
import { DocumentSearchService } from '../application/services/DocumentSearchService';
import { ExternalAPIOrchestrator } from '../application/services/ExternalAPIOrchestrator';
import { DocumentSearchController } from '../interface-adapters/controllers/DocumentSearchController';
import { SearchHistoryRepository } from '../interface-adapters/repositories/SearchHistoryRepository';
import { SalesSystemAPIClient } from '../interface-adapters/external-clients/SalesSystemAPIClient';
import { ServiceSystemAPIClient } from '../interface-adapters/external-clients/ServiceSystemAPIClient';
import { ISalesSystemAPIClient } from '../interface-adapters/external-clients/ISalesSystemAPIClient';
import { IServiceSystemAPIClient } from '../interface-adapters/external-clients/IServiceSystemAPIClient';
import { WinstonLogger } from '../frameworks/logger/Logger';

export function setupDIContainer(): void {
  // Register Logger first (as it's a dependency for others)
  container.registerSingleton('Logger', WinstonLogger);
  
  // Register Repositories
  container.registerSingleton('SearchHistoryRepository', SearchHistoryRepository);
  
  // Register External API Clients (with interface bindings)
  container.registerSingleton<ISalesSystemAPIClient>(
    'SalesSystemAPIClient',
    SalesSystemAPIClient
  );
  container.registerSingleton<IServiceSystemAPIClient>(
    'ServiceSystemAPIClient',
    ServiceSystemAPIClient
  );
  
  // Register Services (depend on repositories, clients, logger)
  container.registerSingleton('ValidationService', ValidationService);
  container.registerSingleton('ExternalAPIOrchestrator', ExternalAPIOrchestrator);
  container.registerSingleton('DocumentSearchService', DocumentSearchService);
  
  // Register Controllers (depend on services)
  container.registerSingleton('DocumentSearchController', DocumentSearchController);
}
