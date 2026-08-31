import { Play, ExternalLink, Calendar, Video, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface YoutubeVideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    type: "service" | "podcast";
    url: string;
    published_at: string | null;
  };
  index?: number;
}

export function YoutubeVideoCard({ video, index = 0 }: YoutubeVideoCardProps) {
  const date = video.published_at ? new Date(video.published_at).toLocaleDateString("pt-BR") : null;
  const isPodcast = video.type === "podcast";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className="group"
    >
      <Card
        className={cn(
          "relative overflow-hidden border-none bg-background/40 backdrop-blur-xl transition-all duration-500",
          "before:absolute before:inset-0 before:p-[1px] before:rounded-[inherit] before:bg-gradient-to-b before:from-white/10 before:to-transparent before:-z-10",
          "hover:shadow-[0_0_40px_-10px_rgba(220,38,38,0.2)] hover:-translate-y-1",
        )}
      >
        {/* Glow Effect */}
        <div
          className={cn(
            "absolute -top-24 -right-24 w-48 h-48 blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none",
            isPodcast ? "bg-blue-500" : "bg-red-500",
          )}
        />

        <div className="relative aspect-video overflow-hidden bg-zinc-900/50">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover transition-all duration-700 scale-[1.01] group-hover:scale-105 group-hover:blur-[2px] opacity-90 group-hover:opacity-50"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <Video className="h-12 w-12" />
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />

          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <Badge
              className={cn(
                "px-2.5 py-0.5 text-[10px] font-bold tracking-[0.15em] border-none shadow-lg backdrop-blur-md uppercase",
                isPodcast ? "bg-blue-600/90 text-white" : "bg-red-600/90 text-white",
              )}
            >
              {isPodcast ? "Estudo" : "Culto"}
            </Badge>
          </div>

          {/* Action Button on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
            <a
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest text-white shadow-2xl transition-all hover:scale-105 active:scale-95",
                isPodcast ? "bg-blue-600 shadow-blue-600/20" : "bg-red-600 shadow-red-600/20",
              )}
            >
              <Play className="h-4 w-4 fill-current" />
              Assistir Agora
            </a>
          </div>
        </div>

        <CardHeader className="p-5 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {date}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          <CardTitle className="text-[15px] font-medium line-clamp-2 leading-relaxed group-hover:text-foreground transition-colors min-h-[44px]">
            {video.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 pb-5 pt-0">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border/50 to-transparent mb-4" />
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-10 font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-all rounded-xl hover:bg-white/5"
            asChild
          >
            <a href={video.url} target="_blank" rel="noreferrer">
              Detalhes do Vídeo
            </a>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
