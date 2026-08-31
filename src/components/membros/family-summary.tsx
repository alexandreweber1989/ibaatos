import { Badge } from "@/components/ui/badge";
import { relationLabel, sortFamily, useFamilyLinks, type FamilyLink } from "@/lib/family";

/** Agrupa os vínculos por geração para desenhar a árvore da casa. */
const GROUPS: { title: string; relations: string[] }[] = [
  { title: "Geração anterior", relations: ["avo", "pai", "mae"] },
  { title: "Núcleo", relations: ["conjuge", "irmao"] },
  { title: "Geração seguinte", relations: ["filho", "neto"] },
  { title: "Outros parentes", relations: ["outro"] },
];

function PersonLine({ link }: { link: FamilyLink }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <Badge variant="outline" className="shrink-0">
        {relationLabel(link.relation)}
      </Badge>
      <span className="truncate">
        {link.relative?.full_name}
        {link.relation === "filho" && link.otherParent && (
          <span className="text-muted-foreground"> · com {link.otherParent.full_name}</span>
        )}
      </span>
    </li>
  );
}

/** Resumo do núcleo familiar exibido na ficha do membro. */
export function FamilySummary({ personId, enabled }: { personId: string; enabled: boolean }) {
  const { data: links } = useFamilyLinks(personId, enabled);
  const list = sortFamily(links ?? []);

  const spouse = list.find((l) => l.relation === "conjuge");
  const children = list.filter((l) => l.relation === "filho");

  const phrase = (() => {
    const parts: string[] = [];
    if (spouse) parts.push(`Casado(a) com ${spouse.relative?.full_name}`);
    if (children.length) {
      const shared = spouse
        ? children.filter((c) => c.otherParent?.id === spouse.relative_id).length
        : 0;
      const detail =
        spouse && shared && shared !== children.length
          ? ` (${shared} do casal, ${children.length - shared} de outro relacionamento)`
          : "";
      parts.push(
        `${children.length} filho(s): ${children.map((c) => c.relative?.full_name).join(", ")}${detail}`,
      );
    }
    return parts.join(" · ");
  })();

  if (!list.length)
    return <p className="text-sm text-muted-foreground">Nenhum parente vinculado.</p>;

  return (
    <div className="space-y-3">
      {phrase && <p className="text-sm">{phrase}</p>}
      <div className="space-y-3">
        {GROUPS.map((group) => {
          const items = list.filter((l) => group.relations.includes(l.relation));
          if (!items.length) return null;
          return (
            <section key={group.title} className="border-l-2 border-border pl-3 space-y-1.5">
              <h5 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                {group.title}
              </h5>
              <ul className="space-y-1.5">
                {items.map((link) => (
                  <PersonLine key={link.id} link={link} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
