import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchFireData, fetchWeatherData, calculateFireRisk, generatePredictedFireLocations, FireData, PredictedFireLocation, US_STATES } from '@/services/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

// Fix for default marker icons in Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface FireMapProps {
  className?: string;
  selectedState?: string;
  onStateDataLoad?: (fireCount: number, predictionCount: number) => void;
}

export const FireMap: React.FC<FireMapProps> = ({ 
  className = '', 
  selectedState = 'CA',
  onStateDataLoad 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
  const [loading, setLoading] = useState(true);
  const [fireData, setFireData] = useState<FireData[]>([]);
  const [predictedFires, setPredictedFireData] = useState<PredictedFireLocation[]>([]);
  const [selectedFire, setSelectedFire] = useState<FireData | PredictedFireLocation | null>(null);
  const popupRef = useRef<L.Popup | null>(null);

  // Listen for map centering messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CENTER_MAP' && mapRef.current) {
        const { lat, lng, zoom } = event.data.payload;
        mapRef.current.flyTo([lat, lng], zoom, {
          duration: 2
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Get state data for initial view
    const stateData = US_STATES.find(state => state.code === selectedState);
    const defaultCenter: L.LatLngTuple = [40, -100];
    const mapCenter: L.LatLngTuple = stateData ? [stateData.center.lat, stateData.center.lng] : defaultCenter;
    const mapZoom = stateData ? stateData.zoom : 4;

    // Initialize the map
    mapRef.current = L.map(mapContainer.current, {
      center: mapCenter,
      zoom: mapZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Add tile layer (using OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.current);

    // Add zoom control
    L.control.zoom({
      position: 'topright'
    }).addTo(mapRef.current);

    // Initialize layer group for markers
    markersRef.current = L.layerGroup().addTo(mapRef.current);

    // Load initial data
    const loadData = async () => {
      try {
        setLoading(true);
        const [fires, predictions] = await Promise.all([
          fetchFireData(selectedState),
          generatePredictedFireLocations(selectedState)
        ]);

        setFireData(fires);
        setPredictedFireData(predictions);
        
        if (onStateDataLoad) {
          onStateDataLoad(fires.length, predictions.length);
        }

        // Clear existing markers
        markersRef.current.clearLayers();

        // Add fire markers
        fires.forEach(fire => {
          const marker = L.circleMarker([fire.latitude, fire.longitude], {
            radius: 6 + (fire.brightness - 300) / 25, // Scale radius based on brightness
            fillColor: getFireColor(fire.brightness),
            color: '#fff',
            weight: 1,
            opacity: 0.9,
            fillOpacity: 0.9
          });

          marker.on('click', async () => {
            const weatherData = await fetchWeatherData(fire.latitude, fire.longitude);
            const riskData = await calculateFireRisk(fire.latitude, fire.longitude);
            
            setSelectedFire(fire);
            
            if (popupRef.current) {
              popupRef.current.remove();
            }
            
            popupRef.current = L.popup()
              .setLatLng([fire.latitude, fire.longitude])
              .setContent(`
                <div class="p-3 bg-card text-card-foreground rounded-lg border-l-4 border-red-500 w-64">
                  <h3 class="font-bold text-sm mb-2">🔥 Active Fire</h3>
                  <p class="text-xs"><strong>Brightness:</strong> ${fire.brightness}K</p>
                  <p class="text-xs"><strong>Confidence:</strong> ${fire.confidence}</p>
                  <p class="text-xs"><strong>Fire Power:</strong> ${fire.frp} MW</p>
                  <p class="text-xs"><strong>Detected:</strong> ${fire.acq_date} ${fire.acq_time}</p>
                  <p class="text-xs"><strong>Current Risk:</strong> ${riskData.riskLevel.toUpperCase()}</p>
                </div>
              `)
              .openOn(mapRef.current!);
          });

          // Add hover effects
          marker.on('mouseover', () => {
            marker.setStyle({
              weight: 2,
              opacity: 1
            });
          });

          marker.on('mouseout', () => {
            marker.setStyle({
              weight: 1,
              opacity: 0.9
            });
          });

          markersRef.current.addLayer(marker);
        });

        // Add predicted fire markers
        predictions.forEach(prediction => {
          const riskLevel = typeof prediction.riskLevel === 'string' 
            ? parseInt(prediction.riskLevel, 10) 
            : prediction.riskLevel;
            
          const marker = L.circleMarker([prediction.latitude, prediction.longitude], {
            radius: 8 + (riskLevel / 10), // Scale radius based on risk level
            fillColor: getRiskColor(riskLevel),
            color: '#ff4444',
            weight: 1,
            opacity: 0.6,
            fillOpacity: 0.6
          });

          marker.on('click', () => {
            if (popupRef.current) {
              popupRef.current.remove();
            }
            
            popupRef.current = L.popup()
              .setLatLng([prediction.latitude, prediction.longitude])
              .setContent(`
                <div class="p-3 bg-card text-card-foreground rounded-lg border-l-4 border-orange-500 w-64">
                  <h3 class="font-bold text-sm mb-2">⚠️ Fire Risk Prediction</h3>
                  <p class="text-xs"><strong>Location:</strong> ${'Unknown'}</p>
                  <p class="text-xs"><strong>Risk Level:</strong> ${riskLevel}%</p>
                  <p class="text-xs"><strong>Confidence:</strong> ${prediction.confidence}%</p>
                  <p class="text-xs"><strong>Predicted Date:</strong> ${prediction.predictedDate}</p>
                  <p class="text-xs text-yellow-600 mt-1"><strong>⚠️ High risk conditions detected</strong></p>
                </div>
              `)
              .openOn(mapRef.current!);
          });

          // Add hover effects
          marker.on('mouseover', () => {
            marker.setStyle({
              weight: 2,
              opacity: 0.8
            });
          });

          marker.on('mouseout', () => {
            marker.setStyle({
              weight: 1,
              opacity: 0.6
            });
          });

          markersRef.current.addLayer(marker);
        });

      } catch (error) {
        console.error('Error loading fire data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Effect to reload data when state changes
  useEffect(() => {
    if (!mapRef.current) return;

    const reloadStateData = async () => {
      try {
        setLoading(true);
        
        // Center map on new state
        const stateData = US_STATES.find(state => state.code === selectedState);
        if (stateData) {
          mapRef.current.flyTo(
            [stateData.center.lat, stateData.center.lng],
            stateData.zoom,
            { duration: 2 }
          );
        }

        // Load new data for the selected state
        const [fires, predictions] = await Promise.all([
          fetchFireData(selectedState),
          generatePredictedFireLocations(selectedState)
        ]);
        
        setFireData(fires);
        setPredictedFireData(predictions);
        
        // Notify parent component of the data
        if (onStateDataLoad) {
          onStateDataLoad(fires.length, predictions.length);
        }

        // Clear existing markers
        markersRef.current.clearLayers();

        // Add fire markers
        fires.forEach(fire => {
          const marker = L.circleMarker([fire.latitude, fire.longitude], {
            radius: 6 + (fire.brightness - 300) / 25,
            fillColor: getFireColor(fire.brightness),
            color: '#fff',
            weight: 1,
            opacity: 0.9,
            fillOpacity: 0.9
          });

          marker.on('click', async () => {
            const weatherData = await fetchWeatherData(fire.latitude, fire.longitude);
            const riskData = await calculateFireRisk(fire.latitude, fire.longitude);
            
            setSelectedFire(fire);
            
            if (popupRef.current) {
              popupRef.current.remove();
            }
            
            popupRef.current = L.popup()
              .setLatLng([fire.latitude, fire.longitude])
              .setContent(`
                <div class="p-3 bg-card text-card-foreground rounded-lg border-l-4 border-red-500 w-64">
                  <h3 class="font-bold text-sm mb-2">🔥 Active Fire</h3>
                  <p class="text-xs"><strong>Brightness:</strong> ${fire.brightness}K</p>
                  <p class="text-xs"><strong>Confidence:</strong> ${fire.confidence}</p>
                  <p class="text-xs"><strong>Fire Power:</strong> ${fire.frp} MW</p>
                  <p class="text-xs"><strong>Detected:</strong> ${fire.acq_date} ${fire.acq_time}</p>
                  <p class="text-xs"><strong>Current Risk:</strong> ${riskData.riskLevel.toUpperCase()}</p>
                </div>
              `)
              .openOn(mapRef.current!);
          });

          // Add hover effects
          marker.on('mouseover', () => {
            marker.setStyle({
              weight: 2,
              opacity: 1
            });
          });

          marker.on('mouseout', () => {
            marker.setStyle({
              weight: 1,
              opacity: 0.9
            });
          });

          markersRef.current.addLayer(marker);
        });

        // Add predicted fire markers
        predictions.forEach(prediction => {
          const riskLevel = typeof prediction.riskLevel === 'string' 
            ? parseInt(prediction.riskLevel, 10) 
            : prediction.riskLevel;
            
          const marker = L.circleMarker([prediction.latitude, prediction.longitude], {
            radius: 8 + (riskLevel / 10),
            fillColor: getRiskColor(riskLevel),
            color: '#ff4444',
            weight: 1,
            opacity: 0.6,
            fillOpacity: 0.6
          });

          marker.on('click', () => {
            if (popupRef.current) {
              popupRef.current.remove();
            }
            
            popupRef.current = L.popup()
              .setLatLng([prediction.latitude, prediction.longitude])
              .setContent(`
                <div class="p-3 bg-card text-card-foreground rounded-lg border-l-4 border-orange-500 w-64">
                  <h3 class="font-bold text-sm mb-2">⚠️ Fire Risk Prediction</h3>
                  <p class="text-xs"><strong>Location:</strong> ${'Unknown'}</p>
                  <p class="text-xs"><strong>Risk Level:</strong> ${riskLevel}%</p>
                  <p class="text-xs"><strong>Confidence:</strong> ${prediction.confidence}%</p>
                  <p class="text-xs"><strong>Predicted Date:</strong> ${prediction.predictedDate}</p>
                  <p class="text-xs text-yellow-600 mt-1"><strong>⚠️ High risk conditions detected</strong></p>
                </div>
              `)
              .openOn(mapRef.current!);
          });

          // Add hover effects
          marker.on('mouseover', () => {
            marker.setStyle({
              weight: 2,
              opacity: 0.8
            });
          });

          marker.on('mouseout', () => {
            marker.setStyle({
              weight: 1,
              opacity: 0.6
            });
          });

          markersRef.current.addLayer(marker);
        });

      } catch (error) {
        console.error('Error reloading state data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure map has finished any ongoing transitions
    const timeoutId = setTimeout(reloadStateData, 100);
    return () => clearTimeout(timeoutId);
  }, [selectedState]);
  
  // Helper function to get color based on fire brightness
  const getFireColor = (brightness: number): string => {
    if (brightness < 350) return '#ffeb3b';
    if (brightness < 400) return '#ff9800';
    if (brightness < 450) return '#f44336';
    return '#d32f2f';
  };
  
  // Helper function to get color based on risk level
  const getRiskColor = (riskLevel: number): string => {
    if (riskLevel < 40) return '#ffd54f';
    if (riskLevel < 60) return '#ff8a65';
    if (riskLevel < 80) return '#e57373';
    return '#f44336';
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg shadow-lg" style={{ zIndex: 0 }} />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg z-10">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm">Loading fire data...</span>
          </div>
        </div>
      )}
      
      {(fireData.length > 0 || predictedFires.length > 0) && (
        <Card className="absolute top-4 left-4 p-4 bg-card/90 backdrop-blur max-w-xs z-10">
          <h3 className="font-bold text-sm mb-2">🔥 Fire Intelligence</h3>
          <div className="space-y-1 text-xs">
            <p><strong>Active Fires:</strong> {fireData.length}</p>
            <p><strong>High Confidence:</strong> {fireData.filter(f => f.confidence >= 80).length}</p>
            <p><strong>Predicted Risks:</strong> {predictedFires.length}</p>
            {fireData.length > 0 && (
              <p><strong>Avg Brightness:</strong> {Math.round(fireData.reduce((sum, f) => sum + f.brightness, 0) / fireData.length)}K</p>
            )}
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
              <span>Active Fires</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-orange-400 border-2 border-orange-600"></div>
              <span>High Risk Areas</span>
            </div>
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            <Badge variant="destructive" className="text-xs">Extreme</Badge>
            <Badge variant="secondary" className="text-xs bg-fire-warning">High</Badge>
            <Badge variant="secondary" className="text-xs bg-fire-yellow">Moderate</Badge>
            <Badge variant="secondary" className="text-xs bg-fire-safe">Low</Badge>
          </div>
        </Card>
      )}
    </div>
  );
};