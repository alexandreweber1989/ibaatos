import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, MapPin, ExternalLink, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

export function AddressManager({ mesaId }: { mesaId: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [isMain, setIsMain] = useState(false);
  const qc = useQueryClient();

  const { data: addresses, isPending } = useQuery({
    queryKey: ["mesa-addresses", mesaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mesa_addresses" as any)
        .select("*")
        .eq("mesa_id", mesaId);
      if (error) throw error;
      return data as any[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!street || !number) throw new Error("Rua e número são obrigatórios.");
      const { error } = await supabase.from("mesa_addresses" as any).insert({
        mesa_id: mesaId,
        label: label || "Reunião",
        street,
        number,
        neighborhood,
        city,
        state,
        full_address: fullAddress || `${street}, ${number} - ${neighborhood}, ${city} - ${state}`,
        is_main: isMain,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Endereço adicionado.");
      setIsAdding(false);
      setLabel("");
      setStreet("");
      setNumber("");
      setNeighborhood("");
      setCity("");
      setState("");
      setFullAddress("");
      setIsMain(false);
      void qc.invalidateQueries({ queryKey: ["mesa-addresses", mesaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mesa_addresses" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Endereço removido.");
      void qc.invalidateQueries({ queryKey: ["mesa-addresses", mesaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setMain = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mesa_addresses" as any)
        .update({ is_main: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Endereço principal atualizado.");
      void qc.invalidateQueries({ queryKey: ["mesa-addresses", mesaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleAddressSelect = (addr: any) => {
    setStreet(addr.street);
    setNeighborhood(addr.neighborhood || "");
    setCity(addr.city || "");
    setState(addr.state || "");
    setFullAddress(addr.full);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Locais de Reunião
        </h4>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Novo local
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Identificação (ex: Casa do Líder)</Label>
              <Input
                size={1}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Principal"
                className="h-9"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Endereço (Busque a rua)</Label>
              <AddressAutocomplete
                value={street}
                onChange={setStreet}
                onAddressSelect={handleAddressSelect}
                placeholder="Rua, Avenida..."
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Número</Label>
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="123"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bairro</Label>
              <Input
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-center gap-2 col-span-2 py-1">
              <Switch id="is-main" checked={isMain} onCheckedChange={setIsMain} />
              <Label htmlFor="is-main" className="text-xs cursor-pointer">
                Definir como endereço principal
              </Label>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={() => add.mutate()} disabled={add.isPending}>
              {add.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Plus className="h-3.5 w-3.5 mr-1" />
              )}
              Adicionar
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {isPending ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
          </div>
        ) : (
          addresses?.map((addr) => (
            <div
              key={addr.id}
              className="group relative flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/50 hover:bg-card hover:border-border transition-colors"
            >
              <div className="min-w-0 pr-10">
                <div className="font-medium text-sm flex items-center gap-2">
                  {addr.label}
                  {addr.is_main && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary font-bold uppercase tracking-wider">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      Principal
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {addr.street}, {addr.number} - {addr.neighborhood}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!addr.is_main && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => setMain.mutate(addr.id)}
                    disabled={setMain.isPending}
                    title="Definir como principal"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr.full_address)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Ver no Maps"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => remove.mutate(addr.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
        {!isPending && addresses?.length === 0 && !isAdding && (
          <div className="text-center py-6 text-xs text-muted-foreground italic border-2 border-dashed border-border/40 rounded-lg">
            Nenhum endereço cadastrado para esta mesa.
          </div>
        )}
      </div>
    </div>
  );
}
