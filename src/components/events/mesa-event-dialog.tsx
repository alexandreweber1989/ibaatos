import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, MapPin, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MesaEventDialog({ mesa }: { mesa: any }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState(mesa.meeting_time || "");
  const [addressId, setAddressId] = useState("");
  const qc = useQueryClient();

  const { data: addresses, isPending: loadingAddresses } = useQuery({
    queryKey: ["mesa-addresses", mesa.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mesa_addresses" as any)
        .select("*")
        .eq("mesa_id", mesa.id);
      if (error) throw error;
      const dataArray = data as any[];

      // Auto-selecionar o endereço principal se nenhum estiver selecionado
      if (!addressId && dataArray.length > 0) {
        const main = dataArray.find((a) => a.is_main);
        if (main) setAddressId(main.id);
      }

      return dataArray;
    },
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!date || !time) throw new Error("Data e hora são obrigatórias.");

      const selectedAddress = addresses?.find((a) => a.id === addressId);
      const locationLabel = selectedAddress
        ? `${selectedAddress.label}: ${selectedAddress.street}, ${selectedAddress.number}`
        : mesa.meeting_location;

      const startsAt = new Date(`${date}T${time}:00`).toISOString();
      // Assume 2 horas de duração
      const endsAt = new Date(
        new Date(`${date}T${time}:00`).getTime() + 2 * 60 * 60 * 1000,
      ).toISOString();

      const { error } = await supabase.from("events").insert({
        title: `Reunião - ${mesa.name}`,
        description: `Encontro semanal da ${mesa.name}. Todos são bem-vindos!`,
        location: locationLabel,
        starts_at: startsAt,
        ends_at: endsAt,
        category: "Mesa" as any,
        scope: "mesa" as any,
        mesa_id: mesa.id,
        mesa_address_id: addressId || null,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento agendado e membros notificados!");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["events"] });
      void qc.invalidateQueries({ queryKey: ["upcoming-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          Agendar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-card/80 border-white/10">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            <CalendarPlus className="text-primary" />
            Agendar Reunião
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground" />
                Data
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Hora
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              Local da Reunião
            </Label>
            <Select value={addressId} onValueChange={setAddressId}>
              <SelectTrigger className="bg-background/50">
                <SelectValue
                  placeholder={loadingAddresses ? "Carregando locais..." : "Selecione um local"}
                />
              </SelectTrigger>
              <SelectContent>
                {addresses?.map((addr) => (
                  <SelectItem key={addr.id} value={addr.id}>
                    <div className="flex items-center gap-2">
                      {addr.label}: {addr.street}, {addr.number}
                      {addr.is_main && (
                        <span className="text-[10px] bg-primary/20 text-primary px-1 rounded font-bold uppercase">
                          Padrão
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {!loadingAddresses && addresses?.length === 0 && (
                  <SelectItem value="default" disabled>
                    Nenhum local cadastrado
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground italic">
              Se nenhum local for selecionado, usaremos o ponto de referência da mesa.
            </p>
          </div>

          <Button
            className="w-full h-11 text-lg font-serif mt-4"
            onClick={() => createEvent.mutate()}
            disabled={createEvent.isPending}
          >
            {createEvent.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Confirmar Agendamento"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
