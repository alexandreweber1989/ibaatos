import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Search, MapPin, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Fix default icon issue with Leaflet and build tools
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface AddressData {
  street: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  full: string;
  lat: number;
  lng: number;
}

interface MapPickerProps {
  onSelect: (address: AddressData) => void;
  onCancel: () => void;
  initialCenter?: [number, number];
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function MapPicker({
  onSelect,
  onCancel,
  initialCenter = [-24.9555, -53.4552],
}: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(initialCenter);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const newAddress: AddressData = {
          street: addr.road || addr.pedestrian || addr.suburb || "",
          neighborhood: addr.suburb || addr.neighbourhood || addr.city_district || "",
          city: addr.city || addr.town || addr.village || "",
          state: addr.state || "",
          full: data.display_name,
          lat,
          lng,
        };
        setAddress(newAddress);
        setSearchQuery(newAddress.full);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Prioridade: buscar como endereço completo no Brasil
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&addressdetails=1&q=${encodeURIComponent(searchQuery)}&limit=5`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        // Pega o primeiro resultado (mais relevante)
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        setPosition([lat, lng]);

        // Mapeia o endereço retornado pela busca para evitar novo reverse geocode se possível
        const addr = item.address;
        const newAddress: AddressData = {
          street: addr.road || addr.pedestrian || addr.suburb || "",
          neighborhood: addr.suburb || addr.neighbourhood || addr.city_district || "",
          city: addr.city || addr.town || addr.village || "",
          state: addr.state || "",
          full: item.display_name,
          lat,
          lng,
        };
        setAddress(newAddress);
        setSearchQuery(newAddress.full);
      } else {
        toast.error("Local não encontrado. Tente digitar de outra forma.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Erro na busca de endereço.");
    } finally {
      setIsSearching(false);
    }
  };

  // Initial reverse geocode
  useEffect(() => {
    reverseGeocode(position[0], position[1]);
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  return (
    <div className="flex flex-col h-[500px] w-full bg-background border rounded-lg overflow-hidden shadow-xl">
      <div className="p-3 border-b bg-muted/30 flex gap-2 items-center">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Digite um endereço para buscar..."
            className="pr-10 h-10"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-0 top-0 h-10 w-10"
            onClick={() => handleSearch()}
            disabled={isSearching}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 relative z-0">
        <MapContainer center={position} zoom={15} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                handleLocationSelect(pos.lat, pos.lng);
              },
            }}
          />
          <MapEvents onLocationSelect={handleLocationSelect} />
          <ChangeView center={position} />
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 z-[1000] bg-background/20 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-background border p-4 rounded-full shadow-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <div className="bg-background border rounded-lg p-3 shadow-2xl space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-foreground">Local selecionado:</p>
                <p className="text-muted-foreground truncate">
                  {address?.full || "Clique no mapa para selecionar"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={!address || loading}
                onClick={() => address && onSelect(address)}
              >
                <Check className="h-4 w-4 mr-2" /> Confirmar Local
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
