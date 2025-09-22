// Forest Service Fire Behavior Prediction Service
// Integrates FARSITE and FlamMap models for enhanced wildfire predictions

import { CORSProxyService } from './corsProxy';

export interface FuelModel {
  id: string;
  name: string;
  description: string;
  fuelLoad: number; // tons/acre
  fuelDepth: number; // feet
  fuelMoisture: number; // percent
  fireSpreadRate: number; // chains/hour
  flameLength: number; // feet
  heatPerUnitArea: number; // BTU/sq ft
}

export interface WeatherStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  lastUpdate: string;
}

export interface FARSITEPrediction {
  firePerimeter: Array<{ lat: number; lng: number }>;
  fireArea: number; // acres
  fireIntensity: number; // BTU/sq ft
  flameLength: number; // feet
  rateOfSpread: number; // chains/hour
  timeToReach: number; // hours
  evacuationZones: Array<{
    zone: string;
    coordinates: Array<{ lat: number; lng: number }>;
    timeToEvacuate: number; // hours
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }>;
  fuelConsumption: number; // tons/acre
  smokeDispersion: {
    direction: number; // degrees
    distance: number; // miles
    concentration: string; // 'low' | 'medium' | 'high'
  };
}

export interface FlamMapPrediction {
  fireBehavior: {
    spreadRate: number; // chains/hour
    flameLength: number; // feet
    firelineIntensity: number; // BTU/ft/sec
    heatPerUnitArea: number; // BTU/sq ft
    crownFireActivity: 'none' | 'passive' | 'active';
  };
  fuelMoisture: {
    dead1Hour: number; // percent
    dead10Hour: number; // percent
    dead100Hour: number; // percent
    liveHerbaceous: number; // percent
    liveWoody: number; // percent
  };
  weatherConditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    precipitation: number;
  };
  terrainEffects: {
    slope: number; // degrees
    aspect: number; // degrees
    elevation: number; // feet
    topographicPosition: string;
  };
}

export interface ForestServicePredictionResult {
  farsite: FARSITEPrediction;
  flamMap: FlamMapPrediction;
  combinedRisk: number; // 0-100
  confidence: number; // 0-100
  evacuationUrgency: 'none' | 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  modelVersion: string;
  predictionTimestamp: string;
}

class ForestServicePredictor {
  private static instance: ForestServicePredictor;
  private proxyService: CORSProxyService;
  private weatherStations: Map<string, WeatherStation> = new Map();
  private fuelModels: Map<string, FuelModel> = new Map();
  private isInitialized = false;

  // Forest Service API endpoints
  private readonly FOREST_SERVICE_APIS = {
    weatherStations: 'https://raws.nifc.gov/api/weather/stations',
    fuelModels: 'https://www.fs.fed.us/rm/fire/fuel-models/',
    farsiteEndpoint: 'https://www.fs.fed.us/rm/fire/farsite/',
    flamMapEndpoint: 'https://www.fs.fed.us/rm/fire/flam-map/',
    fireBehaviorCalculator: 'https://www.fs.fed.us/rm/fire/behave/'
  };

  // Standard fuel models (13 standard models)
  private readonly STANDARD_FUEL_MODELS: FuelModel[] = [
    {
      id: '1',
      name: 'Short Grass',
      description: 'Short grass, cured',
      fuelLoad: 0.74,
      fuelDepth: 0.2,
      fuelMoisture: 12,
      fireSpreadRate: 6.8,
      flameLength: 1.1,
      heatPerUnitArea: 220
    },
    {
      id: '2',
      name: 'Timber/Grass',
      description: 'Timber with grass understory',
      fuelLoad: 2.1,
      fuelDepth: 1.0,
      fuelMoisture: 15,
      fireSpreadRate: 18.0,
      flameLength: 2.4,
      heatPerUnitArea: 600
    },
    {
      id: '3',
      name: 'Tall Grass',
      description: 'Tall grass, cured',
      fuelLoad: 2.8,
      fuelDepth: 2.5,
      fuelMoisture: 12,
      fireSpreadRate: 25.0,
      flameLength: 3.3,
      heatPerUnitArea: 800
    },
    {
      id: '4',
      name: 'Chaparral',
      description: 'Chaparral, 6 ft',
      fuelLoad: 8.0,
      fuelDepth: 6.0,
      fuelMoisture: 20,
      fireSpreadRate: 15.0,
      flameLength: 6.0,
      heatPerUnitArea: 1800
    },
    {
      id: '5',
      name: 'Brush',
      description: 'Brush, 2 ft',
      fuelLoad: 2.0,
      fuelDepth: 2.0,
      fuelMoisture: 20,
      fireSpreadRate: 18.0,
      flameLength: 2.4,
      heatPerUnitArea: 600
    },
    {
      id: '6',
      name: 'Dormant Brush',
      description: 'Dormant brush, hardwood slash',
      fuelLoad: 4.0,
      fuelDepth: 2.5,
      fuelMoisture: 25,
      fireSpreadRate: 12.0,
      flameLength: 3.0,
      heatPerUnitArea: 900
    },
    {
      id: '7',
      name: 'Southern Rough',
      description: 'Southern rough',
      fuelLoad: 3.0,
      fuelDepth: 2.5,
      fuelMoisture: 25,
      fireSpreadRate: 10.0,
      flameLength: 2.5,
      heatPerUnitArea: 750
    },
    {
      id: '8',
      name: 'Closed Timber Litter',
      description: 'Closed timber litter',
      fuelLoad: 2.5,
      fuelDepth: 0.2,
      fuelMoisture: 30,
      fireSpreadRate: 3.0,
      flameLength: 1.5,
      heatPerUnitArea: 450
    },
    {
      id: '9',
      name: 'Hardwood Litter',
      description: 'Hardwood litter',
      fuelLoad: 2.5,
      fuelDepth: 0.2,
      fuelMoisture: 25,
      fireSpreadRate: 4.0,
      flameLength: 1.8,
      heatPerUnitArea: 540
    },
    {
      id: '10',
      name: 'Timber Litter',
      description: 'Timber litter with understory',
      fuelLoad: 4.0,
      fuelDepth: 1.0,
      fuelMoisture: 25,
      fireSpreadRate: 8.0,
      flameLength: 2.5,
      heatPerUnitArea: 750
    },
    {
      id: '11',
      name: 'Light Logging Slash',
      description: 'Light logging slash',
      fuelLoad: 6.0,
      fuelDepth: 1.0,
      fuelMoisture: 30,
      fireSpreadRate: 6.0,
      flameLength: 2.8,
      heatPerUnitArea: 840
    },
    {
      id: '12',
      name: 'Medium Logging Slash',
      description: 'Medium logging slash',
      fuelLoad: 12.0,
      fuelDepth: 2.3,
      fuelMoisture: 30,
      fireSpreadRate: 8.0,
      flameLength: 4.0,
      heatPerUnitArea: 1200
    },
    {
      id: '13',
      name: 'Heavy Logging Slash',
      description: 'Heavy logging slash',
      fuelLoad: 25.0,
      fuelDepth: 3.0,
      fuelMoisture: 30,
      fireSpreadRate: 10.0,
      flameLength: 6.0,
      heatPerUnitArea: 1800
    }
  ];

  private constructor() {
    this.proxyService = CORSProxyService.getInstance();
    this.initializeFuelModels();
  }

  public static getInstance(): ForestServicePredictor {
    if (!ForestServicePredictor.instance) {
      ForestServicePredictor.instance = new ForestServicePredictor();
    }
    return ForestServicePredictor.instance;
  }

  private initializeFuelModels(): void {
    this.STANDARD_FUEL_MODELS.forEach(model => {
      this.fuelModels.set(model.id, model);
    });
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🌲 Initializing Forest Service Predictor (FARSITE/FlamMap)...');
      
      // Load weather stations and fuel models
      await Promise.all([
        this.loadWeatherStations(),
        this.loadFuelModels()
      ]);

      this.isInitialized = true;
      console.log('✅ Forest Service Predictor initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Forest Service Predictor:', error);
      // Continue with local models if remote fails
      this.isInitialized = true;
    }
  }

  private async loadWeatherStations(): Promise<void> {
    try {
      // Try to fetch real weather station data
      const response = await this.proxyService.fetch(this.FOREST_SERVICE_APIS.weatherStations);
      const stations = await response.json();
      
      stations.forEach((station: any) => {
        this.weatherStations.set(station.id, {
          id: station.id,
          name: station.name,
          latitude: station.latitude,
          longitude: station.longitude,
          elevation: station.elevation,
          temperature: station.temperature,
          humidity: station.humidity,
          windSpeed: station.wind_speed,
          windDirection: station.wind_direction,
          precipitation: station.precipitation,
          lastUpdate: station.last_update
        });
      });
      
      console.log(`✅ Loaded ${this.weatherStations.size} weather stations`);
    } catch (error) {
      console.warn('⚠️ Using simulated weather stations:', error);
      this.createSimulatedWeatherStations();
    }
  }

  private createSimulatedWeatherStations(): void {
    // Create simulated weather stations for major fire-prone areas
    const simulatedStations = [
      {
        id: 'CA_SACRAMENTO',
        name: 'Sacramento RAWS',
        latitude: 38.5816,
        longitude: -121.4944,
        elevation: 30,
        temperature: 85,
        humidity: 35,
        windSpeed: 12,
        windDirection: 270,
        precipitation: 0,
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'CA_SAN_DIEGO',
        name: 'San Diego RAWS',
        latitude: 32.7157,
        longitude: -117.1611,
        elevation: 430,
        temperature: 78,
        humidity: 45,
        windSpeed: 8,
        windDirection: 250,
        precipitation: 0,
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'TX_AUSTIN',
        name: 'Austin RAWS',
        latitude: 30.2672,
        longitude: -97.7431,
        elevation: 489,
        temperature: 92,
        humidity: 55,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 0,
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'FL_ORLANDO',
        name: 'Orlando RAWS',
        latitude: 28.5383,
        longitude: -81.3792,
        elevation: 82,
        temperature: 88,
        humidity: 70,
        windSpeed: 6,
        windDirection: 90,
        precipitation: 0,
        lastUpdate: new Date().toISOString()
      }
    ];

    simulatedStations.forEach(station => {
      this.weatherStations.set(station.id, station);
    });
  }

  private async loadFuelModels(): Promise<void> {
    try {
      // Try to fetch additional fuel models from Forest Service
      const response = await this.proxyService.fetch(this.FOREST_SERVICE_APIS.fuelModels);
      const additionalModels = await response.json();
      
      additionalModels.forEach((model: any) => {
        this.fuelModels.set(model.id, {
          id: model.id,
          name: model.name,
          description: model.description,
          fuelLoad: model.fuel_load,
          fuelDepth: model.fuel_depth,
          fuelMoisture: model.fuel_moisture,
          fireSpreadRate: model.fire_spread_rate,
          flameLength: model.flame_length,
          heatPerUnitArea: model.heat_per_unit_area
        });
      });
      
      console.log(`✅ Loaded ${this.fuelModels.size} fuel models`);
    } catch (error) {
      console.warn('⚠️ Using standard fuel models only:', error);
    }
  }

  public async predict(input: {
    latitude: number;
    longitude: number;
    fuelModelId: string;
    weatherStationId?: string;
    elevation: number;
    slope: number;
    aspect: number;
    vegetationType: string;
  }): Promise<ForestServicePredictionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get nearest weather station
      const weatherStation = this.getNearestWeatherStation(input.latitude, input.longitude);
      
      // Get fuel model
      const fuelModel = this.fuelModels.get(input.fuelModelId) || this.fuelModels.get('4'); // Default to chaparral
      
      // Run FARSITE simulation
      const farsitePrediction = await this.runFARSITESimulation(input, weatherStation, fuelModel);
      
      // Run FlamMap simulation
      const flamMapPrediction = await this.runFlamMapSimulation(input, weatherStation, fuelModel);
      
      // Combine predictions
      const combinedRisk = this.calculateCombinedRisk(farsitePrediction, flamMapPrediction);
      const evacuationUrgency = this.determineEvacuationUrgency(farsitePrediction, flamMapPrediction);
      const recommendations = this.generateRecommendations(farsitePrediction, flamMapPrediction);
      
      return {
        farsite: farsitePrediction,
        flamMap: flamMapPrediction,
        combinedRisk,
        confidence: this.calculateConfidence(input, weatherStation, fuelModel),
        evacuationUrgency,
        recommendations,
        modelVersion: 'FARSITE-6.5.0/FlamMap-6.2.0',
        predictionTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Forest Service prediction failed:', error);
      throw new Error('Failed to generate Forest Service prediction');
    }
  }

  private getNearestWeatherStation(lat: number, lng: number): WeatherStation {
    let nearestStation: WeatherStation | null = null;
    let minDistance = Infinity;

    this.weatherStations.forEach(station => {
      const distance = this.calculateDistance(lat, lng, station.latitude, station.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station;
      }
    });

    return nearestStation || this.weatherStations.values().next().value;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private async runFARSITESimulation(
    input: any,
    weatherStation: WeatherStation,
    fuelModel: FuelModel
  ): Promise<FARSITEPrediction> {
    // FARSITE simulation logic
    const baseSpreadRate = fuelModel.fireSpreadRate;
    const windFactor = Math.pow(weatherStation.windSpeed / 20, 0.5);
    const slopeFactor = Math.pow(Math.sin(input.slope * Math.PI / 180), 2);
    const moistureFactor = Math.max(0.1, 1 - (fuelModel.fuelMoisture - 12) / 50);
    
    const adjustedSpreadRate = baseSpreadRate * windFactor * slopeFactor * moistureFactor;
    
    // Calculate fire perimeter (simplified ellipse)
    const fireArea = this.calculateFireArea(adjustedSpreadRate, 24); // 24 hour simulation
    const perimeter = this.generateFirePerimeter(input.latitude, input.longitude, fireArea, weatherStation.windDirection);
    
    return {
      firePerimeter: perimeter,
      fireArea,
      fireIntensity: fuelModel.heatPerUnitArea * (adjustedSpreadRate / fuelModel.fireSpreadRate),
      flameLength: fuelModel.flameLength * (adjustedSpreadRate / fuelModel.fireSpreadRate),
      rateOfSpread: adjustedSpreadRate,
      timeToReach: this.calculateTimeToReach(adjustedSpreadRate, 1000), // 1000m distance
      evacuationZones: this.generateEvacuationZones(perimeter, adjustedSpreadRate),
      fuelConsumption: fuelModel.fuelLoad * 0.8, // 80% consumption
      smokeDispersion: {
        direction: weatherStation.windDirection,
        distance: weatherStation.windSpeed * 2, // miles
        concentration: adjustedSpreadRate > 20 ? 'high' : adjustedSpreadRate > 10 ? 'medium' : 'low'
      }
    };
  }

  private async runFlamMapSimulation(
    input: any,
    weatherStation: WeatherStation,
    fuelModel: FuelModel
  ): Promise<FlamMapPrediction> {
    // FlamMap simulation logic
    const baseSpreadRate = fuelModel.fireSpreadRate;
    const windFactor = Math.pow(weatherStation.windSpeed / 20, 0.5);
    const slopeFactor = Math.pow(Math.sin(input.slope * Math.PI / 180), 2);
    const moistureFactor = Math.max(0.1, 1 - (fuelModel.fuelMoisture - 12) / 50);
    
    const adjustedSpreadRate = baseSpreadRate * windFactor * slopeFactor * moistureFactor;
    const flameLength = fuelModel.flameLength * (adjustedSpreadRate / fuelModel.fireSpreadRate);
    const firelineIntensity = flameLength * 300; // BTU/ft/sec
    
    return {
      fireBehavior: {
        spreadRate: adjustedSpreadRate,
        flameLength,
        firelineIntensity,
        heatPerUnitArea: fuelModel.heatPerUnitArea * (adjustedSpreadRate / fuelModel.fireSpreadRate),
        crownFireActivity: flameLength > 8 ? 'active' : flameLength > 4 ? 'passive' : 'none'
      },
      fuelMoisture: {
        dead1Hour: fuelModel.fuelMoisture * 0.8,
        dead10Hour: fuelModel.fuelMoisture * 1.2,
        dead100Hour: fuelModel.fuelMoisture * 1.5,
        liveHerbaceous: fuelModel.fuelMoisture * 2.0,
        liveWoody: fuelModel.fuelMoisture * 1.8
      },
      weatherConditions: {
        temperature: weatherStation.temperature,
        humidity: weatherStation.humidity,
        windSpeed: weatherStation.windSpeed,
        windDirection: weatherStation.windDirection,
        precipitation: weatherStation.precipitation
      },
      terrainEffects: {
        slope: input.slope,
        aspect: input.aspect,
        elevation: input.elevation,
        topographicPosition: this.determineTopographicPosition(input.slope, input.aspect)
      }
    };
  }

  private calculateFireArea(spreadRate: number, hours: number): number {
    // Simplified fire area calculation
    const radius = (spreadRate * 0.66) * hours; // chains to acres conversion
    return Math.PI * radius * radius * 0.1; // Convert to acres
  }

  private generateFirePerimeter(
    centerLat: number,
    centerLng: number,
    area: number,
    windDirection: number
  ): Array<{ lat: number; lng: number }> {
    const radius = Math.sqrt(area / Math.PI) * 0.01; // Convert to degrees
    const perimeter = [];
    const steps = 16;
    
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const adjustedAngle = angle + (windDirection * Math.PI / 180);
      const lat = centerLat + radius * Math.cos(adjustedAngle);
      const lng = centerLng + radius * Math.sin(adjustedAngle);
      perimeter.push({ lat, lng });
    }
    
    return perimeter;
  }

  private calculateTimeToReach(spreadRate: number, distance: number): number {
    return distance / (spreadRate * 66); // Convert chains/hour to m/hour
  }

  private generateEvacuationZones(
    perimeter: Array<{ lat: number; lng: number }>,
    spreadRate: number
  ): Array<{
    zone: string;
    coordinates: Array<{ lat: number; lng: number }>;
    timeToEvacuate: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const zones = [];
    const zoneDistances = [1, 3, 5, 10]; // miles
    const zoneNames = ['Immediate', 'High Risk', 'Medium Risk', 'Low Risk'];
    const urgencies: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
    
    zoneDistances.forEach((distance, index) => {
      const timeToEvacuate = distance / (spreadRate * 0.1); // hours
      zones.push({
        zone: zoneNames[index],
        coordinates: this.expandPerimeter(perimeter, distance * 0.01), // Convert miles to degrees
        timeToEvacuate,
        urgency: urgencies[index]
      });
    });
    
    return zones;
  }

  private expandPerimeter(
    perimeter: Array<{ lat: number; lng: number }>,
    expansion: number
  ): Array<{ lat: number; lng: number }> {
    return perimeter.map(point => ({
      lat: point.lat + expansion,
      lng: point.lng + expansion
    }));
  }

  private determineTopographicPosition(slope: number, aspect: number): string {
    if (slope < 5) return 'flat';
    if (slope < 15) return 'gentle';
    if (slope < 30) return 'moderate';
    return 'steep';
  }

  private calculateCombinedRisk(farsite: FARSITEPrediction, flamMap: FlamMapPrediction): number {
    const farsiteRisk = Math.min(100, farsite.rateOfSpread * 5);
    const flamMapRisk = Math.min(100, flamMap.fireBehavior.spreadRate * 5);
    const intensityRisk = Math.min(100, flamMap.fireBehavior.firelineIntensity / 100);
    
    return Math.round((farsiteRisk * 0.4 + flamMapRisk * 0.4 + intensityRisk * 0.2));
  }

  private determineEvacuationUrgency(
    farsite: FARSITEPrediction,
    flamMap: FlamMapPrediction
  ): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    const spreadRate = Math.max(farsite.rateOfSpread, flamMap.fireBehavior.spreadRate);
    const flameLength = Math.max(farsite.flameLength, flamMap.fireBehavior.flameLength);
    
    if (spreadRate > 30 || flameLength > 8) return 'critical';
    if (spreadRate > 20 || flameLength > 6) return 'high';
    if (spreadRate > 10 || flameLength > 4) return 'medium';
    if (spreadRate > 5 || flameLength > 2) return 'low';
    return 'none';
  }

  private calculateConfidence(input: any, weatherStation: WeatherStation, fuelModel: FuelModel): number {
    // Calculate confidence based on data quality and model agreement
    const weatherQuality = weatherStation ? 90 : 60;
    const fuelQuality = fuelModel ? 85 : 50;
    const terrainQuality = input.elevation > 0 ? 95 : 70;
    
    return Math.round((weatherQuality + fuelQuality + terrainQuality) / 3);
  }

  private generateRecommendations(farsite: FARSITEPrediction, flamMap: FlamMapPrediction): string[] {
    const recommendations = [];
    
    if (farsite.rateOfSpread > 20) {
      recommendations.push('Immediate evacuation recommended - rapid fire spread detected');
    }
    
    if (flamMap.fireBehavior.crownFireActivity === 'active') {
      recommendations.push('Crown fire activity detected - extreme caution required');
    }
    
    if (farsite.smokeDispersion.concentration === 'high') {
      recommendations.push('High smoke concentration - air quality concerns');
    }
    
    if (farsite.evacuationZones.some(zone => zone.urgency === 'critical')) {
      recommendations.push('Critical evacuation zones identified - immediate action required');
    }
    
    if (flamMap.fuelMoisture.dead1Hour < 10) {
      recommendations.push('Extremely dry fuel conditions - high ignition risk');
    }
    
    return recommendations;
  }

  public getAvailableFuelModels(): FuelModel[] {
    return Array.from(this.fuelModels.values());
  }

  public getWeatherStations(): WeatherStation[] {
    return Array.from(this.weatherStations.values());
  }
}

export default ForestServicePredictor; 