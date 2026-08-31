import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageBody, PageHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa da comunidade — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Distribuição dos membros por cidade e bairro para planejar mesas de comunhão mais próximas de casa.",
      },
      { property: "og:title", content: "Mapa da comunidade — Igreja Batista Atos" },
      {
        property: "og:description",
        content: "Veja onde a igreja mora e onde faltam mesas de comunhão.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MapaPage,
});

interface Pessoa {
  id: string;
  full_name: string;
  city: string | null;
  neighborhood: string | null;
  membership_status: string | null;
}

interface MesaRow {
  id: string;
  name: string;
  meeting_location: string | null;
  is_active: boolean;
}

function MapaPage() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("todas");

  const { data, isLoading } = useQuery({
    queryKey: ["mapa-comunidade"],
    queryFn: async () => {
      const [pessoas, mesas] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, city, neighborhood, membership_status")
          .eq("membership_status", "ativo"),
        supabase
          .from("mesas")
          .select("id, name, meeting_location, is_active")
          .eq("is_active", true),
      ]);
      if (pessoas.error) throw pessoas.error;
      return {
        pessoas: (pessoas.data ?? []) as Pessoa[],
        mesas: (mesas.data ?? []) as MesaRow[],
      };
    },
  });

  const cidades = useMemo(() => {
    const set = new Set((data?.pessoas ?? []).map((p) => (p.city ?? "").trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const grupos = useMemo(() => {
    const term = search.trim().toLowerCase();
    const map = new Map<string, { cidade: string; bairro: string; pessoas: Pessoa[] }>();
    for (const p of data?.pessoas ?? []) {
      const cidade = (p.city ?? "").trim() || "Sem cidade informada";
      const bairro = (p.neighborhood ?? "").trim() || "Sem bairro informado";
      if (city !== "todas" && cidade !== city) continue;
      if (term && !`${cidade} ${bairro} ${p.full_name}`.toLowerCase().includes(term)) continue;
      const key = `${cidade}||${bairro}`;
      if (!map.has(key)) map.set(key, { cidade, bairro, pessoas: [] });
      map.get(key)!.pessoas.push(p);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        b.pessoas.length - a.pessoas.length ||
        a.cidade.localeCompare(b.cidade) ||
        a.bairro.localeCompare(b.bairro),
    );
  }, [data, search, city]);

  /** Uma mesa "cobre" o bairro quando o local de reunião cita o bairro. */
  const mesasDoBairro = (bairro: string) =>
    (data?.mesas ?? []).filter((m) =>
      (m.meeting_location ?? "").toLowerCase().includes(bairro.toLowerCase()),
    );

  const totalPessoas = grupos.reduce((acc, g) => acc + g.pessoas.length, 0);

  return (
    <>
      <PageHeader
        eyebrow="Comunidade"
        title="Mapa da comunidade"
        description="Onde a igreja mora, agrupada por cidade e bairro — para abrir mesas de comunhão perto das pessoas."
      />
      <PageBody>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            placeholder="Buscar por bairro, cidade ou pessoa…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-sm"
          />
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as cidades</SelectItem>
              {cidades.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
          {grupos.length} bairro(s) · {totalPessoas} membro(s) ativo(s)
        </p>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {!isLoading && !grupos.length && (
          <p className="text-sm text-muted-foreground">
            Nenhum endereço cadastrado ainda. Preencha cidade e bairro nas fichas dos membros.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {grupos.map((g) => {
            const mesas = mesasDoBairro(g.bairro);
            return (
              <article
                key={`${g.cidade}-${g.bairro}`}
                className="border border-border rounded-xl bg-card/50 backdrop-blur-sm p-4 space-y-3"
              >
                <header className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium truncate">{g.bairro}</h3>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">
                      {g.cidade}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto gap-1">
                    <Users className="h-3 w-3" /> {g.pessoas.length}
                  </Badge>
                </header>
                <ul className="text-sm space-y-0.5 max-h-40 overflow-y-auto">
                  {g.pessoas.slice(0, 20).map((p) => (
                    <li key={p.id} className="truncate text-muted-foreground">
                      {p.full_name}
                    </li>
                  ))}
                  {g.pessoas.length > 20 && (
                    <li className="text-xs text-muted-foreground">
                      + {g.pessoas.length - 20} pessoa(s)
                    </li>
                  )}
                </ul>
                {mesas.length ? (
                  <p className="text-xs text-muted-foreground">
                    Mesa por perto: {mesas.map((m) => m.name).join(", ")}
                  </p>
                ) : (
                  g.pessoas.length >= 3 && (
                    <p className="text-xs text-primary">
                      Sem mesa registrada neste bairro — possível nova mesa.
                    </p>
                  )
                )}
              </article>
            );
          })}
        </div>
      </PageBody>
    </>
  );
}
