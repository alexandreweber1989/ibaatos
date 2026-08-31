import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalidades } from "@/hooks/use-localidades";

type Mesa = {
  perfil: string;
  rede: string;
  mesa: string;
  dia: string;
  hora: string;
  local: string;
  bairros: string[];
  cidade?: string;
  lider: string;
  whatsapp: string;
};

const MESAS_EXEMPLO: Mesa[] = [
  {
    perfil: "homem",
    rede: "Rede Zadoque",
    mesa: "Mesa Zadoque 1",
    dia: "Quarta",
    hora: "20h",
    local: "Uvaranas",
    bairros: ["Uvaranas", "Oficinas", "Chapada"],
    cidade: "Ponta Grossa",
    lider: "Ap. André",
    whatsapp: "5542999990001",
  },
  {
    perfil: "homem",
    rede: "Rede Zadoque",
    mesa: "Mesa Zadoque 2",
    dia: "Quinta",
    hora: "20h",
    local: "Centro",
    bairros: ["Centro", "Nova Rússia", "Contorno"],
    cidade: "Ponta Grossa",
    lider: "Ap. Rafael",
    whatsapp: "5542999990002",
  },
  {
    perfil: "mulher",
    rede: "Rede Sabaoth",
    mesa: "Mesa Sabaoth 1",
    dia: "Terça",
    hora: "20h",
    local: "Oficinas",
    bairros: ["Uvaranas", "Oficinas", "Boa Vista"],
    cidade: "Ponta Grossa",
    lider: "Ap. Débora",
    whatsapp: "5542999990003",
  },
  {
    perfil: "mulher",
    rede: "Rede Sabaoth",
    mesa: "Mesa Sabaoth 2",
    dia: "Quinta",
    hora: "20h",
    local: "Centro",
    bairros: ["Centro", "Jardim Carvalho", "Colônia Dona Luíza"],
    cidade: "Ponta Grossa",
    lider: "Ap. Priscila",
    whatsapp: "5542999990004",
  },
  {
    perfil: "jovem",
    rede: "Rede de Jovens",
    mesa: "Mesa dos Jovens",
    dia: "Sábado",
    hora: "19h",
    local: "Templo",
    bairros: [],
    cidade: "Ponta Grossa",
    lider: "Líder Lucas",
    whatsapp: "5542999990005",
  },
  {
    perfil: "adolescente",
    rede: "Rede de Adolescentes",
    mesa: "Mesa dos Teens",
    dia: "Sábado",
    hora: "16h",
    local: "Sala Teens",
    bairros: [],
    cidade: "Ponta Grossa",
    lider: "Líder Ana",
    whatsapp: "5542999990006",
  },
];
const WHATSAPP_IGREJA = "5542900000000";

const PERFIS = [
  { v: "mulher", label: "Mulher" },
  { v: "homem", label: "Homem" },
  { v: "jovem", label: "Jovem (16+)" },
  { v: "adolescente", label: "Adolescente" },
];

function acharMesa(perfil: string, bairro: string, cidade: string): Mesa | null {
  const daRede = MESAS_EXEMPLO.filter((m) => m.perfil === perfil);
  if (daRede.length === 0) return null;
  const porBairro = daRede.find((m) => m.bairros.includes(bairro) && m.cidade === cidade);
  if (porBairro) return porBairro;
  const porCidade = daRede.find((m) => m.cidade === cidade);
  if (porCidade) return porCidade;
  return daRede[0];
}

function listarOutrasMesas(perfil: string, mesaAtual: Mesa | null): Mesa[] {
  return MESAS_EXEMPLO.filter((m) => m.perfil === perfil && m.mesa !== mesaAtual?.mesa);
}

function linkWhatsApp(numero: string, msg: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
}

const CIDADES_HABILITADAS = [
  { id: 4104808, nome: "Cascavel", uf: "PR" },
  { id: 4202100, nome: "Barra Velha", uf: "SC" },
  { id: 4104907, nome: "Castro", uf: "PR" },
  { id: 4119905, nome: "Ponta Grossa", uf: "PR" },
];

const BAIRROS_POR_CIDADE: Record<string, string[]> = {
  "4104907": ["Centro", "Jardim Araucária", "Vila Rio Branco"],
  "4119905": ["Boa Vista", "Centro", "Jardim Carvalho", "Nova Rússia", "Oficinas", "Uvaranas"],
};

export function CadastroLead() {
  const reduce = useReducedMotion();
  const { bairros, buscarBairros, loadingBairros } = useLocalidades();

  const [form, setForm] = useState({
    nome: "",
    whatsapp: "",
    perfil: "",
    uf: "",
    cidadeId: "",
    cidadeNome: "",
    bairro: "",
    bairroManual: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<
    { principal: Mesa | null; outras: Mesa[] } | undefined
  >(undefined);

  const formatWhatsApp = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 2) return v;
    if (v.length <= 3) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2, 3)} ${v.slice(3)}`;
    return `(${v.slice(0, 2)}) ${v.slice(2, 3)} ${v.slice(3, 7)}-${v.slice(7, 11)}`;
  };

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let value = e.target.value;
      if (k === "whatsapp") value = formatWhatsApp(value);

      if (k === "cidadeId") {
        const city = CIDADES_HABILITADAS.find((c) => c.id.toString() === value);
        buscarBairros(Number(value));
        setForm((f) => ({
          ...f,
          cidadeId: value,
          cidadeNome: city?.nome || "",
          uf: city?.uf || "",
          bairro: "",
        }));
        return;
      }
      setForm((f) => ({ ...f, [k]: value }));
    };

  const valido =
    form.nome.length > 2 &&
    form.whatsapp.replace(/\D/g, "").length >= 10 &&
    form.perfil &&
    form.cidadeId &&
    (form.bairro === "Outro" ? form.bairroManual.length > 1 : form.bairro);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    const numericPhone = form.whatsapp.replace(/\D/g, "");
    const bairroFinal = form.bairro === "Outro" ? form.bairroManual.trim() : form.bairro;
    const mesaPrincipal = acharMesa(form.perfil, bairroFinal, form.cidadeNome);

    try {
      await supabase.from("leads").insert({
        name: form.nome.trim(),
        phone: numericPhone,
        profile: form.perfil,
        neighborhood: bairroFinal,
        city: form.cidadeNome,
        state: form.uf,
        suggested_mesa: mesaPrincipal?.mesa ?? null,
        status: "novo",
      });
    } catch (err) {
      console.error("Erro ao registrar lead:", err);
    }

    setResultado({
      principal: mesaPrincipal ?? null,
      outras: listarOutrasMesas(form.perfil, mesaPrincipal),
    });
    setEnviando(false);
  }

  const anim = !reduce
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98 },
      }
    : {};

  return (
    <div className="w-full relative mx-auto my-6 lg:my-12">
      {/* Container Premium harmonizado com o tema base via classes do Shadcn/Radix */}
      <div className="w-full lg:max-w-6xl mx-auto rounded-3xl border border-border/40 bg-card/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
        {/* Glow Effects atrelados à cor theme-primary */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000" />
        <div className="absolute inset-x-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="p-8 lg:p-16">
          <AnimatePresence mode="wait">
            {!resultado ? (
              <motion.form
                key="form"
                onSubmit={enviar}
                {...anim}
                transition={{ duration: 0.5 }}
                className="w-full flex flex-col lg:flex-row gap-12"
              >
                {/* Lado Esquerdo */}
                <div className="flex-1 lg:max-w-md flex flex-col justify-center">
                  <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-foreground mb-4">
                    Conecte-se a<br />
                    <span className="text-primary italic font-semibold">uma Mesa.</span>
                  </h3>
                  <p className="text-muted-foreground text-sm lg:text-base leading-relaxed mb-8">
                    Não fomos feitos para caminhar sozinhos. Nos diga um pouco sobre você e
                    encontraremos a célula mais próxima da sua casa.
                  </p>

                  <div className="mb-6 lg:mb-8">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-widest pl-1 block mb-3">
                      1. Qual perfil te descreve? <span className="text-primary">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                      {PERFIS.map((p) => (
                        <button
                          key={p.v}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, perfil: p.v }))}
                          className={`
                            relative overflow-hidden flex items-center justify-between px-5 h-14 rounded-xl text-sm md:text-base font-bold transition-all duration-300 border-2
                            ${
                              form.perfil === p.v
                                ? "bg-primary/10 border-primary text-foreground shadow-[0_4px_20px_-5px_rgba(var(--primary),0.3)] scale-[1.02]"
                                : "bg-background/60 border-border/60 text-muted-foreground hover:bg-muted hover:border-foreground/30 hover:text-foreground"
                            }
                          `}
                        >
                          <span className="relative z-10">{p.label}</span>

                          {/* Checked Indicator */}
                          <div
                            className={`transition-all duration-300 flex items-center justify-center w-5 h-5 rounded-full ${form.perfil === p.v ? "bg-primary text-primary-foreground scale-100 opacity-100" : "scale-50 opacity-0"}`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lado Direito (Campos) */}
                <div className="flex-1 flex flex-col justify-center gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputTheme
                      label="Seu Nome"
                      val={form.nome}
                      onChange={set("nome")}
                      hold="Como podemos te chamar"
                    />
                    <InputTheme
                      label="WhatsApp"
                      val={form.whatsapp}
                      onChange={set("whatsapp")}
                      hold="(42) 90000-0000"
                      type="tel"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SelectTheme
                      label="Sua Cidade"
                      val={form.cidadeId}
                      onChange={set("cidadeId")}
                      options={CIDADES_HABILITADAS.map((c) => ({
                        val: c.id.toString(),
                        num: `${c.nome}`,
                      }))}
                    />
                    <SelectTheme
                      label="Seu Bairro"
                      val={form.bairro}
                      onChange={set("bairro")}
                      disabled={!form.cidadeId}
                      options={[
                        ...(BAIRROS_POR_CIDADE[form.cidadeId]
                          ? BAIRROS_POR_CIDADE[form.cidadeId]
                              .sort()
                              .map((b) => ({ val: b, num: b }))
                          : bairros.map((b) => ({ val: b.nome, num: b.nome }))),
                        ...(form.cidadeId ? [{ val: "Outro", num: "Outro bairro..." }] : []),
                      ]}
                    />
                  </div>

                  {form.bairro === "Outro" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <InputTheme
                        label="Digite o bairro (Manual)"
                        val={form.bairroManual}
                        onChange={(e) => setForm((f) => ({ ...f, bairroManual: e.target.value }))}
                        hold="Bairro exato"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!valido || enviando}
                    className="mt-6 w-full h-[64px] rounded-xl bg-foreground text-background font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
                  >
                    {enviando ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      <>
                        Mostrar meu próximo passo <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div key="result" {...anim} className="w-full text-center py-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Check className="w-8 h-8" />
                </div>

                <h3 className="font-serif text-3xl lg:text-5xl text-foreground mb-3">
                  Conexão encontrada, {form.nome.split(" ")[0]}!
                </h3>
                <p className="text-muted-foreground text-base max-w-lg mx-auto mb-10">
                  Tudo centralizado e preparado. Só precisamos que você dê o um "Oi" para que seu
                  líder te coloque no grupo.
                </p>

                {resultado.principal ? (
                  <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-8 text-left shadow-lg">
                    <div className="text-xs font-bold text-primary tracking-widest uppercase mb-2">
                      {resultado.principal.rede}
                    </div>
                    <div className="text-3xl lg:text-4xl font-serif text-foreground mb-3">
                      {resultado.principal.mesa}
                    </div>
                    <div className="text-muted-foreground text-sm flex items-center gap-2 mb-8">
                      <MapPin className="w-4 h-4" /> {resultado.principal.local} — Toda{" "}
                      {resultado.principal.dia}, às {resultado.principal.hora}
                    </div>

                    <a
                      href={linkWhatsApp(
                        resultado.principal.whatsapp,
                        `Olá, quero participar da ${resultado.principal.mesa}`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full md:w-auto inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground px-8 h-12 rounded-xl font-bold hover:opacity-90 transition-opacity"
                    >
                      Falar direto no WhatsApp <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <a
                    href={linkWhatsApp(WHATSAPP_IGREJA, "Olá! Vim pelo site...")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground px-8 h-12 rounded-xl font-bold hover:opacity-90 transition-opacity"
                  >
                    Falar com a Secretaria <ArrowRight className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={() => setResultado(undefined)}
                  className="block mx-auto mt-12 text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                >
                  ← Voltar e refazer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function InputTheme({ label, val, hold, onChange, type = "text" }: any) {
  return (
    <label className="flex flex-col gap-1.5 focus-within:text-foreground text-muted-foreground transition-colors">
      <span className="text-xs uppercase tracking-widest font-semibold ml-1">{label}</span>
      <input
        type={type}
        value={val}
        onChange={onChange}
        placeholder={hold}
        className="h-14 lg:h-16 px-4 lg:px-5 rounded-xl bg-background/50 border border-border text-foreground text-base placeholder:text-muted-foreground/40 outline-none transition-all focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary/50"
      />
    </label>
  );
}

function SelectTheme({ label, val, options, onChange, disabled }: any) {
  return (
    <label
      className={`flex flex-col gap-1.5 focus-within:text-foreground text-muted-foreground transition-colors ${disabled ? "opacity-50" : ""}`}
    >
      <span className="text-xs uppercase tracking-widest font-semibold ml-1">{label}</span>
      <select
        value={val}
        onChange={onChange}
        disabled={disabled}
        className="h-14 lg:h-16 px-4 lg:px-5 rounded-xl bg-background/50 border border-border text-foreground text-base outline-none transition-all focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center]"
      >
        <option value="" className="text-muted-foreground">
          Selecione...
        </option>
        {options.map((o: any) => (
          <option key={o.val} value={o.val}>
            {o.num}
          </option>
        ))}
      </select>
    </label>
  );
}
