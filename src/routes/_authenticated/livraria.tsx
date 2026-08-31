import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { LivrariaCatalog } from "@/components/loja/livraria-catalog";
import { LivrariaOrders } from "@/components/loja/livraria-orders";
import { LivrariaAdminOrders, LivrariaAdminProducts } from "@/components/loja/livraria-admin";
import { LivrariaEstoque } from "@/components/loja/estoque-demanda";

export const Route = createFileRoute("/_authenticated/livraria")({
  head: () => ({
    meta: [
      { title: "Livraria — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Compre livros, camisetas, garrafas e acessórios da Igreja Batista Atos. Pague via PIX e retire na igreja com o seu código.",
      },
      { property: "og:title", content: "Livraria — Igreja Batista Atos" },
      {
        property: "og:description",
        content:
          "Catálogo da livraria da igreja: pedido online, pagamento por PIX e retirada presencial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LivrariaPage,
});

function LivrariaPage() {
  const { isLivrariaAdmin } = useAuth();

  return (
    <>
      <PageHeader
        eyebrow="Shopping & Editorial"
        title="Livraria"
        description="Uma curadoria de literatura cristã, acessórios e vestuário que expressam a nossa identidade. Reserve seu item, pague via PIX e retire em nosso balcão físico."
      />

      <PageBody>
        <Tabs defaultValue="catalogo">
          <TabsList className="mb-8">
            <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
            <TabsTrigger value="pedidos">Meus pedidos</TabsTrigger>
            {isLivrariaAdmin && <TabsTrigger value="gestao">Cadastrar produtos</TabsTrigger>}
            {isLivrariaAdmin && <TabsTrigger value="fila">Fila de pedidos</TabsTrigger>}
            {isLivrariaAdmin && <TabsTrigger value="estoque">Estoque e demanda</TabsTrigger>}
          </TabsList>
          <TabsContent value="catalogo">
            <LivrariaCatalog />
          </TabsContent>
          <TabsContent value="pedidos">
            <LivrariaOrders />
          </TabsContent>
          {isLivrariaAdmin && (
            <TabsContent value="gestao">
              <LivrariaAdminProducts />
            </TabsContent>
          )}
          {isLivrariaAdmin && (
            <TabsContent value="fila">
              <LivrariaAdminOrders />
            </TabsContent>
          )}
          {isLivrariaAdmin && (
            <TabsContent value="estoque">
              <LivrariaEstoque />
            </TabsContent>
          )}
        </Tabs>
      </PageBody>
    </>
  );
}
