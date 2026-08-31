import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Cake, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ageFrom, initialsOf } from "@/lib/painel";
import { Button } from "@/components/ui/button";
import { PanelSection, EmptyLine, Initials } from "./ui";

interface BirthdayRow {
  id: string;
  full_name: string;
  birth_date: string | null;
  phone: string | null;
}

/** Faixas etárias com modelo de mensagem próprio, do mais novo ao mais velho. */
const AGE_TEMPLATES = [
  {
    key: "birthday_message_crianca",
    max: 11,
    text: "Parabéns, {nome}! 🎈🎂 Hoje é o seu dia! Que Deus te encha de alegria, saúde e muitas brincadeiras. A Igreja Batista Atos te ama muito!",
  },
  {
    key: "birthday_message_adolescente",
    max: 17,
    text: "Feliz aniversário, {nome}! 🎉 Que esse novo ano seja cheio de sonhos, amizades verdadeiras e da presença de Deus em cada passo. Conte sempre com a gente!",
  },
  {
    key: "birthday_message_jovem",
    max: 29,
    text: "Feliz aniversário, {nome}! 🎉 Que Deus dirija os seus planos, abra portas e firme os seus passos nessa nova fase. A família da Igreja Batista Atos celebra com você!",
  },
  {
    key: "birthday_message_adulto",
    max: 59,
    text: "Feliz aniversário, {nome}! 🙌 Que Deus abençoe a sua vida, a sua família e o seu trabalho com paz e provisão. É uma alegria caminhar com você na Igreja Batista Atos!",
  },
  {
    key: "birthday_message_melhor_idade",
    max: 200,
    text: "Feliz aniversário, {nome}! 🙏 Gratidão a Deus pela sua história e pelo exemplo que o(a) senhor(a) é para nós. Que o Senhor lhe dê saúde e muitos anos de bênção. A Igreja Batista Atos celebra com o(a) senhor(a)!",
  },
] as const;

const DEFAULT_TEMPLATE =
  "Feliz aniversário, {nome}! 🎉 Que Deus continue abençoando a sua vida. Toda a família da Igreja Batista Atos celebra com você hoje!";

/** Monta a mensagem de parabéns a partir do modelo salvo pela liderança. */
function buildMessage(template: string, nome: string) {
  return template.replace(/\{nome\}/g, nome.split(" ")[0] ?? nome);
}

/** Escolhe o modelo conforme a idade, com o modelo geral como último recurso. */
function templateForAge(saved: Record<string, string>, idade: number | null): string {
  if (idade !== null) {
    const band = AGE_TEMPLATES.find((b) => idade <= b.max);
    if (band) return saved[band.key] ?? band.text;
  }
  return saved["birthday_message"] ?? DEFAULT_TEMPLATE;
}

/** Aniversariantes do mês corrente, ordenados por dia. */
export function Aniversariantes() {
  const { data, isLoading } = useQuery({
    queryKey: ["painel-aniversariantes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, birth_date, phone")
        .not("birth_date", "is", null)
        .eq("membership_status", "ativo");
      if (error) throw error;
      return data as BirthdayRow[];
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["birthday-templates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["birthday_message", ...AGE_TEMPLATES.map((t) => t.key)]);
      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.value) map[row.key] = row.value;
      }
      return map;
    },
  });

  const mes = String(new Date().getMonth() + 1).padStart(2, "0");
  const hojeDia = new Date().getDate();

  const lista = (data ?? [])
    .filter((p) => p.birth_date?.slice(5, 7) === mes)
    .sort((a, b) =>
      (a.birth_date ?? "").slice(8, 10).localeCompare((b.birth_date ?? "").slice(8, 10)),
    );

  const aniversariantesHoje = lista.filter((p) => Number(p.birth_date!.slice(8, 10)) === hojeDia);

  return (
    <PanelSection
      label="Comunhão"
      title="Aniversariantes do mês"
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/membros">Ver membros</Link>
        </Button>
      }
    >
      {isLoading && <EmptyLine>Carregando…</EmptyLine>}
      {!isLoading && lista.length === 0 && <EmptyLine>Nenhum aniversariante neste mês.</EmptyLine>}

      {aniversariantesHoje.length > 0 && (
        <p className="text-sm mb-4 leading-relaxed">
          Hoje é aniversário de{" "}
          <span className="text-primary">
            {aniversariantesHoje.map((p) => p.full_name.split(" ")[0]).join(", ")}
          </span>
          . Que tal enviar uma mensagem?
        </p>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {lista.slice(0, 8).map((p) => {
          const dia = Number(p.birth_date!.slice(8, 10));
          const hoje = dia === hojeDia;
          const phone = String(p.phone ?? "").replace(/\D/g, "");
          const idade = ageFrom(p.birth_date);
          const link = phone
            ? `https://wa.me/55${phone}?text=${encodeURIComponent(
                buildMessage(templateForAge(templates ?? {}, idade), p.full_name),
              )}`
            : null;
          return (
            <li
              key={p.id}
              className={`flex items-center gap-3 border rounded-sm p-3 ${
                hoje ? "border-primary" : "border-border"
              }`}
            >
              <Initials text={initialsOf(p.full_name)} />
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{p.full_name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Dia {String(dia).padStart(2, "0")}
                  {ageFrom(p.birth_date) !== null ? ` · ${ageFrom(p.birth_date)} anos` : ""}
                </div>
              </div>
              {hoje && <Cake className="h-4 w-4 text-primary shrink-0" />}
              {link && (
                <Button
                  asChild
                  size="sm"
                  variant={hoje ? "default" : "ghost"}
                  className="h-8 px-2 shrink-0"
                >
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Parabenizar ${p.full_name}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">Parabenizar</span>
                  </a>
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {lista.length > 8 && (
        <p className="text-xs text-muted-foreground mt-4">
          + {lista.length - 8} outros aniversariantes neste mês.
        </p>
      )}
    </PanelSection>
  );
}
