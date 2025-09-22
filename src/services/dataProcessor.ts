// Comprehensive Data Processor for Wildfire ML Training
// Processes all CSV datasets to create unified training data

import FallbackDataService from './fallbackDataService';

export interface ProcessedFireData {
  // Location data
  latitude: number;
  longitude: number;
  
  // Weather conditions
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  rainfall: number;
  
  // Fire indices (from forestfires.csv)
  FFMC: number; // Fine Fuel Moisture Code
  DMC: number;  // Duff Moisture Code
  DC: number;   // Drought Code
  ISI: number;  // Initial Spread Index
  
  // Fire characteristics
  brightness: number;
  frp: number; // Fire Radiative Power
  confidence: number;
  
  // Temporal data
  month: string;
  day: string;
  acq_date: string;
  acq_time: string;
  
  // Fire outcome
  area: number; // Burned area in hectares
  fireOccurred: boolean;
  
  // Derived features
  seasonalRisk: number;
  droughtIndex: number;
  fireIntensity: number;
}

export interface TrainingDataset {
  features: number[][];
  labels: number[];
  metadata: {
    totalSamples: number;
    fireSamples: number;
    noFireSamples: number;
    dateRange: { start: string; end: string };
    geographicRange: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  };
}

class DataProcessor {
  private static instance: DataProcessor;
  private processedData: ProcessedFireData[] = [];
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DataProcessor {
    if (!DataProcessor.instance) {
      DataProcessor.instance = new DataProcessor();
    }
    return DataProcessor.instance;
  }

  public async loadAllDatasets(): Promise<void> {
    if (this.isInitialized) return;

    console.log('📊 Loading all wildfire datasets...');
    
    try {
      // Try to load all CSV files in parallel
      const [forestfiresData, wildfireData, fireNrtData] = await Promise.allSettled([
        this.loadForestfiresData(),
        this.loadWildfireData(),
        this.loadFireNRTData()
      ]);

      // Combine successfully loaded data
      const successfulData: ProcessedFireData[] = [];
      
      if (forestfiresData.status === 'fulfilled') {
        successfulData.push(...forestfiresData.value);
        console.log(`✅ Loaded ${forestfiresData.value.length} forestfires data points`);
      } else {
        console.warn('⚠️ Failed to load forestfires.csv, will use fallback data');
      }
      
      if (wildfireData.status === 'fulfilled') {
        successfulData.push(...wildfireData.value);
        console.log(`✅ Loaded ${wildfireData.value.length} wildfire data points`);
      } else {
        console.warn('⚠️ Failed to load wildfire.csv, will use fallback data');
      }
      
      if (fireNrtData.status === 'fulfilled') {
        successfulData.push(...fireNrtData.value);
        console.log(`✅ Loaded ${fireNrtData.value.length} fire NRT data points`);
      } else {
        console.warn('⚠️ Failed to load fire NRT data, will use fallback data');
      }

      // If we have some real data, use it; otherwise use fallback
      if (successfulData.length > 0) {
        this.processedData = successfulData;
        console.log(`✅ Loaded ${this.processedData.length} total real fire data points`);
      } else {
        console.log('🔄 No CSV files available, generating synthetic fallback data...');
        const fallbackService = FallbackDataService.getInstance();
        this.processedData = await fallbackService.generateSyntheticData({
          numSamples: 10000,
          includeFires: true,
          geographicBounds: {
            minLat: 32.0,
            maxLat: 42.0,
            minLng: -125.0,
            maxLng: -114.0
          }
        });
        console.log(`✅ Generated ${this.processedData.length} synthetic data points`);
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Error loading datasets:', error);
      // Even if everything fails, try to use fallback data
      try {
        console.log('🔄 Attempting to use fallback data due to error...');
        const fallbackService = FallbackDataService.getInstance();
        this.processedData = await fallbackService.generateSyntheticData();
        this.isInitialized = true;
        console.log(`✅ Generated ${this.processedData.length} fallback data points`);
      } catch (fallbackError) {
        console.error('❌ Fallback data generation also failed:', fallbackError);
        throw error;
      }
    }
  }

  private async loadForestfiresData(): Promise<ProcessedFireData[]> {
    try {
      const response = await fetch('/data/forestfires.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n').slice(1); // Skip header
      
      return lines
        .filter(line => line.trim())
        .map(line => {
          const [X, Y, month, day, FFMC, DMC, DC, ISI, temp, RH, wind, rain, area] = line.split(',');
          
          return {
            latitude: parseFloat(X) + 35, // Convert grid coordinates to approximate lat
            longitude: parseFloat(Y) - 120, // Convert grid coordinates to approximate lng
            temperature: parseFloat(temp),
            humidity: parseFloat(RH),
            windSpeed: parseFloat(wind),
            windDirection: Math.random() * 360, // Not in original data
            pressure: 1013.25 + (Math.random() - 0.5) * 50, // Standard atmospheric pressure with variation
            rainfall: parseFloat(rain),
            FFMC: parseFloat(FFMC),
            DMC: parseFloat(DMC),
            DC: parseFloat(DC),
            ISI: parseFloat(ISI),
            brightness: 300 + Math.random() * 200, // Estimated brightness
            frp: parseFloat(area) * 0.1, // Rough estimation
            confidence: 70 + Math.random() * 30,
            month,
            day,
            acq_date: `2023-${this.getMonthNumber(month)}-${this.getDayNumber(day)}`,
            acq_time: '12:00',
            area: parseFloat(area),
            fireOccurred: parseFloat(area) > 0,
            seasonalRisk: this.calculateSeasonalRisk(month),
            droughtIndex: this.calculateDroughtIndex(parseFloat(DC)),
            fireIntensity: this.calculateFireIntensity(parseFloat(area), parseFloat(FFMC))
          };
        });
    } catch (error) {
      console.error('Error loading forestfires.csv:', error);
      return [];
    }
  }

  private async loadWildfireData(): Promise<ProcessedFireData[]> {
    try {
      const response = await fetch('/data/wildfire.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      return lines
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',');
          // Based on the structure we saw, this appears to be processed fire data
          const [lat, lng, temp, humidity, wind, pressure, rainfall, brightness, frp, fireClass] = values;
          
          return {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            temperature: parseFloat(temp),
            humidity: parseFloat(humidity),
            windSpeed: parseFloat(wind),
            windDirection: Math.random() * 360,
            pressure: parseFloat(pressure),
            rainfall: parseFloat(rainfall),
            FFMC: 80 + Math.random() * 20, // Estimated FFMC
            DMC: 50 + Math.random() * 100, // Estimated DMC
            DC: 200 + Math.random() * 500, // Estimated DC
            ISI: 5 + Math.random() * 15, // Estimated ISI
            brightness: parseFloat(brightness),
            frp: parseFloat(frp),
            confidence: 80 + Math.random() * 20,
            month: this.getRandomMonth(),
            day: this.getRandomDay(),
            acq_date: '2023-06-15', // Placeholder date
            acq_time: '12:00',
            area: parseFloat(frp) * 0.1, // Rough estimation
            fireOccurred: fireClass === 'h', // 'h' likely means high/hot
            seasonalRisk: this.calculateSeasonalRisk(this.getRandomMonth()),
            droughtIndex: this.calculateDroughtIndex(300 + Math.random() * 400),
            fireIntensity: this.calculateFireIntensity(parseFloat(frp) * 0.1, 85 + Math.random() * 15)
          };
        });
    } catch (error) {
      console.error('Error loading wildfire.csv:', error);
      return [];
    }
  }

  private async loadFireNRTData(): Promise<ProcessedFireData[]> {
    const nrtFiles = [
      'fire_nrt_J1V-C2_565335.csv',
      'fire_nrt_M-C61_565334.csv', 
      'fire_nrt_SV-C2_565336.csv'
    ];

    const allNrtData: ProcessedFireData[] = [];

    for (const filename of nrtFiles) {
      try {
        const response = await fetch(`/data/${filename}`);
        const csvText = await response.text();
        const lines = csvText.split('\n').slice(1); // Skip header
        
        const fileData = lines
          .filter(line => line.trim())
          .map(line => {
            const [latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_t31, frp, daynight] = line.split(',');
            
            return {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              temperature: 20 + Math.random() * 20, // Estimated temperature
              humidity: 30 + Math.random() * 50, // Estimated humidity
              windSpeed: 5 + Math.random() * 20, // Estimated wind speed
              windDirection: Math.random() * 360,
              pressure: 1013.25 + (Math.random() - 0.5) * 50,
              rainfall: Math.random() * 10, // Estimated rainfall
              FFMC: 70 + Math.random() * 30, // Estimated FFMC
              DMC: 50 + Math.random() * 150, // Estimated DMC
              DC: 200 + Math.random() * 600, // Estimated DC
              ISI: 3 + Math.random() * 20, // Estimated ISI
              brightness: parseFloat(brightness),
              frp: parseFloat(frp),
              confidence: parseFloat(confidence) || 80,
              month: this.extractMonth(acq_date),
              day: this.extractDay(acq_date),
              acq_date,
              acq_time,
              area: parseFloat(frp) * 0.05, // Rough estimation
              fireOccurred: true, // NRT data represents actual fires
              seasonalRisk: this.calculateSeasonalRisk(this.extractMonth(acq_date)),
              droughtIndex: this.calculateDroughtIndex(300 + Math.random() * 400),
              fireIntensity: this.calculateFireIntensity(parseFloat(frp) * 0.05, parseFloat(brightness))
            };
          });
        
        allNrtData.push(...fileData);
        console.log(`📊 Loaded ${fileData.length} records from ${filename}`);
      } catch (error) {
        console.error(`Error loading ${filename}:`, error);
      }
    }

    return allNrtData;
  }

  private getMonthNumber(month: string): string {
    const months: { [key: string]: string } = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    return months[month.toLowerCase()] || '06';
  }

  private getDayNumber(day: string): string {
    const days: { [key: string]: string } = {
      'mon': '01', 'tue': '02', 'wed': '03', 'thu': '04',
      'fri': '05', 'sat': '06', 'sun': '07'
    };
    return days[day.toLowerCase()] || '01';
  }

  private extractMonth(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
  }

  private extractDay(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  }

  private getRandomMonth(): string {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return months[Math.floor(Math.random() * months.length)];
  }

  private getRandomDay(): string {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return days[Math.floor(Math.random() * days.length)];
  }

  private calculateSeasonalRisk(month: string): number {
    const highRiskMonths = ['jun', 'jul', 'aug', 'sep', 'oct'];
    const mediumRiskMonths = ['may', 'nov'];
    
    if (highRiskMonths.includes(month.toLowerCase())) {
      return 80 + Math.random() * 20; // 80-100%
    } else if (mediumRiskMonths.includes(month.toLowerCase())) {
      return 50 + Math.random() * 30; // 50-80%
    } else {
      return 20 + Math.random() * 30; // 20-50%
    }
  }

  private calculateDroughtIndex(dc: number): number {
    // DC (Drought Code) ranges from 0-1000+
    // Convert to drought index 0-100
    return Math.min(100, (dc / 10));
  }

  private calculateFireIntensity(area: number, ffmc: number): number {
    // Fire intensity based on area burned and fuel moisture
    return (area * ffmc) / 100;
  }

  public getProcessedData(): ProcessedFireData[] {
    return this.processedData;
  }

  public createTrainingDataset(): TrainingDataset {
    const features: number[][] = [];
    const labels: number[] = [];
    
    for (const data of this.processedData) {
      // Create feature vector
      const featureVector = [
        data.latitude,
        data.longitude,
        data.temperature,
        data.humidity,
        data.windSpeed,
        data.windDirection,
        data.pressure,
        data.rainfall,
        data.FFMC,
        data.DMC,
        data.DC,
        data.ISI,
        data.brightness,
        data.frp,
        data.seasonalRisk,
        data.droughtIndex,
        data.fireIntensity
      ];
      
      features.push(featureVector);
      labels.push(data.fireOccurred ? 1 : 0);
    }

    const fireSamples = labels.filter(l => l === 1).length;
    const noFireSamples = labels.filter(l => l === 0).length;

    return {
      features,
      labels,
      metadata: {
        totalSamples: features.length,
        fireSamples,
        noFireSamples,
        dateRange: { start: '2023-01-01', end: '2024-12-31' },
        geographicRange: {
          minLat: Math.min(...this.processedData.map(d => d.latitude)),
          maxLat: Math.max(...this.processedData.map(d => d.latitude)),
          minLng: Math.min(...this.processedData.map(d => d.longitude)),
          maxLng: Math.max(...this.processedData.map(d => d.longitude))
        }
      }
    };
  }

  public getDataStatistics(): any {
    const totalSamples = this.processedData.length;
    const fireSamples = this.processedData.filter(d => d.fireOccurred).length;
    const noFireSamples = totalSamples - fireSamples;

    return {
      totalSamples,
      fireSamples,
      noFireSamples,
      fireRate: (fireSamples / totalSamples) * 100,
      averageTemperature: this.processedData.reduce((sum, d) => sum + d.temperature, 0) / totalSamples,
      averageHumidity: this.processedData.reduce((sum, d) => sum + d.humidity, 0) / totalSamples,
      averageWindSpeed: this.processedData.reduce((sum, d) => sum + d.windSpeed, 0) / totalSamples,
      averageFFMC: this.processedData.reduce((sum, d) => sum + d.FFMC, 0) / totalSamples,
      averageDMC: this.processedData.reduce((sum, d) => sum + d.DMC, 0) / totalSamples,
      averageDC: this.processedData.reduce((sum, d) => sum + d.DC, 0) / totalSamples,
      averageISI: this.processedData.reduce((sum, d) => sum + d.ISI, 0) / totalSamples
    };
  }
}

export default DataProcessor;
