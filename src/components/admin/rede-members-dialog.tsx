import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfileOptions } from "@/lib/use-profiles";
import {
  CHURCH_FUNCTIONS,
  CHURCH_FUNCTION_LABEL,
  churchFunctionRank,
  type ChurchFunction,
} from "@/lib/igreja";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface RedeMemberRow {
  id: string;
  role: string;
  user_id: string;
  profiles: { full_name: string } | null;
}

/** Gerencia as pessoas de uma rede: membros, líderes, apascentadores e pastores. */
export function RedeMembersDialog({ redeId, redeName }: { redeId: string; redeName: string }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<ChurchFunction>("membro");
  const { data: profiles } = useProfileOptions();
  const qc = useQueryClient();

  const { data: members } = useQuery({
    queryKey: ["rede-members", redeId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rede_members")
        .select("id, role, user_id, profiles:profiles!inner(full_name)")
        .eq("rede_id", redeId);
      if (error) throw error;
      return ((data ?? []) as unknown as RedeMemberRow[]).sort(
        (a, b) =>
          churchFunctionRank(a.role) - churchFunctionRank(b.role) ||
          (a.profiles?.full_name ?? "").localeCompare(b.profiles?.full_name ?? ""),
      );
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Selecione a pessoa.");
      const { error } = await supabase
        .from("rede_members")
        .insert({ rede_id: redeId, user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pessoa adicionada à rede.");
      setUserId("");
      void qc.invalidateQueries({ queryKey: ["rede-members", redeId] });
      void qc.invalidateQueries({ queryKey: ["group-stats"] });
      void qc.invalidateQueries({ queryKey: ["rede-members-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: ChurchFunction }) => {
      const { error } = await supabase.from("rede_members").update({ role: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["rede-members", redeId] });
      void qc.invalidateQueries({ queryKey: ["group-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rede_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["rede-members", redeId] });
      void qc.invalidateQueries({ queryKey: ["group-stats"] });
      void qc.invalidateQueries({ queryKey: ["rede-members-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4" /> Pessoas da rede
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">{redeName}</DialogTitle>
          <DialogDescription>
            Cadastre pastores, apascentadores, líderes e membros desta rede.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Adicionar pessoa</Label>
            <div className="grid sm:grid-cols-[1fr_auto] gap-2">
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {profiles?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={role} onValueChange={(v) => setRole(v as ChurchFunction)}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHURCH_FUNCTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={add.isPending} onClick={() => add.mutate()}>
              Adicionar à rede
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {members?.map((m) => (
              <li key={m.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">{m.profiles?.full_name}</span>
                <div className="flex items-center gap-2">
                  <Select
                    value={m.role}
                    onValueChange={(v) =>
                      changeRole.mutate({ id: m.id, value: v as ChurchFunction })
                    }
                  >
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <SelectValue>{CHURCH_FUNCTION_LABEL[m.role]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CHURCH_FUNCTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover"
                    onClick={() => remove.mutate(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
            {members?.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">
                Nenhuma pessoa nesta rede ainda.
              </li>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
