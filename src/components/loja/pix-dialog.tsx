import { useState } from "react";
import { Copy, Check, Info, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatBRL, pixPayload } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export interface PixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickupCode: string;
  totalCents: number;
  pixKey: string;
  pixName: string;
  pixCity: string;
}

export function PixDialog({
  open,
  onOpenChange,
  pickupCode,
  totalCents,
  pixKey,
  pixName,
  pixCity,
}: PixDialogProps) {
  const [copied, setCopied] = useState<"key" | "payload" | null>(null);
  const payload = pixPayload({
    key: pixKey,
    name: pixName,
    city: pixCity,
    amountCents: totalCents,
    txid: pickupCode.replace("-", ""),
  });

  const copy = async (value: string, which: "key" | "payload") => {
    await navigator.clipboard.writeText(value);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50 rounded-[2rem] p-0 overflow-hidden">
        <div className="bg-primary/5 p-8 border-b border-border/50">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <Badge
                variant="outline"
                className="font-mono text-[9px] uppercase tracking-widest border-primary/30 text-primary"
              >
                Confirmado
              </Badge>
              <div className="h-px bg-primary/20 flex-1" />
            </div>
            <DialogTitle className="font-serif text-4xl tracking-tight text-foreground">
              Pedido realizado
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8">
          {/* Pickup Code Section */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-muted/30 border border-border/50 rounded-3xl p-6 text-center relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <ArrowRight className="h-12 w-12 rotate-[-45deg]" />
            </div>

            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-4">
              Código de retirada
            </span>
            <div className="font-serif text-5xl tracking-tighter text-primary">{pickupCode}</div>
            <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed max-w-[220px] mx-auto font-light">
              Apresente este código no balcão da livraria para retirar seus itens após o pagamento.
            </p>
          </motion.div>

          <div className="space-y-6">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Valor Total
              </span>
              <span className="font-serif text-3xl text-foreground">{formatBRL(totalCents)}</span>
            </div>

            <div className="space-y-3">
              <div className="relative group">
                <div className="flex items-center gap-3 bg-background border border-border/50 rounded-2xl p-4 transition-colors group-hover:border-primary/30">
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground block mb-1">
                      Chave PIX (CNPJ)
                    </span>
                    <p className="font-mono text-sm truncate pr-8">{pixKey}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => copy(pixKey, "key")}
                  >
                    {copied === "key" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-2xl font-serif text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform"
                onClick={() => copy(payload, "payload")}
              >
                {copied === "payload" ? (
                  <span className="flex items-center gap-2">
                    <Check className="h-5 w-5" /> Copiado!
                  </span>
                ) : (
                  "PIX Copia e Cola"
                )}
              </Button>
            </div>

            <div className="flex gap-4 p-5 bg-muted/30 rounded-2xl border border-border/50">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed font-light">
                Para agilizar, anexe o comprovante na aba <strong>Meus Pedidos</strong>. A equipe
                validará seu pagamento e liberará a retirada em instantes.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
