import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function DonationWidget() {
  const [copied, setCopied] = useState(false);
  const pixKey = "atosdeamor@igrejabatistaatos.org.br"; // Exemplo de chave PIX

  const copyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-rose-100 bg-rose-50/30 dark:bg-rose-950/10 dark:border-rose-900/20 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Heart className="h-24 w-24 text-rose-600" />
      </div>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <Heart className="h-5 w-5" />
          Apoie o Atos de Amor
        </CardTitle>
        <CardDescription>
          Sua contribuição financeira nos ajuda a comprar cestas básicas e prover assistência
          imediata para famílias em necessidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-rose-100 dark:border-rose-900 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-2 tracking-wider">
            Doação via PIX
          </p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-sm font-mono break-all">{pixKey}</code>
            <Button size="sm" variant="ghost" onClick={copyPix} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-[10px] text-muted-foreground leading-tight italic">
            * 100% das ofertas desta categoria são destinadas à Assistência Social.
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-rose-200 hover:bg-rose-100 hover:text-rose-700"
            asChild
          >
            <a href="https://atos.church/doar" target="_blank" rel="noopener noreferrer">
              Ver outras formas
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
