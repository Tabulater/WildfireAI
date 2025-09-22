import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, Flame, Wind, Thermometer, Droplets } from 'lucide-react';

interface ForestServicePredictionProps {
  predictions: Array<{
    id: string;
    latitude: number;
    longitude: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    probability: number;
    confidence: number;
    forestServiceData?: {
      farsiteSpreadRate: number;
      flamMapFlameLength: number;
      crownFireActivity: 'none' | 'passive' | 'active';
      evacuationUrgency: 'none' | 'low' | 'medium' | 'high' | 'critical';
      recommendations: string[];
    };
  }>;
}

export const ForestServicePredictions: React.FC<ForestServicePredictionProps> = ({ predictions }) => {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCrownFireColor = (activity: string) => {
    switch (activity) {
      case 'none': return 'bg-green-500';
      case 'passive': return 'bg-yellow-500';
      case 'active': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEvacuationColor = (urgency: string) => {
    switch (urgency) {
      case 'none': return 'bg-green-500';
      case 'low': return 'bg-yellow-500';
      case 'medium': return 'bg-orange-500';
      case 'high': return 'bg-red-500';
      case 'critical': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-red-500" />
        <h2 className="text-xl font-semibold">Forest Service Fire Behavior Analysis</h2>
        <Badge variant="outline" className="ml-auto">
          FARSITE + FlamMap
        </Badge>
      </div>

      {predictions.filter(p => p.forestServiceData).map((prediction) => (
        <Card key={prediction.id} className="border-l-4 border-l-red-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Fire Behavior Prediction #{prediction.id.split('_').pop()}
              </CardTitle>
              <div className="flex gap-2">
                <Badge className={getRiskColor(prediction.riskLevel)}>
                  {prediction.riskLevel.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {prediction.probability}% Risk
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* FARSITE Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  FARSITE Fire Spread Analysis
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spread Rate:</span>
                    <span className="font-medium">
                      {prediction.forestServiceData?.farsiteSpreadRate.toFixed(1)} chains/hour
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Flame Length:</span>
                    <span className="font-medium">
                      {prediction.forestServiceData?.flamMapFlameLength.toFixed(1)} feet
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Confidence:</span>
                    <span className="font-medium">{prediction.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* FlamMap Analysis */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  FlamMap Fire Behavior
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Crown Fire Activity:</span>
                    <Badge className={getCrownFireColor(prediction.forestServiceData?.crownFireActivity || 'none')}>
                      {prediction.forestServiceData?.crownFireActivity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Evacuation Urgency:</span>
                    <Badge className={getEvacuationColor(prediction.forestServiceData?.evacuationUrgency || 'none')}>
                      {prediction.forestServiceData?.evacuationUrgency.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Risk Probability:</span>
                    <span className="font-medium">{prediction.probability}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fire Risk Level</span>
                <span>{prediction.probability}%</span>
              </div>
              <Progress value={prediction.probability} className="h-2" />
            </div>

            {/* Recommendations */}
            {prediction.forestServiceData?.recommendations && prediction.forestServiceData.recommendations.length > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <div className="font-semibold mb-2">Forest Service Recommendations:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {prediction.forestServiceData.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Location Info */}
            <div className="text-xs text-gray-500 pt-2 border-t">
              <div className="flex justify-between">
                <span>Location: {prediction.latitude.toFixed(4)}, {prediction.longitude.toFixed(4)}</span>
                <span>Model: FARSITE-6.5.0 / FlamMap-6.2.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {predictions.filter(p => p.forestServiceData).length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Flame className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No Forest Service predictions available</p>
            <p className="text-sm text-gray-400 mt-2">
              Enhanced predictions using FARSITE and FlamMap models will appear here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 