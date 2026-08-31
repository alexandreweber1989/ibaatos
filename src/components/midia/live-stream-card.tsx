import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Video, Play, ExternalLink, Radio } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LiveStreamCard() {
  const { data: status } = useQuery({
    queryKey: ["live-status"],
    queryFn: async () => {
      const res = await fetch("/api/public/live-status");
      return res.json();
    },
    refetchInterval: 1000 * 60 * 5, // Check every 5 minutes
  });

  if (!status) return null;

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5 group hover:shadow-lg transition-all duration-500">
      <div className="aspect-video bg-black relative">
        {status.isLive ? (
          <iframe
            src={`https://www.youtube.com/embed/live_stream?channel=UC-n6qZf6vY-eT29864uU5wQ`} // ID do canal @BatistaAtos
            className="w-full h-full"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-white p-6 text-center">
            <Video className="h-12 w-12 text-red-600 mb-4 opacity-50" />
            <h3 className="font-serif text-xl mb-2">Acompanhe pelo YouTube</h3>
            <p className="text-sm text-zinc-400 max-w-xs">
              Todos os domingos às 19:00 transmitimos nosso culto ao vivo.
            </p>
          </div>
        )}

        {status.isLive && (
          <Badge className="absolute top-4 left-4 bg-red-600 animate-pulse border-none">
            <Radio className="h-3 w-3 mr-1.5" /> AO VIVO
          </Badge>
        )}
      </div>

      <CardHeader className="p-5">
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-lg font-serif">
              {status.isLive ? "Assista Agora" : "Nosso Canal"}
            </CardTitle>
            <CardDescription className="text-xs font-mono uppercase tracking-wider mt-1">
              {status.title || "Transmissão ao vivo"}
            </CardDescription>
          </div>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
            <a href={status.liveUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-0">
        <Button className="w-full bg-red-600 hover:bg-red-700 text-white gap-2" asChild>
          <a href={status.liveUrl} target="_blank" rel="noreferrer">
            <Play className="h-4 w-4 fill-current" />
            {status.isLive ? "Abrir no YouTube" : "Ver Vídeos Anteriores"}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
