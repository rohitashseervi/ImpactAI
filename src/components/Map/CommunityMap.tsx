import { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Community, Volunteer } from '../../types';
import { MapPin, Users } from 'lucide-react';

interface Props {
  communities: Community[];
  volunteers?: Volunteer[];
  communityUrgencies?: Record<string, number>; // communityId -> avg urgency
  onCommunityClick?: (communityId: string) => void;
  height?: string;
}

const mapContainerStyle = {
  width: '100%',
  borderRadius: '12px',
};

const defaultCenter = { lat: 22.5937, lng: 78.9629 }; // Center of India

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ],
};

function getMarkerColor(urgency: number): string {
  if (urgency >= 8) return '#EA4335'; // red
  if (urgency >= 5) return '#FBBC04'; // orange/yellow
  return '#34A853'; // green
}

export default function CommunityMap({
  communities,
  volunteers = [],
  communityUrgencies = {},
  onCommunityClick,
  height = '400px',
}: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    // Auto-fit bounds to show all markers
    if (communities.length > 0 || volunteers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      communities.forEach((c) => {
        if (c.location.lat !== 0 && c.location.lng !== 0) {
          bounds.extend(c.location);
        }
      });
      volunteers.forEach((v) => {
        if (v.location.lat !== 0 && v.location.lng !== 0) {
          bounds.extend(v.location);
        }
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 50);
      }
    }
  }, [communities, volunteers]);

  if (loadError) {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden" style={{ height }}>
        <div className="h-full bg-gradient-to-br from-blue-50 to-blue-100 p-6 flex flex-col">
          <h3 className="text-xs font-bold uppercase text-slate mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Community Deployment Map
          </h3>
          <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto">
            {communities.filter(c => c.location.lat !== 0).map((c) => {
              const urgency = communityUrgencies[c.communityId] || 0;
              return (
                <div
                  key={c.communityId}
                  onClick={() => onCommunityClick?.(c.communityId)}
                  className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border border-border"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${urgency >= 8 ? 'bg-danger' : urgency >= 5 ? 'bg-warning' : 'bg-success'}`} />
                    <span className="text-xs font-bold truncate">{c.name}</span>
                  </div>
                  <p className="text-[10px] text-slate">{c.district}, {c.state}</p>
                  {urgency > 0 && <p className="text-[10px] font-bold mt-1" style={{ color: urgency >= 8 ? '#EA4335' : urgency >= 5 ? '#FBBC04' : '#34A853' }}>Urgency: {urgency.toFixed(1)}</p>}
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-slate mt-2 text-center">Google Maps requires billing enabled. Showing card view instead.</p>
        </div>
        {/* Legend */}
        <div className="px-4 py-2 flex items-center gap-4 text-[10px] font-semibold text-slate border-t border-border bg-white">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-danger" /> Critical (8-10)</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-warning" /> Moderate (5-7)</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-success" /> Low (1-4)</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /> Volunteer</div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-white border border-border rounded-xl p-6 flex items-center justify-center" style={{ height }}>
        <div className="flex items-center gap-2 text-sm text-slate">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <GoogleMap
        mapContainerStyle={{ ...mapContainerStyle, height }}
        center={defaultCenter}
        zoom={5}
        options={mapOptions}
        onLoad={onLoad}
      >
        {/* Community markers */}
        {communities.map((community) => {
          if (community.location.lat === 0 && community.location.lng === 0) return null;
          const urgency = communityUrgencies[community.communityId] || 3;
          return (
            <Marker
              key={community.communityId}
              position={community.location}
              title={community.name}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: getMarkerColor(urgency),
                fillOpacity: 0.9,
                strokeColor: '#fff',
                strokeWeight: 2,
                scale: 8 + urgency,
              }}
              onClick={() => {
                setSelectedCommunity(community);
                setSelectedVolunteer(null);
              }}
            />
          );
        })}

        {/* Volunteer markers */}
        {volunteers.map((vol) => {
          if (vol.location.lat === 0 && vol.location.lng === 0) return null;
          return (
            <Marker
              key={vol.volunteerId}
              position={vol.location}
              title={vol.name}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#1A73E8',
                fillOpacity: 0.9,
                strokeColor: '#fff',
                strokeWeight: 2,
                scale: 7,
              }}
              onClick={() => {
                setSelectedVolunteer(vol);
                setSelectedCommunity(null);
              }}
            />
          );
        })}

        {/* Community Info Window */}
        {selectedCommunity && (
          <InfoWindow
            position={selectedCommunity.location}
            onCloseClick={() => setSelectedCommunity(null)}
          >
            <div className="p-1 min-w-[180px]">
              <h3 className="font-bold text-sm mb-1">{selectedCommunity.name}</h3>
              <p className="text-xs text-gray-600">{selectedCommunity.district}, {selectedCommunity.state}</p>
              <p className="text-xs text-gray-600">Type: {selectedCommunity.areaType} | Pop: ~{selectedCommunity.populationApprox}</p>
              {communityUrgencies[selectedCommunity.communityId] && (
                <p className="text-xs font-bold mt-1" style={{ color: getMarkerColor(communityUrgencies[selectedCommunity.communityId]) }}>
                  Urgency: {communityUrgencies[selectedCommunity.communityId].toFixed(1)}/10
                </p>
              )}
              {onCommunityClick && (
                <button
                  onClick={() => onCommunityClick(selectedCommunity.communityId)}
                  className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                >
                  View Details →
                </button>
              )}
            </div>
          </InfoWindow>
        )}

        {/* Volunteer Info Window */}
        {selectedVolunteer && (
          <InfoWindow
            position={selectedVolunteer.location}
            onCloseClick={() => setSelectedVolunteer(null)}
          >
            <div className="p-1 min-w-[160px]">
              <h3 className="font-bold text-sm mb-1">{selectedVolunteer.name}</h3>
              <p className="text-xs text-gray-600">{selectedVolunteer.locationText}</p>
              <p className="text-xs text-gray-600">Skills: {selectedVolunteer.skills.join(', ')}</p>
              <p className="text-xs text-gray-600">Availability: {selectedVolunteer.availability}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="px-4 py-2 flex items-center gap-4 text-[10px] font-semibold text-slate border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-danger" /> Critical (8-10)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-warning" /> Moderate (5-7)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success" /> Low (1-4)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" /> Volunteer
        </div>
      </div>
    </div>
  );
}
