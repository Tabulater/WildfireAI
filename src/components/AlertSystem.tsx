import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchFireData, fetchWeatherData, calculateFireRisk, generateAlert, Alert, US_STATES } from '@/services/api';
import { AlertTriangle, Bell, Shield, MapPin, Clock } from 'lucide-react';

interface AlertSystemProps {
  stateCode?: string;
}

export const AlertSystem: React.FC<AlertSystemProps> = ({ stateCode }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const targetLocations = useMemo(() => {
    if (stateCode) {
      const st = US_STATES.find(s => s.code === stateCode);
      if (st) {
        // Use state regions or center
        const regions = st.regions && st.regions.length > 0 ? st.regions : [{ name: st.name + ' Central', lat: st.center.lat, lng: st.center.lng } as any];
        return regions.map((r: any) => ({ name: `${r.name}, ${st.code}`, lat: r.lat, lon: r.lng }));
      }
    }
    return [
      { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
      { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
      { name: 'Sacramento, CA', lat: 38.5816, lon: -121.4944 },
      { name: 'Phoenix, AZ', lat: 33.4484, lon: -112.0740 },
      { name: 'Denver, CO', lat: 39.7392, lon: -104.9903 },
      { name: 'Portland, OR', lat: 45.5152, lon: -122.6784 }
    ];
  }, [stateCode]);

  useEffect(() => {
    const generateAlerts = async () => {
      try {
        const newAlerts: Alert[] = [];

        for (const city of targetLocations) {
          try {
            const alert = await generateAlert(city.lat, city.lon);
            if (alert) {
              // Attach more specific location label
              alert.location.address = city.name;
              newAlerts.push(alert);
            }
          } catch (error) {
            console.error(`Error generating alert for ${city.name}:`, error);
          }
        }

        // Sort by severity (most severe first)
        const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        newAlerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
        setAlerts(newAlerts);
      } catch (error) {
        console.error('Error generating alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    generateAlerts();
    
    // Refresh alerts every 30 minutes
    const interval = setInterval(generateAlerts, 1800000);
    return () => clearInterval(interval);
  }, [targetLocations]);

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔥';
      case 'high': return '⚠️';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '�';
    }
  };

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red-500';
      case 'high': return 'orange-500';
      case 'medium': return 'yellow-500';
      case 'low': return 'green-500';
      default: return 'gray-500';
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-card/90 backdrop-blur">
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card/90 backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm">🚨 Fire Risk Alerts</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            Live Updates
          </Badge>
        </div>
        
        <div className="space-y-3">
          {alerts.map((alertData) => (
            <Card 
              key={alertData.id} 
              className={`p-3 bg-${getSeverityColor(alertData.severity)}/10 border-${getSeverityColor(alertData.severity)} relative overflow-hidden`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getAlertIcon(alertData.severity)}</span>
                  <div>
                    <h4 className="font-bold text-sm">{alertData.severity.toUpperCase()} RISK</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {alertData.location.address}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getAlertVariant(alertData.severity) as any} className="text-xs">
                    {alertData.severity.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(alertData.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
              
              <p className="text-xs mb-3 opacity-90">{alertData.message}</p>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-background/50 p-2 rounded">
                  <p className="font-medium">{alertData.type.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-muted-foreground">Type</p>
                </div>
                <div className="bg-background/50 p-2 rounded">
                  <p className="font-medium">{Math.round(alertData.affectedRadius)} km</p>
                  <p className="text-muted-foreground">Radius</p>
                </div>
                <div className="bg-background/50 p-2 rounded">
                  <p className="font-medium">{alertData.actionRequired ? 'YES' : 'NO'}</p>
                  <p className="text-muted-foreground">Action Required</p>
                </div>
              </div>

              {alertData.severity === 'critical' && (
                <div className="absolute top-0 right-0 w-2 h-full bg-red-500 animate-pulse"></div>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded text-xs">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-3 w-3" />
            <span className="font-medium">Alert Levels</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-fire-danger rounded-full"></div>
              <span>EXTREME (80%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-fire-warning rounded-full"></div>
              <span>HIGH (60-79%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-fire-yellow rounded-full"></div>
              <span>MODERATE (40-59%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-fire-safe rounded-full"></div>
              <span>LOW (0-39%)</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};