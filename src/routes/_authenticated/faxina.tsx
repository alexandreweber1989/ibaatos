import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, PageBody } from "@/components/app-shell";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
  Camera,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isFriday,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/faxina")({
  component: CleaningSchedulePage,
});

function CleaningSchedulePage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const fridays = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd }).filter((d) => isFriday(d));
  }, [monthStart, monthEnd]);

  const { data: schedules } = useQuery({
    queryKey: ["cleaning-schedules", format(currentDate, "yyyy-MM")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cleaning_schedules" as any)
        .select(
          `
          *,
          mesa:mesas(id, name),
          tasks:cleaning_tasks(*, photos:cleaning_photos(*))
        `,
        )
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"))
        .order("date", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: mesas } = useQuery({
    queryKey: ["mesas-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mesas").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const upsertSchedule = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from("cleaning_schedules" as any)
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-schedules"] });
      toast.success("Escala atualizada com sucesso!");
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ taskId, isCompleted }: { taskId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from("cleaning_tasks" as any)
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          completed_by: isCompleted ? user?.id : null,
        } as any)
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-schedules"] });
    },
  });

  const addTask = useMutation({
    mutationFn: async ({ scheduleId, title }: { scheduleId: string; title: string }) => {
      const { error } = await supabase
        .from("cleaning_tasks" as any)
        .insert({ schedule_id: scheduleId, title } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-schedules"] });
      toast.success("Tarefa adicionada!");
    },
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({
      taskId,
      scheduleId,
      file,
      type,
    }: {
      taskId: string;
      scheduleId: string;
      file: File;
      type: "before" | "after";
    }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${scheduleId}/${taskId}/${type}_${Math.random()}.${fileExt}`;
      const filePath = `cleaning-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("kids-documents-v2") // Using existing bucket or creating one
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("kids-documents-v2").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("cleaning_photos" as any).insert({
        schedule_id: scheduleId,
        task_id: taskId,
        url: publicUrl,
        type,
        created_by: user?.id,
      } as any);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-schedules"] });
      toast.success("Foto enviada com sucesso!");
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from("cleaning_photos" as any)
        .delete()
        .eq("id", photoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-schedules"] });
      toast.success("Foto removida!");
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Escala de Faxina"
        description="Gerenciamento semanal das equipes de limpeza da igreja."
        actions={
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-mono text-xs uppercase tracking-widest min-w-[140px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      <PageBody>
        <div className="grid gap-8">
          {fridays.map((friday) => {
            const dateStr = format(friday, "yyyy-MM-dd");
            const schedule = schedules?.find((s) => s.date === dateStr);

            return (
              <Card
                key={dateStr}
                className="overflow-hidden border-border/40 hover:border-primary/20 transition-all duration-300"
              >
                <CardHeader className="bg-muted/30 border-b border-border/40 flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-sm bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                      <span className="text-[10px] uppercase font-mono text-primary font-bold">
                        Sex
                      </span>
                      <span className="text-xl font-serif leading-none">
                        {format(friday, "dd")}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-serif">
                        {format(friday, "dd 'de' MMMM", { locale: ptBR })}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {schedule?.mesa ? (
                          <Badge
                            variant="secondary"
                            className="font-mono text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-primary/20"
                          >
                            Mesa: {schedule.mesa.name}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground border-dashed"
                          >
                            Sem mesa definida
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-mono text-[10px] uppercase tracking-wider"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Escalar Mesa
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="p-8">
                        <SheetHeader>
                          <SheetTitle className="font-serif text-2xl">
                            Atribuir Responsabilidade
                          </SheetTitle>
                        </SheetHeader>
                        <div className="space-y-6 mt-8">
                          <div className="space-y-2">
                            <Label>Mesa Responsável</Label>
                            <Select
                              value={schedule?.mesa_id || ""}
                              onValueChange={(val) =>
                                upsertSchedule.mutate({
                                  id: schedule?.id,
                                  date: dateStr,
                                  mesa_id: val,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma mesa" />
                              </SelectTrigger>
                              <SelectContent>
                                {mesas?.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Observações</Label>
                            <Input
                              placeholder="Instruções especiais..."
                              defaultValue={schedule?.notes || ""}
                              onBlur={(e) =>
                                upsertSchedule.mutate({
                                  id: schedule?.id,
                                  date: dateStr,
                                  notes: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid lg:grid-cols-[1fr_300px] gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Checklist de Limpeza
                        </h3>
                        {isAdmin && schedule && (
                          <AddTaskButton
                            scheduleId={schedule.id}
                            onAdd={(title) => addTask.mutate({ scheduleId: schedule.id, title })}
                          />
                        )}
                      </div>

                      {!schedule ? (
                        <div className="py-8 text-center border-2 border-dashed border-border/20 rounded-sm">
                          <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">
                            Aguardando escala oficial
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(schedule.tasks || []).length === 0 && (
                            <p className="text-xs text-muted-foreground italic">
                              Nenhuma tarefa listada para este dia.
                            </p>
                          )}
                          {(schedule.tasks || []).map((task: any) => (
                            <div
                              key={task.id}
                              className="flex flex-col gap-2 p-3 rounded-sm bg-muted/20 border border-border/10 hover:border-primary/20 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={task.is_completed}
                                  onCheckedChange={(val) =>
                                    toggleTask.mutate({ taskId: task.id, isCompleted: !!val })
                                  }
                                  disabled={!isAdmin && !useAuth().isMesaLeader(schedule.mesa_id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm ${task.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                                  >
                                    {task.title}
                                  </p>
                                  {task.is_completed && task.completed_at && (
                                    <p className="text-[10px] text-primary/60 font-mono uppercase">
                                      Concluído em {format(new Date(task.completed_at), "HH:mm")}
                                    </p>
                                  )}
                                </div>
                                <PhotoGallery
                                  task={task}
                                  scheduleId={schedule.id}
                                  onUpload={(file: File, type: "before" | "after") =>
                                    uploadPhoto.mutate({
                                      taskId: task.id,
                                      scheduleId: schedule.id,
                                      file,
                                      type,
                                    })
                                  }
                                  onDelete={(id: string) => deletePhoto.mutate(id)}
                                  canEdit={isAdmin || useAuth().isMesaLeader(schedule.mesa_id)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-muted/30 rounded-sm p-4 space-y-4 border border-border/40">
                      <h4 className="font-serif font-bold text-sm tracking-tight">
                        Status da Escala
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-mono">
                            {(schedule?.tasks || []).filter((t: any) => t.is_completed).length || 0}
                            /{(schedule?.tasks || []).length || 0}
                          </span>
                        </div>
                        <div className="h-1 bg-border/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{
                              width: `${(schedule?.tasks || []).length ? ((schedule.tasks || []).filter((t: any) => t.is_completed).length / (schedule.tasks || []).length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border/40 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Sexta-feira • 19:30
                        </div>
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Presencial
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PageBody>
    </>
  );
}

function AddTaskButton({
  scheduleId,
  onAdd,
}: {
  scheduleId: string;
  onAdd: (title: string) => void;
}) {
  const [title, setTitle] = useState("");
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-8">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">Nova Tarefa</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-8">
          <div className="space-y-2">
            <Label>O que precisa ser feito?</Label>
            <Input
              placeholder="Ex: Limpar janelas do salão"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onAdd(title);
                  setTitle("");
                }
              }}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => {
              if (title.trim()) {
                onAdd(title);
                setTitle("");
              }
            }}
          >
            Adicionar Tarefa
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PhotoGallery({
  task,
  scheduleId,
  onUpload,
  onDelete,
  canEdit,
}: {
  task: any;
  scheduleId: string;
  onUpload: (file: File, type: "before" | "after") => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}) {
  const photos = task.photos || [];
  const beforePhotos = photos.filter((p: any) => p.type === "before");
  const afterPhotos = photos.filter((p: any) => p.type === "after");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <ImageIcon className="h-4 w-4" />
          {photos.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-[8px] text-white rounded-full w-3 h-3 flex items-center justify-center font-bold">
              {photos.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Galeria - {task.title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="before" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="before">Antes</TabsTrigger>
            <TabsTrigger value="after">Depois</TabsTrigger>
          </TabsList>

          <PhotoTabContent
            type="before"
            photos={beforePhotos}
            onUpload={onUpload}
            onDelete={onDelete}
            canEdit={canEdit}
          />
          <PhotoTabContent
            type="after"
            photos={afterPhotos}
            onUpload={onUpload}
            onDelete={onDelete}
            canEdit={canEdit}
          />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function PhotoTabContent({
  type,
  photos,
  onUpload,
  onDelete,
  canEdit,
}: {
  type: "before" | "after";
  photos: any[];
  onUpload: (file: File, type: "before" | "after") => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}) {
  return (
    <TabsContent value={type} className="space-y-4 mt-4">
      {canEdit && (
        <div className="flex items-center gap-4 p-4 border-2 border-dashed border-border/20 rounded-sm">
          <label className="flex flex-col items-center justify-center w-full cursor-pointer hover:bg-muted/30 transition-colors py-4">
            <Camera className="h-6 w-6 mb-2 text-muted-foreground" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Adicionar Foto
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file, type);
              }}
            />
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {photos.map((photo: any) => (
          <div
            key={photo.id}
            className="relative aspect-square group rounded-sm overflow-hidden border border-border/10"
          >
            <img src={photo.url} alt="Faxina" className="object-cover w-full h-full" />
            {canEdit && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(photo.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        {photos.length === 0 && (
          <div className="col-span-full py-8 text-center bg-muted/10 rounded-sm">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
              Nenhuma foto enviada
            </p>
          </div>
        )}
      </div>
    </TabsContent>
  );
}
