/**
 * Kulto — design tokens (fonte única da verdade).
 *
 * Derivado do "Kulto Brand Guidelines V2.0" (reference/Kulto Brand Guidelines.html).
 * Este arquivo é CommonJS de propósito: é consumido tanto pelo `tailwind.config.js`
 * (Node, em build) quanto pelo app via `@/theme/tokens` (com `allowJs`).
 *
 * Regras da marca que estes tokens codificam:
 *  - App monocromático. Não existe "cor de acento", existe um *tratamento* de acento:
 *    preenchimento sólido em `cream` sobre `bg`, reservado para a ação primária e para a nota.
 *  - Elevação = clarear a superfície + borda. Nunca sombra.
 *  - Cor de vertical só aparece em ícone/chip/traço — nunca como fill de superfície.
 *
 * Dois temas (modo claro aprovado pelo usuário a partir de uma proposta — ver
 * PROGRESS.md, Fase 6 passo 36). Os NOMES dos papéis são os mesmos nos dois:
 * `cream` é "a tinta forte do tema" (texto, nota, ação primária) — creme no
 * escuro, preto no claro — e `ink` é o texto sobre ela. No claro, a superfície
 * elevada fica mais clara que o fundo (papel sobre papel).
 */

const dark = {
  // Neutros — "uma escala curta de ambientes", não um preto puro.
  bg: '#0D0D0D', // Preto Sala — fundo geral (evita #000)
  surface1: '#161616', // cards, listas, painéis — 1º nível de elevação
  surface2: '#1F1F1F', // modais, menus, campos — teto da profundidade
  line: '#2A2A2A', // divisórias, bordas — substitui a sombra no escuro

  cream: '#F5F2EA', // título, corpo, ação primária, nota. "Lê como papel."
  textMuted: '#A3A099', // metadados e apoio
  textFaint: '#8A867E', // placeholder, disabled, metadado miúdo — 5,4:1 no fundo, 4,6:1 na surface 2
  ink: '#0D0D0D', // texto sobre `cream` sólido

  // Verticais — única fonte cromática recorrente. Mesmo peso entre si.
  filme: '#7FA0FF',
  serie: '#C49BFF',
  livro: '#79D8C4',
  game: '#FF9BBB',

  // Semânticas — só comunicam estado, nunca decoram.
  success: '#4ED8A0', // menta — sucesso, salvo, verificado
  warning: '#FF8A3D', // âmbar — aviso, spoiler
  danger: '#FF5C5C', // vermelho — erro, ação destrutiva
  like: '#FAB005', // dourado — coração aceso no post (decisão do usuário: o mesmo do selo)
  // Azul do "Ver depois" marcado (decisão do usuário). Aqui a cor não decora:
  // ela **é** o estado — sem ela, marcado e não marcado seriam o mesmo desenho.
  saved: '#009DFF',

  /** Véu de seleção do estado "Ativo": borda `cream` + este preenchimento. */
  veil: 'rgba(245, 242, 234, 0.12)',
};

const light = {
  bg: '#F5F2EA',
  surface1: '#FBF9F4',
  surface2: '#FFFFFF',
  line: '#D6D0C2',

  cream: '#0D0D0D',
  textMuted: '#5E5A53', // 6,1:1 sobre o fundo
  textFaint: '#726E67', // 4,5:1 sobre o fundo, como no escuro
  ink: '#F5F2EA',

  // Escurecidas pra ler sobre creme (todas ≥ 4,3:1); as do escuro cairiam a ~2:1.
  filme: '#3F62D6',
  serie: '#8250D9',
  livro: '#177F69',
  game: '#C93D71',

  success: '#13815A',
  warning: '#B5530F',
  danger: '#C93434',
  like: '#A87400', // dourado escurecido, pra ler sobre o creme (como o selo no claro)
  saved: '#0077C2', // o mesmo azul, escurecido pra ler sobre o creme

  veil: 'rgba(13, 13, 13, 0.06)',
};

const palettes = { dark, light };

/**
 * Paleta escura fixa — pra quem não acompanha o tema: a capinha de prévia de
 * link (`api/og.ts`), desenhada escura no Penpot. O app lê a paleta do tema
 * atual por `useColors()` (lib/theme).
 */
const color = dark;
const activeVeil = dark.veil;

const COLOR_KEYS = Object.keys(dark).filter((key) => key !== 'veil');

function rgbTriplet(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Variáveis CSS de uma paleta (`--c-bg: 13 13 13`…), consumidas pelas classes do Tailwind. */
function cssVars(palette) {
  const vars = {};
  for (const key of COLOR_KEYS) vars[`--c-${key}`] = rgbTriplet(palette[key]);
  const [r, g, b, a] = palette.veil.match(/[\d.]+/g);
  vars['--c-veil'] = `${r} ${g} ${b}`;
  vars['--c-veil-a'] = a;
  return vars;
}

/** Cor do Tailwind apontando pra variável — aceita modificador de opacidade (`bg-cream/12`). */
function themeColor(key) {
  return `rgb(var(--c-${key}) / <alpha-value>)`;
}

/**
 * Famílias tipográficas. Cada peso é um arquivo próprio (expo-google-fonts):
 * não há peso sintético em fontes custom no React Native.
 *  - `sans*`  = Space Grotesk — display e corpo.
 *  - `data*`  = Inter — nota, metadados, timestamps, rótulos caixa-alta, contadores.
 *              `font-feature-settings: "tnum"` é obrigatório em toda nota/número (ver componente Text).
 */
const fontFamily = {
  sans: 'SpaceGrotesk_400Regular',
  sansMedium: 'SpaceGrotesk_500Medium',
  sansSemibold: 'SpaceGrotesk_600SemiBold',
  sansBold: 'SpaceGrotesk_700Bold',
  data: 'Inter_400Regular',
  dataMedium: 'Inter_500Medium',
  dataSemibold: 'Inter_600SemiBold',
};

/**
 * Escala tipográfica — base 16px, razão modular 1,25 (do brand guideline).
 * Cada entrada é [fontSize, lineHeight] em px.
 */
const fontSize = {
  micro: ['10px', '14px'], // micro / legal
  meta: ['12px', '16px'], // metadados
  caption: ['14px', '19px'],
  body: ['16px', '24px'], // corpo — máx. 75 caracteres por linha
  'body-lg': ['20px', '26px'],
  subhead: ['25px', '31px'],
  title: ['31px', '37px'], // título de seção
  display: ['39px', '46px'],
  hero: ['49px', '56px'],
};

/** Rótulo em caixa alta: Inter 500, tracking ~ +0,08em (ver brand D · Tipografia). */
const letterSpacing = {
  label: '0.08em',
  normal: '0',
};

const radius = {
  none: '0px',
  sm: '2px',
  md: '4px', // padrão para chips, campos, cards
  lg: '8px',
  full: '9999px',
};

module.exports = {
  color,
  activeVeil,
  palettes,
  cssVars,
  themeColor,
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
};
