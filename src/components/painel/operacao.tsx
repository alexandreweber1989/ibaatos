import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, Coffee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { brl, formatDateBR, todayISO } from "@/lib/painel";
import { Button } from "@/components/ui/button";
import { PanelSection, EmptyLine } from "./ui";

/** Visão operacional de Livraria e Cantina para administradores. */
export function Operacao() {
  const { data } = useQuery({
    queryKey: ["painel-operacao"],
    queryFn: async () => {
      const [pedidos, prontos, estoque, cardapio] = await Promise.all([
        supabase
          .from("orders")
          .select("id, pickup_code, total_cents, created_at")
          .eq("status", "aguardando_pagamento")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pago"),
        supabase
          .from("products")
          .select("id, name, stock")
          .eq("is_active", true)
          .eq("track_stock", true)
          .lte("stock", 3)
          .order("stock", { ascending: true })
          .limit(5),
        supabase
          .from("canteen_menus")
          .select("id, title, service_date, reservations:canteen_reservations(count)")
          .eq("status", "publicado")
          .gte("service_date", todayISO())
          .order("service_date", { ascending: true })
          .limit(1),
      ]);
      return {
        pedidos: (pedidos.data ?? []) as { id: string; pickup_code: string; total_cents: number }[],
        prontos: prontos.count ?? 0,
        estoque: (estoque.data ?? []) as { id: string; name: string; stock: number }[],
        cardapio: (cardapio.data ?? [])[0] as
          | { id: string; title: string; service_date: string; reservations: { count: number }[] }
          | undefined,
      };
    },
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <PanelSection
        label="Livraria"
        title="Fila de pedidos"
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/livraria">Abrir livraria</Link>
          </Button>
        }
      >
        <div className="flex gap-6 mb-5">
          <div>
            <div className="font-serif text-3xl leading-none">{data?.pedidos.length ?? 0}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Aguardando pagto.
            </div>
          </div>
          <div>
            <div className="font-serif text-3xl leading-none">{data?.prontos ?? 0}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Prontos p/ retirada
            </div>
          </div>
        </div>
        {data && data.pedidos.length === 0 && <EmptyLine>Nenhum pedido pendente.</EmptyLine>}
        <ul className="space-y-2">
          {data?.pedidos.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between border border-border rounded-sm px-3 py-2"
            >
              <span className="font-mono text-xs tracking-wider flex items-center gap-2">
                <BookOpen className="h-3 w-3 text-primary" />
                {o.pickup_code}
              </span>
              <span className="text-sm tabular-nums">{brl(o.total_cents)}</span>
            </li>
          ))}
        </ul>
        {data && data.estoque.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Estoque baixo
            </div>
            <ul className="space-y-1">
              {data.estoque.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="tabular-nums text-muted-foreground">{p.stock} un.</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PanelSection>

      <PanelSection
        label="Cantina"
        title="Cardápio em cartaz"
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/cantina">Abrir cantina</Link>
          </Button>
        }
      >
        {!data?.cardapio && (
          <EmptyLine>Nenhum cardápio publicado para os próximos cultos.</EmptyLine>
        )}
        {data?.cardapio && (
          <div>
            <div className="font-serif text-2xl">{data.cardapio.title}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              {formatDateBR(data.cardapio.service_date, { day: "2-digit", month: "long" })}
            </div>
            <div className="mt-6 flex items-end gap-3">
              <Coffee className="h-5 w-5 text-primary mb-1" />
              <div>
                <div className="font-serif text-4xl leading-none tabular-nums">
                  {data.cardapio.reservations?.[0]?.count ?? 0}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                  Reservas registradas
                </div>
              </div>
            </div>
          </div>
        )}
      </PanelSection>
    </div>
  );
}
