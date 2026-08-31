import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { KidsPhoto } from "@/components/kids/kids-photo";
import { removeKidsPhoto, uploadKidsPhoto } from "@/lib/kids-photos";

interface PhotoInputProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  folder: "criancas" | "responsaveis";
  variant?: "crianca" | "responsavel";
  className?: string;
}

/**
 * Captura de foto para o Kids: envio de arquivo (galeria) ou câmera ao vivo.
 * Grava direto no Storage e devolve o caminho do arquivo para o formulário.
 */
export function PhotoInput({
  label,
  value,
  onChange,
  folder,
  variant = "crianca",
  className,
}: PhotoInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera(false);
  }, []);

  // Garante que a câmera é desligada ao desmontar (privacidade e bateria).
  useEffect(() => () => stopCamera(), [stopCamera]);

  const send = async (blob: Blob) => {
    setBusy(true);
    try {
      const previous = value;
      const path = await uploadKidsPhoto(blob, folder);
      onChange(path);
      void removeKidsPhoto(previous);
      toast.success("Foto salva.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar a foto.");
    } finally {
      setBusy(false);
    }
  };

  const openCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Este dispositivo/navegador não permite acesso à câmera.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamera(true);
      // O elemento só existe depois do render, por isso o microtask.
      queueMicrotask(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      toast.error("Permissão de câmera negada.");
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      video,
      (video.videoWidth - size) / 2,
      (video.videoHeight - size) / 2,
      size,
      size,
      0,
      0,
      640,
      640,
    );
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    stopCamera();
    if (blob) await send(blob);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs">{label}</Label>

      {camera ? (
        <div className="space-y-2">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-48 w-full rounded-sm object-cover bg-muted border border-border"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => void capture()} disabled={busy}>
              <Camera className="h-3.5 w-3.5" /> Capturar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={stopCamera}>
              <X className="h-3.5 w-3.5" /> Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <KidsPhoto
            value={value || null}
            alt={label}
            variant={variant}
            className="h-20 w-20 rounded-lg shrink-0"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Enviar foto
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void openCamera()}
            >
              <Camera className="h-3.5 w-3.5" /> Tirar foto
            </Button>
            {value && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive"
                disabled={busy}
                onClick={() => {
                  void removeKidsPhoto(value);
                  onChange("");
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void send(file);
        }}
      />
    </div>
  );
}
