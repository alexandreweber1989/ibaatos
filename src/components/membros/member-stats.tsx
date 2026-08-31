import { ageFrom, birthdayThisMonth } from "@/lib/membros";

export interface StatMember {
  birth_date: string | null;
  membership_status: string | null;
  is_baptized: boolean | null;
  gender: string | null;
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-border bg-card p-4 rounded-sm">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="font-serif text-3xl leading-none mt-2">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

/** Painel de indicadores da membresia. */
export function MemberStats({ members }: { members: StatMember[] }) {
  const total = members.length;
  const ativos = members.filter((m) => (m.membership_status ?? "ativo") === "ativo").length;
  const batizados = members.filter((m) => m.is_baptized).length;
  const aniversariantes = members.filter((m) => birthdayThisMonth(m.birth_date)).length;
  const idades = members.map((m) => ageFrom(m.birth_date)).filter((a): a is number => a !== null);
  const media = idades.length ? Math.round(idades.reduce((a, b) => a + b, 0) / idades.length) : 0;
  const homens = members.filter((m) => m.gender === "masculino").length;
  const mulheres = members.filter((m) => m.gender === "feminino").length;

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 mb-8">
      <Stat label="Total" value={total} hint={`${homens}♂ · ${mulheres}♀`} />
      <Stat
        label="Ativos"
        value={ativos}
        hint={total ? `${Math.round((ativos / total) * 100)}% da base` : undefined}
      />
      <Stat label="Fieis" value={batizados} hint="Batizados" />
      <Stat label="Celebração" value={aniversariantes} hint="Nascidos este mês" />
      <Stat label="Média" value={media ? `${media} anos` : "—"} hint="Perfil etário" />
    </div>
  );
}
