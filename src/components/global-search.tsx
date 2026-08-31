import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { displayMemberName } from "@/lib/igreja";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchResult {
  id: string;
  label: string;
  hint?: string | null;
  to: string;
}

/** Busca global (Ctrl/Cmd + K) em membros, ministérios, redes, mesas, louvores e produtos. */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data } = useQuery({
    queryKey: ["global-search-index"],
    enabled: open,
    staleTime: 60_000,
    queryFn: async () => {
      const [membros, ministerios, redes, mesas, louvores, produtos, itens] = await Promise.all([
        supabase.from("profiles").select("id, full_name, church_function, gender").limit(500),
        supabase.from("ministries").select("id, name, slug").limit(200),
        supabase.from("redes").select("id, name").limit(200),
        supabase.from("mesas").select("id, name").limit(300),
        supabase.from("worship_songs").select("id, title, artist").limit(300),
        supabase.from("products").select("id, name").limit(300),
        supabase.from("canteen_items").select("id, name").limit(300),
      ]);
      const groups: Record<string, SearchResult[]> = {
        Membros: (membros.data ?? []).map((p) => ({
          id: p.id,
          label: displayMemberName(p.full_name, p.church_function, p.gender),
          to: "/membros",
        })),
        Ministérios: (ministerios.data ?? []).map((m) => ({
          id: m.id,
          label: m.name,
          to: `/ministerios/${m.slug}`,
        })),
        Redes: (redes.data ?? []).map((r) => ({ id: r.id, label: r.name, to: "/redes" })),
        Mesas: (mesas.data ?? []).map((m) => ({ id: m.id, label: m.name, to: "/mesas" })),
        Louvores: (louvores.data ?? []).map((s) => ({
          id: s.id,
          label: s.title,
          hint: s.artist,
          to: "/louvor",
        })),
        Livraria: (produtos.data ?? []).map((p) => ({ id: p.id, label: p.name, to: "/livraria" })),
        Cantina: (itens.data ?? []).map((i) => ({ id: i.id, label: i.name, to: "/cantina" })),
      };
      return groups;
    },
  });

  const groups = useMemo(() => Object.entries(data ?? {}), [data]);

  const go = (to: string) => {
    setOpen(false);
    void navigate({ to });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-border bg-background/50 backdrop-blur-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-primary/50 transition-all duration-300 shadow-sm group"
        aria-label="Pesquisa global"
      >
        <Search className="h-4 w-4 group-hover:scale-110 group-hover:text-primary transition-all" />
        <span className="hidden sm:inline font-medium">Pesquisar...</span>
        <kbd className="hidden md:inline font-mono text-[10px] bg-muted border border-border rounded-lg px-1.5 py-0.5 group-hover:bg-background transition-colors">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Pesquisar membro, ministério, mesa, louvor..."
          className="font-medium"
        />
        <CommandList>
          <CommandEmpty className="py-6 text-center text-muted-foreground">
            Nenhum resultado encontrado para esta pesquisa.
          </CommandEmpty>
          <CommandGroup heading="Ir para">
            {[
              { label: "Painel", to: "/dashboard" },
              { label: "Agenda", to: "/agenda" },
              { label: "Kids", to: "/kids" },
              { label: "Membros", to: "/membros" },
              { label: "Louvor", to: "/louvor" },
            ].map((p) => (
              <CommandItem key={p.to} value={`ir ${p.label}`} onSelect={() => go(p.to)}>
                {p.label}
              </CommandItem>
            ))}
          </CommandGroup>
          {groups.map(([heading, items]) =>
            items.length === 0 ? null : (
              <CommandGroup key={heading} heading={heading}>
                {items.slice(0, 60).map((item) => (
                  <CommandItem
                    key={`${heading}-${item.id}`}
                    value={`${item.label} ${item.hint ?? ""} ${heading}`}
                    onSelect={() => go(item.to)}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.hint && (
                      <span className="ml-auto text-xs text-muted-foreground">{item.hint}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ),
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
