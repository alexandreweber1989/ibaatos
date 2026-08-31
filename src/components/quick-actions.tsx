import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Plus,
  X,
  Users,
  CalendarDays,
  Network,
  UtensilsCrossed,
  Baby,
  BookOpen,
  Coffee,
  Megaphone,
  Newspaper,
  Presentation,
  Sprout,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const ACTIONS = [
  { to: "/agenda", label: "Novo evento", icon: CalendarDays },
  { to: "/avisos", label: "Novo aviso", icon: Megaphone },
  { to: "/noticias", label: "Nova notícia", icon: Newspaper },
  { to: "/pregacoes", label: "Nova pregação", icon: Presentation },
  { to: "/membros", label: "Cadastrar membro", icon: Users },
  { to: "/redes", label: "Nova rede", icon: Network },
  { to: "/mesas", label: "Nova mesa", icon: UtensilsCrossed },
  { to: "/kids", label: "Check-in Kids", icon: Baby },
  { to: "/livraria", label: "Produto da livraria", icon: BookOpen },
  { to: "/cantina", label: "Item da cantina", icon: Coffee },
  { to: "/onboarding", label: "Integração de membros", icon: Sprout },
] as const;

/** Botão flutuante de ações rápidas: leva direto às telas de cadastro. */
export function QuickActions() {
  const [open, setOpen] = useState(false);
  const { isAdmin, isLivrariaAdmin, isCantinaAdmin, isKidsAdmin } = useAuth();

  if (!isAdmin && !isLivrariaAdmin && !isCantinaAdmin && !isKidsAdmin) return null;

  const visible = ACTIONS.filter((a) => {
    if (isAdmin) return true;
    if (a.to === "/livraria") return isLivrariaAdmin;
    if (a.to === "/cantina") return isCantinaAdmin;
    if (a.to === "/kids") return isKidsAdmin;
    return false;
  });

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col items-end gap-2 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {visible.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${i * 40}ms` }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/80 backdrop-blur-xl px-4 py-3 text-sm shadow-xl hover:border-primary/50 hover:bg-accent/50 transition-all hover:scale-105 active:scale-95 group"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium pr-2">{action.label}</span>
              </Link>
            );
          })}
        </div>
      )}
      <button
        type="button"
        aria-label={open ? "Fechar ações rápidas" : "Abrir ações rápidas"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-14 w-14 grid place-items-center rounded-2xl bg-primary text-primary-foreground shadow-2xl hover:scale-110 active:scale-90 transition-all duration-300 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {open ? (
          <X className="h-6 w-6 relative z-10" />
        ) : (
          <Plus className="h-6 w-6 relative z-10" />
        )}
      </button>
    </div>
  );
}
