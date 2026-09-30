/**
 * Kulto · a folha que sobe do pé da tela
 *
 * A tela de nova review e o detalhe de review sobem como folha no celular.
 * O movimento é simples de descrever e tem três armadilhas que só aparecem
 * quando o código encontra um aparelho de verdade. As três estão aqui, com o
 * sintoma que cada uma produz.
 */

const SUBIR_MS = 320;
const DESCER_MS = 240;
/** Acima disso é desktop: a tela entra no shell, sem folha e sem animação. */
const LARGURA_DESKTOP = 1024;

export default function FolhaQueSobe() {
  const { width } = useWindowDimensions();
  const reduzirMovimento = useReducedMotion();
  const noCelular = width < LARGURA_DESKTOP;

  // A altura vem do espaço onde a tela foi colocada, não da janela: no
  // desktop esse espaço é a coluna do meio do shell, não a tela inteira.
  const [alturaDisponivel, setAlturaDisponivel] = useState(0);
  const alturaFolha = alturaDisponivel;

  // ---------------------------------------------------------------------
  // ARMADILHA 1 · guardar pixels em vez de fração
  //
  // Sintoma: a folha aparece inteira no lugar final, pisca, e só então
  // desce para começar a subir.
  //
  // Causa: a altura só é conhecida depois do onLayout. Um valor animado em
  // pixels nasce com a altura errada (zero) e se corrige no quadro seguinte.
  //
  // Correção: guardar QUANTO da folha ainda está escondida, de 0 a 1. A
  // fração é válida antes de a medida chegar.
  // ---------------------------------------------------------------------
  const escondido = useSharedValue(1);

  // ---------------------------------------------------------------------
  // ARMADILHA 2 · o estilo animado atrasa um quadro
  //
  // Sintoma: mesmo com a fração, existem dois quadros em que a folha já tem
  // tamanho mas a posição ainda não foi aplicada — e ela pisca no lugar
  // final antes de subir.
  //
  // Correção: só tornar visível quando a animação de fato começou. Esperar
  // um requestAnimationFrame resolve sem depender de quando o Reanimated
  // aplica o estilo.
  // ---------------------------------------------------------------------
  const [visivel, setVisivel] = useState(false);

  // ---------------------------------------------------------------------
  // ARMADILHA 3 · o teclado muda a altura medida
  //
  // Sintoma: a pessoa toca no campo de comentário, o teclado abre, e a
  // folha SOBE DE NOVO no meio da digitação.
  //
  // Causa: o teclado muda a altura do layout, o onLayout dispara, o efeito
  // depende dessa altura e roda outra vez.
  //
  // Correção: a entrada acontece uma vez só, travada por um ref. A tela de
  // detalhe da review não precisou disso porque não tem campo de texto
  // grande — o bug só existe onde há teclado.
  // ---------------------------------------------------------------------
  const jaEntrou = useRef(false);

  useEffect(() => {
    if (!noCelular || alturaFolha === 0 || jaEntrou.current) return;
    jaEntrou.current = true;
    escondido.value = 1;
    const quadro = requestAnimationFrame(() => {
      setVisivel(true);
      escondido.value = reduzirMovimento
        ? 0
        : withTiming(0, { duration: SUBIR_MS, easing: Easing.out(Easing.cubic) });
    });
    return () => cancelAnimationFrame(quadro);
  }, [noCelular, alturaFolha, reduzirMovimento, escondido]);

  const estiloFolha = useAnimatedStyle(() => ({
    transform: [{ translateY: escondido.value * alturaFolha }],
  }));

  const sair = useCallback(() => {
    // Aberta por link direto (recarregar a página), não há para onde voltar.
    if (router.canGoBack()) router.back();
    else router.replace('/inicio');
  }, []);

  /**
   * Descer antes de sair, para ida e volta serem o mesmo movimento. No
   * desktop, com "reduzir movimento" ligado, ou antes de a medida chegar,
   * sai direto — animar do nada é pior que não animar.
   */
  const fechar = useCallback(() => {
    if (!noCelular || reduzirMovimento || alturaFolha === 0) {
      sair();
      return;
    }
    escondido.value = withTiming(
      1,
      { duration: DESCER_MS, easing: Easing.in(Easing.cubic) },
      (terminou) => {
        // A animação roda na thread de UI; voltar para o JS é explícito.
        if (terminou) runOnJS(sair)();
      },
    );
  }, [noCelular, reduzirMovimento, alturaFolha, escondido, sair]);

  const conteudo = <View className="flex-1 bg-bg">{/* … a tela … */}</View>;

  // No desktop a tela entra no shell, na coluna do meio: sem folha.
  if (!noCelular) return conteudo;

  return (
    <View
      className="flex-1 justify-end"
      onLayout={(e) => setAlturaDisponivel(e.nativeEvent.layout.height)}
    >
      {/* Só monta depois de medir — ver armadilha 1. */}
      {alturaFolha > 0 ? (
        <AnimatedView style={[{ height: alturaFolha, opacity: visivel ? 1 : 0 }, estiloFolha]}>
          {conteudo}
        </AnimatedView>
      ) : null}
    </View>
  );
}

/**
 * Duas coisas que acompanham a folha e não são animação:
 *
 * 1 · A ROTA NÃO PODE ANIMAR TAMBÉM
 *
 *     A folha sobe sozinha, então a rota é declarada sem a animação do
 *     navegador — senão são duas subidas empilhadas, e o fundo opaco tapa o
 *     que está atrás durante o movimento:
 *
 *       <Stack.Screen
 *         name="nova-review"
 *         options={{
 *           presentation: 'transparentModal',
 *           animation: 'none',
 *           contentStyle: { backgroundColor: 'transparent' },
 *         }}
 *       />
 *
 * 2 · CAMPO DE TEXTO ABAIXO DE 16px FAZ O IPHONE DAR ZOOM
 *
 *     O Safari amplia a página ao focar um campo com fonte menor que 16px, e
 *     o zoom desenquadra a folha inteira. Não é ajuste de estilo: é o motivo
 *     de todo campo de texto do app ser 16px.
 */
