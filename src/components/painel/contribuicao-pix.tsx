import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, HandCoins, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PanelSection } from "@/components/painel/ui";
import { useAuth } from "@/lib/auth-context";
import { pixPayload } from "@/lib/store";
import { cn } from "@/lib/utils";

type Tipo = "dizimo" | "oferta";

/** Igreja com os dados de PIX próprios. */
interface ChurchPix {
  id: string;
  name: string;
  city: string | null;
  is_headquarters: boolean;
  pix_key: string | null;
  pix_name: string | null;
  pix_city: string | null;
}

/** Converte "R$ 1.234,56" ou "1234,56" em centavos; 0 quando não há valor. */
function parseAmountCents(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

function formatAmountInput(raw: string): string {
  const cents = parseAmountCents(raw);
  if (!cents) return "";
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function churchLabel(c: ChurchPix): string {
  return c.city ? `${c.name} — ${c.city}` : c.name;
}

/**
 * Dízimos e ofertas por PIX, com a chave da igreja do próprio membro.
 * Não registra transações — apenas apresenta a chave e o QR Code (BR Code).
 */
export function ContribuicaoPix() {
  const { isAdmin, profile } = useAuth();
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<Tipo>("dizimo");
  const [valor, setValor] = useState("");
  const [copied, setCopied] = useState<"key" | "payload" | null>(null);
  const [config, setConfig] = useState(false);
  const [override, setOverride] = useState<string | null>(null);

  const { data: churches } = useQuery({
    queryKey: ["churches-pix"],
    queryFn: async (): Promise<ChurchPix[]> => {
      const { data, error } = await supabase
        .from("churches")
        .select("id, name, city, is_headquarters, pix_key, pix_name, pix_city")
        .eq("is_active", true)
        .order("is_headquarters", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as ChurchPix[];
    },
  });

  const memberChurchId: string | null = profile?.church_id ?? null;

  const church = useMemo(() => {
    const list = churches ?? [];
    if (!list.length) return null;
    const wanted = override ?? memberChurchId;
    return list.find((c) => c.id === wanted) ?? list.find((c) => c.is_headquarters) ?? list[0]!;
  }, [churches, override, memberChurchId]);

  // Ao trocar de igreja, limpa o estado de "copiado" para não confundir.
  useEffect(() => setCopied(null), [church?.id]);

  const pixKey = church?.pix_key?.trim() ?? "";
  const pixName = church?.pix_name?.trim() || church?.name || "IGREJA BATISTA ATOS";
  const pixCity = church?.pix_city?.trim() || church?.city || "BRASIL";

  const amountCents = parseAmountCents(valor);
  const payload = pixKey
    ? pixPayload({
        key: pixKey,
        name: pixName,
        city: pixCity,
        amountCents,
        txid: tipo === "dizimo" ? "DIZIMO" : "OFERTA",
      })
    : "";

  const copy = async (value: string, which: "key" | "payload") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
      toast.success(which === "key" ? "Chave PIX copiada." : "Código copia-e-cola copiado.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  };

  return (
    <PanelSection
      label="Dízimos e ofertas"
      title="Contribua com a obra"
      action={
        isAdmin ? (
          <Button variant="outline" size="sm" onClick={() => setConfig(true)}>
            <Settings2 className="h-4 w-4" /> Configurar PIX
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {church && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Sua igreja · {churchLabel(church)}
            </div>
            {(churches?.length ?? 0) > 1 && (
              <Select value={church.id} onValueChange={(v) => setOverride(v)}>
                <SelectTrigger className="sm:w-72">
                  <SelectValue placeholder="Escolha a igreja" />
                </SelectTrigger>
                <SelectContent>
                  {(churches ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {churchLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {!pixKey ? (
          <div className="text-sm text-muted-foreground">
            {church
              ? `A chave PIX de ${churchLabel(church)} ainda não foi cadastrada.`
              : "Nenhuma igreja cadastrada."}
            {isAdmin
              ? " Clique em “Configurar PIX” para informar o CNPJ desta igreja."
              : " Fale com a secretaria."}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] items-start">
            <div className="grid grid-cols-1 gap-5">
              <div className="flex gap-2">
                {(["dizimo", "oferta"] as Tipo[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={cn(
                      "flex-1 rounded-lg border px-4 py-3 text-left transition-all duration-200",
                      tipo === t
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className="font-serif text-lg leading-none">
                      {t === "dizimo" ? "Dízimo" : "Oferta"}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-1">
                      {t === "dizimo" ? "Fidelidade ao Senhor" : "Contribuição voluntária"}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="pix-valor"
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                >
                  Valor (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="pix-valor"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(formatAmountInput(e.target.value))}
                    className="pl-9 h-11 text-base"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para definir o valor no aplicativo do seu banco.
                </p>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Chave PIX (CNPJ) · {pixName}
                </div>
                <div className="font-mono text-sm break-all">{pixKey}</div>
                <div className="grid grid-cols-1 sm:flex sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="w-full sm:flex-1 h-11"
                    onClick={() => copy(pixKey, "key")}
                  >
                    {copied === "key" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Copiar chave
                  </Button>
                  <Button
                    className="w-full sm:flex-1 h-11"
                    onClick={() => copy(payload, "payload")}
                  >
                    {copied === "payload" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <HandCoins className="h-4 w-4" />
                    )}
                    Copia e cola
                  </Button>
                </div>
              </div>
            </div>

            <div className="mx-auto lg:mx-0 rounded-xl border border-border bg-background p-6 shadow-sm">
              <QRCodeSVG value={payload} size={180} level="M" />
              <p className="mt-3 text-center text-xs text-muted-foreground max-w-[180px]">
                Aponte a câmera do seu banco para o QR Code
              </p>
            </div>
          </div>
        )}
      </div>

      {isAdmin && (
        <PixConfigDialog
          open={config}
          onOpenChange={setConfig}
          churches={churches ?? []}
          initialChurchId={church?.id ?? null}
          onSaved={() => qc.invalidateQueries({ queryKey: ["churches-pix"] })}
        />
      )}
    </PanelSection>
  );
}

function PixConfigDialog({
  open,
  onOpenChange,
  churches,
  initialChurchId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  churches: ChurchPix[];
  initialChurchId: string | null;
  onSaved: () => void;
}) {
  const [churchId, setChurchId] = useState<string | null>(initialChurchId);
  const [form, setForm] = useState({ key: "", name: "", city: "" });

  // Sempre que abrir o diálogo ou trocar de igreja, recarrega os campos.
  useEffect(() => {
    if (!open) return;
    const id = churchId ?? initialChurchId;
    setChurchId(id);
    const c = churches.find((x) => x.id === id);
    setForm({
      key: c?.pix_key ?? "",
      name: c?.pix_name ?? c?.name ?? "",
      city: c?.pix_city ?? c?.city ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, churchId, initialChurchId, churches]);

  const save = useMutation({
    mutationFn: async () => {
      if (!churchId) throw new Error("Selecione a igreja.");
      const chave = form.key.trim();
      if (chave.replace(/\D/g, "").length !== 14) {
        throw new Error("Informe o CNPJ da igreja com 14 dígitos.");
      }
      const { error } = await supabase
        .from("churches")
        .update({
          pix_key: chave,
          pix_name: form.name.trim().slice(0, 25).toUpperCase(),
          pix_city: form.city.trim().slice(0, 15).toUpperCase(),
        })
        .eq("id", churchId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("PIX da igreja atualizado.");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Configurar PIX por igreja</DialogTitle>
          <DialogDescription>
            Cada membro vê automaticamente o QR Code da igreja em que está cadastrado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Igreja
            </label>
            <Select value={churchId ?? undefined} onValueChange={(v) => setChurchId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a igreja" />
              </SelectTrigger>
              <SelectContent>
                {churches.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {churchLabel(c)}
                    {c.pix_key ? " ✓" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Chave PIX — CNPJ
            </label>
            <Input
              value={form.key}
              onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
              placeholder="00.000.000/0001-00"
              maxLength={20}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Nome do recebedor (máx. 25)
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              maxLength={25}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Cidade (máx. 15)
            </label>
            <Input
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              maxLength={15}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
