import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ASSIGNMENT_STATUS, WORSHIP_FUNCTIONS, initials, relativeDays } from "@/lib/louvor";
import { useMusicians, useSundayHistory } from "@/lib/use-worship";
import { useProfileOptions } from "@/lib/use-profiles";
import { useAuth } from "@/lib/auth-context";
import { GrupoDomingo } from "./grupo-domingo";
import { StageMode } from "./stage-mode";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssignmentRow {
  id: string;
  function_name: string;
  status: string;
  response_note: string | null;
  user_id: string;
  profiles: { full_name: string } | null;
}

export function ScheduleDetail({
  scheduleId,
  canManage,
}: {
  scheduleId: string;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const [openFn, setOpenFn] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [q, setQ] = useState("");
  const [songId, setSongId] = useState("");

  const { data: musicians } = useMusicians();
  const { data: history } = useSundayHistory();
  const { data: profiles } = useProfileOptions();

  const detailKey = ["worship-schedules", scheduleId, "detail"];
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: detailKey });
    qc.invalidateQueries({ queryKey: ["worship-schedules"] });
    qc.invalidateQueries({ queryKey: ["worship-sunday-history"] });
  };

  const { data: songs } = useQuery({
    queryKey: ["worship-songs-min"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("songs") as any)
        .select("id, title, song_key")
        .eq("is_active", true)
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: detail } = useQuery({
    queryKey: detailKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_schedules")
        .select(
          "id, assignments:worship_schedule_assignments(id, function_name, status, response_note, user_id, profiles:profiles!inner(full_name)), setlist:setlist_songs(id, position, song_key, notes, song:songs!inner(id, title, artist))",
        )
        .eq("id", scheduleId)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const assignments: AssignmentRow[] = detail?.assignments ?? [];
  const { user } = useAuth();
  /** O ministro escalado também pode montar o grupo do domingo. */
  const isMinistro = assignments.some(
    (a) => a.user_id === user?.id && a.function_name === "Violão (ministro)",
  );

  const addAssignment = useMutation({
    mutationFn: async ({ userId, fn }: { userId: string; fn: string }) => {
      if (assignments.some((a) => a.user_id === userId && a.function_name === fn)) {
        throw new Error("Essa pessoa já está escalada nessa função.");
      }
      const { error } = await supabase
        .from("worship_schedule_assignments")
        .insert({ schedule_id: scheduleId, user_id: userId, function_name: fn });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pessoa escalada.");
      setQ("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("worship_schedule_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const addSong = useMutation({
    mutationFn: async () => {
      if (!songId) throw new Error("Selecione a música.");
      const song = songs?.find((s: any) => s.id === songId);
      const position = (detail?.setlist?.length ?? 0) + 1;
      const { error } = await (supabase.from("setlist_songs") as any).insert({
        schedule_id: scheduleId,
        song_id: songId,
        position,
        song_key: song?.song_key ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSongId("");
      qc.invalidateQueries({ queryKey: detailKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSong = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("setlist_songs") as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: detailKey }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setlist = [...(detail?.setlist ?? [])].sort((a: any, b: any) => a.position - b.position);

  /** Candidatos de uma função: elenco daquele instrumento + (opcional) qualquer membro. */
  function candidates(fn: string) {
    const term = q.trim().toLowerCase();
    const scheduledHere = assignments.filter((a) => a.function_name === fn).map((a) => a.user_id);
    const fromCast = (musicians ?? [])
      .filter((m) => m.is_active && (m.functions ?? []).includes(fn))
      .map((m) => ({ id: m.user_id, name: m.profile?.full_name ?? "—", cast: true }));
    const castIds = fromCast.map((c) => c.id);
    const others = showAll
      ? (profiles ?? [])
          .filter((p) => !castIds.includes(p.id))
          .map((p) => ({ id: p.id, name: p.full_name, cast: false }))
      : [];
    return [...fromCast, ...others]
      .filter((c) => !scheduledHere.includes(c.id))
      .filter((c) => !term || c.name.toLowerCase().includes(term));
  }

  return (
    <div className="border-t border-border pt-6 mt-6 space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <StageMode setlist={setlist as any} />
        {(canManage || isMinistro) && <GrupoDomingo scheduleId={scheduleId} />}
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Escala por função
          </div>

          <div className="space-y-2">
            {WORSHIP_FUNCTIONS.map((fn) => {
              const people = assignments.filter((a) => a.function_name === fn);
              const open = openFn === fn;
              return (
                <div key={fn} className="border border-border rounded-sm">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                    onClick={() => {
                      setOpenFn(open ? null : fn);
                      setQ("");
                    }}
                  >
                    <span className="font-mono text-[11px] uppercase tracking-widest">{fn}</span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-sm">
                        {people.length === 0
                          ? "vazio"
                          : people.map((p) => p.profiles?.full_name).join(", ")}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </span>
                  </button>

                  {people.length > 0 && (
                    <ul className="px-4 pb-3 space-y-2">
                      {people.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <span className="h-7 w-7 rounded-sm bg-muted grid place-items-center font-mono text-[9px] tracking-widest">
                              {initials(a.profiles?.full_name ?? "?")}
                            </span>
                            <span className="text-sm">{a.profiles?.full_name}</span>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                              {relativeDays(history?.[a.user_id]?.lastDate ?? null)}
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase tracking-widest ${ASSIGNMENT_STATUS[a.status].className}`}
                            >
                              {ASSIGNMENT_STATUS[a.status].label}
                            </span>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Remover da escala"
                                onClick={() => removeAssignment.mutate(a.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {open && canManage && (
                    <div className="border-t border-border p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-44">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="Buscar irmão(ã)"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                          />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowAll((v) => !v)}>
                          {showAll ? "Só o elenco" : "Incluir outros membros"}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {candidates(fn).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => addAssignment.mutate({ userId: c.id, fn })}
                            className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-left hover:border-foreground transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            <span className="text-sm">{c.name}</span>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                              {c.cast
                                ? relativeDays(history?.[c.id]?.lastDate ?? null)
                                : "fora do elenco"}
                            </span>
                          </button>
                        ))}
                        {candidates(fn).length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Nenhum nome disponível. Use “Incluir outros membros” para escalar alguém
                            de fora do elenco.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {assignments
            .filter((a) => !WORSHIP_FUNCTIONS.includes(a.function_name as never))
            .map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 border border-dashed border-border rounded-sm px-4 py-2"
              >
                <span className="text-sm">
                  {a.profiles?.full_name}
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground ml-2">
                    {a.function_name}
                  </span>
                </span>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover da escala"
                    onClick={() => removeAssignment.mutate(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
        </div>

        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Repertório do dia
          </div>
          <ol className="divide-y divide-border">
            {setlist.map((item: any, index: number) => (
              <li key={item.id} className="py-2 flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-2xl text-muted-foreground">{index + 1}</span>
                  <div>
                    <div className="text-sm">{item.song?.title}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {[item.song?.artist, item.song_key && `Tom ${item.song_key}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover"
                    onClick={() => removeSong.mutate(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
            {setlist.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">Repertório ainda não definido.</li>
            )}
          </ol>
          {canManage && (
            <div className="space-y-2 pt-2">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Adicionar música
              </Label>
              <div className="flex gap-2">
                <Select value={songId} onValueChange={setSongId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Música do repertório" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {songs?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" aria-label="Adicionar música" onClick={() => addSong.mutate()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
