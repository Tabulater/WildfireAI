import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchWeatherData, calculateFireRisk, generateAlert, WeatherData, FireRisk, Alert } from '@/services/api';
import { Thermometer, Droplets, Wind, Eye, AlertTriangle } from 'lucide-react';

interface WeatherWidgetProps {
  lat: number;
  lon: number;
  location: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ lat, lon, location }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState<FireRisk | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);

  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        setLoading(true);
        const [weather, risk, alertData] = await Promise.all([
          fetchWeatherData(lat, lon),
          calculateFireRisk(lat, lon),
          generateAlert(lat, lon)
        ]);
        
        setWeatherData(weather);
        setRiskData(risk);
        setAlert(alertData);
      } catch (error) {
        console.error('Error loading weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWeatherData();
  }, [lat, lon]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskTextColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!weatherData || !riskData) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Unable to load weather data</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Weather Conditions</h3>
        <Badge variant="outline" className="text-xs">
          {location}
        </Badge>
      </div>

      {/* Current Weather */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <Thermometer className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{Math.round(weatherData.temperature)}°C</p>
            <p className="text-sm text-muted-foreground">Temperature</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <Droplets className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{Math.round(weatherData.humidity)}%</p>
            <p className="text-sm text-muted-foreground">Humidity</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <Wind className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{Math.round(weatherData.windSpeed)} mph</p>
            <p className="text-sm text-muted-foreground">Wind Speed</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <Eye className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{Math.round(weatherData.visibility)} km</p>
            <p className="text-sm text-muted-foreground">Visibility</p>
          </div>
        </div>
      </div>

      {/* Fire Risk Assessment */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Fire Risk Assessment</h4>
          <Badge className={`${getRiskColor(riskData.riskLevel)} text-white`}>
            {riskData.riskLevel.toUpperCase()}
          </Badge>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Risk Score</span>
            <span className={`font-semibold ${getRiskTextColor(riskData.riskLevel)}`}>
              {Math.round(riskData.score)}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getRiskColor(riskData.riskLevel)}`}
              style={{ width: `${riskData.score}%` }}
            ></div>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="flex justify-between">
            <span>Weather:</span>
            <span className="font-medium">{Math.round(riskData.factors.weather)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Vegetation:</span>
            <span className="font-medium">{Math.round(riskData.factors.vegetation)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Topography:</span>
            <span className="font-medium">{Math.round(riskData.factors.topography)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Human Activity:</span>
            <span className="font-medium">{Math.round(riskData.factors.human)}%</span>
          </div>
        </div>

        {/* Recommendations */}
        {riskData.recommendations && riskData.recommendations.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <h5 className="font-medium text-sm mb-2">Recommendations:</h5>
            <ul className="text-xs space-y-1">
              {riskData.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-muted-foreground">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Active Alert */}
      {alert && (
        <div className="border-t pt-4 mt-4">
          <div className={`p-3 rounded-lg bg-${getRiskColor(alert.severity).replace('bg-', '')}/10 border border-${getRiskColor(alert.severity).replace('bg-', '')}/20`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-4 w-4 ${getRiskTextColor(alert.severity)}`} />
              <h5 className="font-semibold text-sm">{alert.title}</h5>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                Expires: {new Date(alert.expiresAt).toLocaleString()}
              </span>
              {alert.actionRequired && (
                <Badge variant="destructive" className="text-xs">
                  Action Required
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground mt-4 text-center">
        Last updated: {new Date(weatherData.timestamp).toLocaleString()}
      </div>
    </Card>
  );
};
