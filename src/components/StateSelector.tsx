import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { US_STATES, StateRegion } from '@/services/api';
import { MapPin, Camera, Flame, AlertTriangle } from 'lucide-react';

interface StateSelectorProps {
  selectedState: string;
  onStateChange: (stateCode: string) => void;
  className?: string;
  fireCount?: number;
  cameraCount?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export const StateSelector: React.FC<StateSelectorProps> = ({
  selectedState,
  onStateChange,
  className = '',
  fireCount = 0,
  cameraCount = 0,
  riskLevel = 'medium'
}) => {
  const currentState = US_STATES.find(state => state.code === selectedState);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical': return '🔥';
      case 'high': return '⚠️';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '❓';
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">State Selection</h3>
        </div>
        <Badge className={getRiskColor(riskLevel)}>
          {getRiskIcon(riskLevel)} {riskLevel.toUpperCase()} RISK
        </Badge>
      </div>

      {/* State Selector */}
      <div className="mb-4">
        <Select value={selectedState} onValueChange={onStateChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a state" />
          </SelectTrigger>
          <SelectContent>
            {US_STATES.map((state) => (
              <SelectItem key={state.code} value={state.code}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{state.name}</span>
                  <span className="text-xs text-muted-foreground">({state.code})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current State Info */}
      {currentState && (
        <div className="space-y-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-lg">{currentState.name}</h4>
            <p className="text-sm text-muted-foreground">
              {currentState.regions.length} regions monitored
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-background rounded border">
              <Flame className="h-4 w-4 text-red-500" />
              <div>
                <p className="font-semibold text-sm">{fireCount}</p>
                <p className="text-xs text-muted-foreground">Active Fires</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-background rounded border">
              <Camera className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-semibold text-sm">{cameraCount}</p>
                <p className="text-xs text-muted-foreground">Cameras</p>
              </div>
            </div>
          </div>

          {/* Regions */}
          <div>
            <h5 className="font-medium text-sm mb-2">Monitored Regions:</h5>
            <div className="flex flex-wrap gap-1">
              {currentState.regions.map((region, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {region.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // This would center the map on the state
                window.postMessage({ 
                  type: 'CENTER_MAP', 
                  payload: { 
                    lat: currentState.center.lat, 
                    lng: currentState.center.lng, 
                    zoom: currentState.zoom 
                  } 
                }, '*');
              }}
            >
              Center Map
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                window.open(
                  `https://www.google.com/search?q=${encodeURIComponent(currentState.name + ' wildfire news')}`,
                  '_blank'
                );
              }}
            >
              Latest News
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
