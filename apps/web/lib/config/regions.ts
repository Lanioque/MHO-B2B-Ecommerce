/**
 * Region Strategy Pattern
 * Implements OCP - extensible without modifying existing code
 */

import { ZohoRegion, ZohoRegionConfig, ZOHO_REGION_CONFIGS } from './index';

export interface IRegionStrategy {
  getAuthUrl(): string;
  getApiUrl(): string;
  getRegion(): ZohoRegion;
}

export class RegionStrategy implements IRegionStrategy {
  constructor(
    private readonly region: ZohoRegion,
    private readonly config: ZohoRegionConfig
  ) {}

  getAuthUrl(): string {
    return this.config.authUrl;
  }

  getApiUrl(): string {
    return this.config.apiUrl;
  }

  getRegion(): ZohoRegion {
    return this.region;
  }
}

export class RegionStrategyFactory {
  private static strategies: Map<ZohoRegion, IRegionStrategy> = new Map();

  static getStrategy(region: ZohoRegion): IRegionStrategy {
    if (!this.strategies.has(region)) {
      const config = ZOHO_REGION_CONFIGS[region];
      if (!config) {
        throw new Error(`Unsupported region: ${region}`);
      }
      this.strategies.set(region, new RegionStrategy(region, config));
    }
    return this.strategies.get(region)!;
  }

  static registerCustomRegion(
    region: ZohoRegion,
    strategy: IRegionStrategy
  ): void {
    this.strategies.set(region, strategy);
  }
}


