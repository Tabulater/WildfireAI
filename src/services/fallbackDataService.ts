// Fallback Data Service for ML Training
// Provides synthetic wildfire data when large CSV files are not available

import { ProcessedFireData } from './dataProcessor';

export interface SyntheticDataConfig {
  numSamples: number;
  includeFires: boolean;
  geographicBounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

class FallbackDataService {
  private static instance: FallbackDataService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): FallbackDataService {
    if (!FallbackDataService.instance) {
      FallbackDataService.instance = new FallbackDataService();
    }
    return FallbackDataService.instance;
  }

  public async generateSyntheticData(config: SyntheticDataConfig = {
    numSamples: 10000,
    includeFires: true,
    geographicBounds: {
      minLat: 32.0,
      maxLat: 42.0,
      minLng: -125.0,
      maxLng: -114.0
    }
  }): Promise<ProcessedFireData[]> {
    console.log(`🔄 Generating ${config.numSamples} synthetic wildfire data points...`);
    
    const syntheticData: ProcessedFireData[] = [];
    const fireRate = config.includeFires ? 0.15 : 0.05; // 15% fire rate for realistic data
    
    for (let i = 0; i < config.numSamples; i++) {
      const dataPoint = this.generateSingleDataPoint(config.geographicBounds, fireRate);
      syntheticData.push(dataPoint);
    }

    console.log(`✅ Generated ${syntheticData.length} synthetic data points`);
    return syntheticData;
  }

  private generateSingleDataPoint(bounds: any, fireRate: number): ProcessedFireData {
    const latitude = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
    const longitude = bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng);
    const temperature = 15 + Math.random() * 25; // 15-40°C
    const humidity = 20 + Math.random() * 60; // 20-80%
    const windSpeed = 0 + Math.random() * 30; // 0-30 m/s
    const windDirection = Math.random() * 360;
    const pressure = 1000 + Math.random() * 50; // 1000-1050 hPa
    const rainfall = Math.random() * 20; // 0-20 mm
    const elevation = 0 + Math.random() * 3000; // 0-3000m
    const slope = Math.random() * 45; // 0-45 degrees
    
    // Fire weather indices
    const FFMC = 70 + Math.random() * 30; // Fine Fuel Moisture Code
    const DMC = 50 + Math.random() * 150; // Duff Moisture Code
    const DC = 200 + Math.random() * 600; // Drought Code
    const ISI = 3 + Math.random() * 20; // Initial Spread Index
    
    const brightness = 300 + Math.random() * 200;
    const frp = Math.random() * 100; // Fire Radiative Power
    const confidence = 70 + Math.random() * 30;
    
    const month = this.getRandomMonth();
    const day = this.getRandomDay();
    const acq_date = `2023-${this.getMonthNumber(month)}-${this.getDayNumber(day)}`;
    
    const fireOccurred = Math.random() < fireRate;
    const area = fireOccurred ? Math.random() * 1000 : 0; // 0-1000 acres if fire occurred
    
    return {
      latitude,
      longitude,
      temperature,
      humidity,
      windSpeed,
      windDirection,
      pressure,
      rainfall,
      elevation,
      slope,
      vegetationType: this.getRandomVegetationType(),
      fuelMoisture: 5 + Math.random() * 15, // 5-20%
      fireHistory: Math.random() * 10, // 0-10 previous fires
      seasonalRisk: this.calculateSeasonalRisk(month),
      droughtIndex: this.calculateDroughtIndex(DC),
      FFMC,
      DMC,
      DC,
      ISI,
      brightness,
      frp,
      confidence,
      month,
      day,
      acq_date,
      acq_time: '12:00',
      area,
      fireOccurred,
      fireIntensity: this.calculateFireIntensity(area, brightness)
    };
  }

  private getRandomMonth(): string {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                   'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return months[Math.floor(Math.random() * months.length)];
  }

  private getRandomDay(): string {
    return String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  }

  private getMonthNumber(month: string): string {
    const months: { [key: string]: string } = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    return months[month] || '06';
  }

  private getDayNumber(day: string): string {
    return day.padStart(2, '0');
  }

  private getRandomVegetationType(): string {
    const types = ['forest', 'grassland', 'shrubland', 'mixed', 'wetland'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private calculateSeasonalRisk(month: string): number {
    const seasonalRisks: { [key: string]: number } = {
      'jan': 0.2, 'feb': 0.3, 'mar': 0.4, 'apr': 0.5,
      'may': 0.6, 'jun': 0.8, 'jul': 0.9, 'aug': 0.9,
      'sep': 0.8, 'oct': 0.6, 'nov': 0.4, 'dec': 0.3
    };
    return seasonalRisks[month] || 0.5;
  }

  private calculateDroughtIndex(dc: number): number {
    // Normalize DC (200-800) to drought index (0-1)
    return Math.min(1, Math.max(0, (dc - 200) / 600));
  }

  private calculateFireIntensity(area: number, brightness: number): number {
    if (area === 0) return 0;
    // Calculate fire intensity based on area and brightness
    return Math.min(10, (area * brightness) / 10000);
  }

  public getDataStatistics(): { totalSamples: number; fireSamples: number; noFireSamples: number } {
    return {
      totalSamples: 10000,
      fireSamples: 1500,
      noFireSamples: 8500
    };
  }
}

export default FallbackDataService;
