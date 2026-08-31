import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Pendencia {
  label: string;
  count: number;
  to: string;
}

/** Sino com as pendências que dependem de uma ação da pessoa logada. */
export function NotificationsBell() {
  const { user, isAdmin, isLivrariaAdmin, isCantinaAdmin } = useAuth();

  const { data } = useQuery({
    queryKey: ["notificacoes", user?.id, isAdmin, isLivrariaAdmin, isCantinaAdmin],
    enabled: Boolean(user),
    refetchInterval: 60_000,
    queryFn: async (): Promise<Pendencia[]> => {
      const items: Pendencia[] = [];

      // Avisos no ar que a pessoa ainda não marcou como lidos.
      const [avisosRes, leiturasRes] = await Promise.all([
        supabase
          .from("announcements")
          .select("id, published_at, expires_at")
          .eq("is_published", true),
        supabase.from("announcement_reads").select("announcement_id").eq("user_id", user!.id),
      ]);
      const lidos = new Set((leiturasRes.data ?? []).map((r: any) => r.announcement_id as string));
      const agora = Date.now();
      const naoLidos = (avisosRes.data ?? []).filter((a: any) => {
        if (lidos.has(a.id)) return false;
        if (a.published_at && new Date(a.published_at).getTime() > agora) return false;
        if (a.expires_at && new Date(a.expires_at).getTime() <= agora) return false;
        return true;
      }).length;
      if (naoLidos)
        items.push({ label: "Avisos que você ainda não leu", count: naoLidos, to: "/avisos" });

      const minhasEscalas = await supabase
        .from("worship_schedule_assignments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "pendente");
      if (minhasEscalas.count)
        items.push({
          label: "Escalas aguardando sua resposta",
          count: minhasEscalas.count,
          to: "/louvor",
        });

      if (isAdmin) {
        const pedidos = await supabase
          .from("membership_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pendente");
        if (pedidos.count)
          items.push({
            label: "Pedidos de cadastro para aprovar",
            count: pedidos.count,
            to: "/dashboard",
          });
      }

      if (isLivrariaAdmin) {
        const pedidos = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "pendente");
        if (pedidos.count)
          items.push({
            label: "Pedidos da livraria a confirmar",
            count: pedidos.count,
            to: "/livraria",
          });
      }

      if (isCantinaAdmin) {
        const reservas = await supabase
          .from("canteen_reservations")
          .select("id", { count: "exact", head: true })
          .eq("status", "reservado");
        if (reservas.count)
          items.push({
            label: "Reservas da cantina para separar",
            count: reservas.count,
            to: "/cantina",
          });
      }

      return items;
    },
  });

  const total = (data ?? []).reduce((sum, p) => sum + p.count, 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" aria-label="Notificações">
          <Bell className="h-4 w-4" />
          {total > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground font-mono text-[10px] flex items-center justify-center">
              {total > 9 ? "9+" : total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Pendências
        </div>
        {total === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Tudo em dia por aqui.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(data ?? []).map((p) => (
              <li key={p.label}>
                <Link
                  to={p.to}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                >
                  <span className="text-sm">{p.label}</span>
                  <span className="font-mono text-sm text-primary">{p.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
