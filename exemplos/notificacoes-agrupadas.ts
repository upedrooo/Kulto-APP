/**
 * Kulto · notificações em tempo real, e a lógica que fica fora do hook
 *
 * Dois arquivos do projeto, juntos aqui para mostrar uma separação que se
 * paga: o hook cuida de buscar e de escutar; a regra de agrupamento é uma
 * função pura, que não sabe o que é React nem o que é Supabase — e por isso
 * pôde ser testada com doze casos em segundos, sem montar componente nenhum.
 */

// ---------------------------------------------------------------------------
// PARTE 1 · o hook: consulta + Realtime
// ---------------------------------------------------------------------------

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<NotificationItem[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select(SELECT)
        .eq('recipient_id', userId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map(paraViewModel);
    },
  });

  // Postgres changes: o banco avisa, o cache invalida, a tela redesenha.
  // Não há polling e não há "puxe para atualizar" obrigatório.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      // Nome único por instância: dois componentes montados ao mesmo tempo
      // com o mesmo nome de canal derrubam um ao outro, em silêncio.
      .channel(`notifications-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          // O filtro é do servidor: o cliente não recebe evento de linha que
          // não é dele, então não há o que filtrar depois nem o que vazar.
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications', userId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

// ---------------------------------------------------------------------------
// PARTE 2 · a regra, pura
// ---------------------------------------------------------------------------

/**
 * Junta as curtidas da mesma review numa linha só: três pessoas curtindo
 * viram três fotos lado a lado e "Fulano e outras 2 pessoas".
 *
 * **Só curtidas agrupam, e só por review.** Seguir, conquista e promoção são
 * eventos avulsos — juntar "Fulano e outras 2 começaram a te seguir"
 * esconderia de quem, que é a única informação que interessa ali. Curtida é o
 * contrário: o que importa é a review, e quem curtiu é o detalhe.
 *
 * Curtida sem `review_id` não agrupa com ninguém: sem a review não dá para
 * saber se é a mesma, e chutar juntaria coisas sem relação.
 *
 * A ordem de entrada é preservada — a lista já vem da mais recente para a
 * mais antiga, e o grupo assume a posição da primeira que apareceu.
 */
export function agruparNotificacoes(itens: NotificationItem[]): NotificationGroup[] {
  const grupos: NotificationGroup[] = [];
  const porReview = new Map<string, NotificationGroup>();

  for (const item of itens) {
    const reviewId = item.type === 'like' ? (item.data.review_id as string | undefined) : undefined;
    const existente = reviewId ? porReview.get(reviewId) : undefined;

    if (existente) {
      existente.total += 1;
      existente.ids.push(item.id);
      // Uma não lida basta para manter o grupo inteiro aceso.
      if (!item.readAt) existente.readAt = null;
      // A mesma pessoa curtindo de novo não vira duas fotos.
      const repetido = item.actor
        ? existente.actors.some((a) => a.username === item.actor!.username)
        : true;
      if (item.actor && !repetido) existente.actors.push(item.actor);
      continue;
    }

    const grupo: NotificationGroup = {
      id: item.id,
      type: item.type,
      actors: item.actor ? [item.actor] : [],
      total: 1,
      createdAt: item.createdAt,
      readAt: item.readAt,
      data: item.data,
      work: item.work,
      ids: [item.id],
    };
    grupos.push(grupo);
    if (reviewId) porReview.set(reviewId, grupo);
  }

  return grupos;
}

// ---------------------------------------------------------------------------
// PARTE 3 · por que a separação se paga
// ---------------------------------------------------------------------------
//
// A função acima não importa React, não importa o Supabase e não toca em
// nenhum estado. Testá-la é montar um array e comparar o resultado:
//
//   agruparNotificacoes([
//     n('1', 'like', p('ana'),  { data: { review_id: 'rev1' } }),
//     n('2', 'like', p('bia'),  { data: { review_id: 'rev1' } }),
//     n('3', 'like', p('caio'), { data: { review_id: 'rev1' } }),
//   ])
//   → 1 grupo · total 3 · fotos [ana, bia, caio] · id da mais recente
//
// Os doze casos cobertos: agrupa por review, não mistura reviews diferentes,
// não repete quem curtiu duas vezes, mantém o grupo aceso quando uma não foi
// lida, não agrupa follow, não agrupa curtida sem review_id, e preserva a
// ordem da lista quando uma curtida tardia entra num grupo já posicionado.
//
// Se essa regra estivesse dentro do componente, cada um desses casos exigiria
// renderizar a tela, simular o Supabase e procurar texto no DOM — e por isso,
// na prática, nenhum deles seria testado.
