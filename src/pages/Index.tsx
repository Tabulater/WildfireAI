import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, 
  Activity, 
  Brain, 
  Satellite, 
  AlertTriangle,
  ArrowRight,
  Globe,
  ExternalLink,
  Map,
  AlertCircle,
  Thermometer,
  Wind,
  Droplet
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Satellite className="h-6 w-6" />,
      title: "NASA FIRMS Data",
      description: "Access real-time fire data from NASA's Fire Information for Resource Management System.",
      link: "https://firms.modaps.eosdis.nasa.gov/",
      linkText: "View NASA FIRMS"
    },
    {
      icon: <Thermometer className="h-6 w-6" />,
      title: "Weather Conditions",
      description: "Monitor temperature, humidity, and wind conditions that affect fire behavior.",
      link: "https://www.weather.gov/",
      linkText: "National Weather Service"
    },
    {
      icon: <Droplet className="h-6 w-6" />,
      title: "Drought Monitoring",
      description: "Track drought conditions that contribute to fire risk.",
      link: "https://droughtmonitor.unl.edu/",
      linkText: "U.S. Drought Monitor"
    },
    {
      icon: <Map className="h-6 w-6" />,
      title: "Fire Perimeters",
      description: "View current fire perimeters and historical fire data.",
      link: "https://www.nifc.gov/fire-information/nfn",
      linkText: "National Interagency Fire Center"
    },
    {
      icon: <AlertCircle className="h-6 w-6" />,
      title: "Air Quality",
      description: "Check real-time air quality conditions during fire events.",
      link: "https://www.airnow.gov/",
      linkText: "AirNow.gov"
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: "Fire Weather Forecasts",
      description: "Access specialized fire weather forecasts and outlooks.",
      link: "https://www.weather.gov/fire/",
      linkText: "NWS Fire Weather"
    }
  ];

  const resources = [
    {
      title: "Wildfire Preparedness",
      link: "https://www.ready.gov/wildfires",
      description: "Learn how to prepare for wildfires and create an emergency plan."
    },
    {
      title: "Evacuation Information",
      link: "https://www.fema.gov/emergency-managers/practitioners/evacuation",
      description: "Understand evacuation procedures and find local emergency information."
    },
    {
      title: "Fire Restrictions",
      link: "https://gacc.nifc.gov/",
      description: "Check current fire restrictions and closures in your area."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col relative overflow-hidden">
      {/* Animated fire elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full fire-bg"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${6 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.3 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-orange-100 to-amber-50">
          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <div className="text-center max-w-4xl mx-auto relative z-10">
              {/* Animated flame elements around the title */}
              {[...Array(5)].map((_, i) => (
                <div 
                  key={`flame-${i}`}
                  className="flame"
                  style={{
                    width: `${Math.random() * 40 + 20}px`,
                    height: `${Math.random() * 40 + 20}px`,
                    left: `${20 + Math.random() * 60}%`,
                    top: `${-10 + Math.random() * 40}%`,
                    background: `radial-gradient(circle, rgba(255,${150 + Math.random() * 105},0,0.8) 0%, rgba(255,${50 + Math.random() * 100},0,0) 70%)`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1.5 + Math.random() * 2}s`,
                    opacity: 0.6 + Math.random() * 0.4,
                    zIndex: -1,
                  }}
                />
              ))}
              <div className="relative">
                {/* Fire glow effect */}
                <div className="absolute -inset-4 -z-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-20 rounded-full blur-3xl"></div>
                </div>
                
                {/* Main title with gradient text */}
                <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
                  <span className="relative">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500">
                      Wildfire AI
                    </span>
                    {/* Animated flame effect */}
                    <span className="absolute left-0 right-0 -bottom-2 h-2 bg-gradient-to-r from-red-500 to-orange-400 rounded-full opacity-70 blur-sm"></span>
                  </span>
                </h1>
              </div>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                A comprehensive wildfire monitoring and information platform
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="default" 
                  size="lg" 
                  onClick={() => navigate('/dashboard')}
                  className="text-lg px-8 py-6 h-auto bg-blue-600 hover:bg-blue-700"
                >
                  View Fire Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <a 
                  href="https://firms.modaps.eosdis.nasa.gov/map/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-lg font-medium px-8 py-6 h-auto border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  NASA Fire Map
                  <ExternalLink className="ml-2 h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

      {/* Features Section */}
      <div className="py-16 bg-gradient-to-b from-orange-50 to-orange-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Wildfire Information Resources</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Access real-time wildfire data and critical resources from trusted sources
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <a 
                key={index} 
                href={feature.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group block transform transition-transform hover:-translate-y-1 duration-300"
              >
                <Card className="p-6 h-full hover:shadow-lg transition-all duration-300 border border-orange-200 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-orange-100 text-red-600">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{feature.description}</p>
                      <div className="flex items-center text-sm font-medium text-red-600 group-hover:text-red-700 transition-colors">
                        {feature.linkText}
                        <ExternalLink className="ml-1 h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <div className="py-16 bg-gradient-to-b from-orange-100 to-orange-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Emergency Preparedness</h2>
            <div className="space-y-4">
              {resources.map((resource, index) => (
                <a 
                  key={index} 
                  href={resource.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <ExternalLink className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{resource.title}</h3>
                      <p className="mt-1 text-gray-600">{resource.description}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard CTA */}
      <div className="py-20 bg-gradient-to-b from-orange-200 to-orange-300">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-red-50 to-orange-100 p-8 rounded-xl shadow-lg border border-orange-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Fire Dashboard</h2>
            <p className="text-lg text-gray-600 mb-8">
              Explore real-time wildfire data, historical trends, and risk assessments with our interactive dashboard.
            </p>
            <Button 
              variant="default"
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Access Live Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">Wildfire AI</h3>
              <p className="text-gray-400">
                Providing critical wildfire information and resources to help communities stay safe and informed.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</a></li>
                <li><a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">NASA FIRMS</a></li>
                <li><a href="https://www.ready.gov/wildfires" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Wildfire Safety</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="https://www.nifc.gov/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">NIFC</a></li>
                <li><a href="https://www.airnow.gov/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Air Quality</a></li>
                <li><a href="https://www.weather.gov/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Weather Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Wildfire AI. All rights reserved.</p>
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes float {
                  0%, 100% { transform: translateY(0) rotate(0deg); }
                  50% { transform: translateY(-10px) rotate(2deg); }
                }
                @keyframes flicker {
                  0%, 100% { opacity: 0.8; filter: brightness(1); }
                  50% { opacity: 1; filter: brightness(1.2); }
                }
                .fire-float {
                  animation: float 6s ease-in-out infinite;
                }
                .fire-float:nth-child(2n) {
                  animation-delay: 1s;
                  animation-duration: 7s;
                }
                .fire-float:nth-child(3n) {
                  animation-delay: 2s;
                  animation-duration: 8s;
                }
                .fire-bg {
                  background-image: radial-gradient(ellipse at center, rgba(255,120,0,0.2) 0%, rgba(255,200,0,0.1) 70%, rgba(255,255,255,0) 100%);
                }
                .text-shadow-fire {
                  text-shadow: 0 0 15px rgba(255, 80, 0, 0.5), 
                              0 0 30px rgba(255, 120, 0, 0.3),
                              0 0 45px rgba(255, 60, 0, 0.2);
                }
              `
            }} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
