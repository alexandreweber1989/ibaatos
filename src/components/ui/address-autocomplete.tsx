import { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin, Loader2, Map as MapIcon, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseBrazilianAddress } from "@/lib/address-parser";

const MapPicker = lazy(() => import("./map-picker").then((m) => ({ default: m.MapPicker })));

interface Suggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  raw?: any;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: {
    street: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    full: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder,
  className,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtragem em tempo real local para persistência enquanto digita
  useEffect(() => {
    if (!value || value.length < 2) {
      setFilteredSuggestions([]);
      return;
    }

    const lowerValue = value.toLowerCase();
    const filtered = suggestions.filter(
      (s) =>
        s.description.toLowerCase().includes(lowerValue) ||
        s.structured_formatting.main_text.toLowerCase().includes(lowerValue),
    );

    // Se não tiver sugestões locais compatíveis o suficiente, deixa as da última busca
    // ou espera o debounced fetch atualizar.
    if (filtered.length > 0) {
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions);
    }
  }, [value, suggestions]);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      if (typeof window !== "undefined" && (window as any).google) {
        const service = new (window as any).google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: "br" },
            types: ["address"],
            // Google Maps permite filtrar por tipos específicos e idiomas se configurado na biblioteca
            language: "pt-BR",
          },
          (predictions: any, status: any) => {
            if (status === "OK" && predictions) {
              const mapped: Suggestion[] = predictions.map((p: any) => ({
                description: p.description,
                place_id: p.place_id,
                structured_formatting: {
                  main_text: p.structured_formatting.main_text,
                  secondary_text: p.structured_formatting.secondary_text,
                },
                raw: p,
              }));
              setSuggestions(mapped);
              setOpen(true);
              setLoading(false);
            } else {
              fetchFallback(input);
            }
          },
        );
      } else {
        fetchFallback(input);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      fetchFallback(input);
    }
  }, []);

  const fetchFallback = async (input: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=br&q=${encodeURIComponent(input)}&limit=10`,
      );
      const data = await res.json();
      const mapped: Suggestion[] = data.map((item: any) => ({
        description: item.display_name,
        place_id: item.place_id.toString(),
        structured_formatting: {
          main_text:
            item.address.road || item.address.pedestrian || item.display_name.split(",")[0],
          secondary_text: item.display_name.split(",").slice(1).join(",").trim(),
        },
        raw: item,
      }));
      setSuggestions(mapped);
      if (mapped.length > 0) setOpen(true);
    } catch (e) {
      console.error("Maps API and fallback failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setActiveIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newValue.length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(newValue);
      }, 300);
    } else {
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filteredSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredSuggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleSelect = async (suggestion: Suggestion) => {
    // Parser do input atual para manter o número se o usuário já digitou
    const currentParsed = parseBrazilianAddress(value);

    setOpen(false);

    let finalAddress = {
      street: suggestion.structured_formatting.main_text,
      number: currentParsed.number,
      neighborhood: "",
      city: "",
      state: "",
      full: suggestion.description,
    };

    if (
      typeof window !== "undefined" &&
      (window as any).google &&
      suggestion.place_id.length > 20
    ) {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ placeId: suggestion.place_id }, (results: any, status: any) => {
        if (status === "OK" && results[0]) {
          const res = results[0];
          const components = res.address_components;
          const getComp = (type: string) =>
            components.find((c: any) => c.types.includes(type))?.long_name;

          finalAddress = {
            street: getComp("route") || finalAddress.street,
            number: getComp("street_number") || finalAddress.number,
            neighborhood: getComp("sublocality_level_1") || getComp("neighborhood") || "",
            city: getComp("administrative_area_level_2") || getComp("locality") || "",
            state: getComp("administrative_area_level_1") || "",
            full: res.formatted_address,
          };

          onChange(formatAddressString(finalAddress));
          onAddressSelect?.(finalAddress);
        } else {
          // Se falhar o geocode detalhado, usa o que já temos
          onChange(formatAddressString(finalAddress));
          onAddressSelect?.(finalAddress);
        }
      });
    } else if (suggestion.raw) {
      // Trata dados do Nominatim ou Google (fallback)
      const addr = suggestion.raw.address || {};
      finalAddress = {
        street: addr.road || addr.pedestrian || finalAddress.street,
        number: addr.house_number || finalAddress.number,
        neighborhood: addr.suburb || addr.neighbourhood || addr.city_district || "",
        city: addr.city || addr.town || addr.village || "",
        state: addr.state || "",
        full: suggestion.description,
      };

      onChange(formatAddressString(finalAddress));
      onAddressSelect?.(finalAddress);
    } else {
      // Caso genérico
      onChange(formatAddressString(finalAddress));
      onAddressSelect?.(finalAddress);
    }
  };

  const formatAddressString = (addr: any) => {
    let str = addr.street;
    if (addr.number) str += `, ${addr.number}`;
    if (addr.neighborhood) str += ` - ${addr.neighborhood}`;
    if (addr.city) str += `, ${addr.city}`;
    if (addr.state) str += `-${addr.state}`;
    return str;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex gap-2 w-full">
        <div className="relative flex-1 group">
          <Input
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => value.length >= 3 && setOpen(true)}
            placeholder={placeholder}
            className={cn("pr-20 pl-9 transition-all focus:ring-primary", className)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {value && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onChange("");
                  setSuggestions([]);
                  setOpen(false);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <MapPin className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 hover:bg-muted"
          onClick={() => setMapOpen(true)}
          title="Selecionar no mapa"
        >
          <MapIcon className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-xl border-none shadow-2xl">
          <DialogHeader className="p-4 border-b bg-muted/30">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-primary" />
              Selecionar no Mapa
            </DialogTitle>
          </DialogHeader>
          <Suspense
            fallback={
              <div className="h-[500px] flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Carregando mapa interativo...</p>
              </div>
            }
          >
            <MapPicker
              onCancel={() => setMapOpen(false)}
              onSelect={(addr) => {
                onAddressSelect?.(addr);
                onChange(formatAddressString(addr));
                setMapOpen(false);
              }}
            />
          </Suspense>
        </DialogContent>
      </Dialog>

      {open && (
        <div className="absolute z-[100] w-full mt-2 bg-popover border border-border rounded-lg shadow-xl max-h-[300px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 bg-muted/30 border-b flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Sugestões encontradas
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              {filteredSuggestions.length} resultados
            </span>
          </div>
          <ul className="overflow-y-auto max-h-[250px] py-1">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((s, index) => (
                <li
                  key={s.place_id}
                  onClick={() => handleSelect(s)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "px-4 py-3 cursor-pointer text-sm flex gap-3 transition-colors",
                    activeIndex === index
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground",
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    <MapPin
                      className={cn(
                        "h-4 w-4",
                        activeIndex === index ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate">
                      {s.structured_formatting.main_text}
                    </span>
                    <span className="text-xs opacity-70 truncate">
                      {s.structured_formatting.secondary_text}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground italic">
                {loading ? "Buscando..." : "Nenhuma sugestão encontrada para este termo."}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
