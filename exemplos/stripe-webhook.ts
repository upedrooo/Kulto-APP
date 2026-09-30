// Edge Function `stripe-webhook`: concede o selo de fundador quando o Stripe
// avisa que um pagamento foi concluído.
//
// **Esta função roda sem JWT** (`verify_jwt = false`), porque quem chama é o
// Stripe, não alguém logado no app. Então o endereço dela é público, e a única
// coisa que separa um aviso de verdade de um forjado é a **assinatura**: o
// Stripe assina o corpo com o segredo do webhook, e nada acontece aqui antes
// de essa assinatura conferir. Sem essa checagem, qualquer um distribuiria
// selos com um `curl`.
//
// O fluxo inteiro:
//   1. A pessoa toca em "Quero ser fundador" e vai pro Payment Link levando o
//      próprio id em `client_reference_id`.
//   2. Pagou, o Stripe manda `checkout.session.completed` pra cá.
//   3. Conferida a assinatura, o id volta do evento, a doação é registrada em
//      `founders` e o perfil vira `fundador`.
//
// O id vem do evento assinado pelo Stripe, nunca do corpo cru — é o que
// impede alguém de pedir o selo pra outra conta.
import Stripe from 'npm:stripe@18';
import { createClient } from 'npm:@supabase/supabase-js@2';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Chave de API de propósito inexistente: esta função **nunca chama a API do
// Stripe**. Tudo que ela usa do SDK é `webhooks.constructEventAsync`, que só
// precisa do segredo da assinatura e do corpo da requisição. Guardar aqui uma
// chave com acesso ao dinheiro seria exposição sem contrapartida — se todo o
// resto vazasse, ainda assim não daria pra movimentar nada pelo Stripe.
const stripe = new Stripe('sk_nao_usada', { apiVersion: '2025-08-27.basil' });
// No Deno a verificação precisa do provedor assíncrono de cripto; a versão
// síncrona do SDK só existe no Node.
const cripto = Stripe.createSubtleCryptoProvider();

/** UUID v4, que é o formato do id de usuário do Supabase. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Método não permitido.', { status: 405 });
  }

  // Segredo faltando tem resposta própria, e não "assinatura inválida".
  //
  // Existe porque isto já custou uma investigação: o segredo tinha sido
  // gravado como `STRIPE_WEBHOOK_SECRETS`, no plural, e a função respondia
  // exatamente o mesmo que responderia a um aviso forjado. O painel do Stripe
  // mostrava 400 sem pista do motivo. Agora o nome errado aparece no primeiro
  // lugar em que se olha.
  //
  // 500, e não 400: o problema é do servidor, não do que o Stripe mandou. Ele
  // reenvia sozinho depois, então corrigir o segredo basta — ninguém precisa
  // pagar de novo.
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET não configurado');
    return new Response('Segredo não configurado: STRIPE_WEBHOOK_SECRET.', { status: 500 });
  }

  const assinatura = req.headers.get('stripe-signature');
  if (!assinatura) {
    return new Response('Sem assinatura.', { status: 400 });
  }

  // O corpo tem que ser lido como texto e verificado byte a byte: qualquer
  // `JSON.parse` antes disso invalidaria a assinatura.
  const corpo = await req.text();

  let evento: Stripe.Event;
  try {
    evento = await stripe.webhooks.constructEventAsync(
      corpo,
      assinatura,
      STRIPE_WEBHOOK_SECRET,
      undefined,
      cripto,
    );
  } catch (erro) {
    console.error('[stripe-webhook] assinatura inválida', erro);
    return new Response('Assinatura inválida.', { status: 400 });
  }

  // Qualquer outro evento é respondido com 200 de propósito: devolver erro
  // faria o Stripe reenviar pra sempre algo que nunca vamos tratar.
  if (evento.type !== 'checkout.session.completed') {
    return new Response('Ignorado.', { status: 200 });
  }

  const sessao = evento.data.object as Stripe.Checkout.Session;
  if (sessao.payment_status !== 'paid') {
    return new Response('Pagamento não concluído.', { status: 200 });
  }

  const userId = sessao.client_reference_id;
  if (!userId || !UUID.test(userId)) {
    // Acontece se alguém abrir o Payment Link direto, fora do app. O dinheiro
    // entrou e não há a quem dar o selo: fica o registro pra conferência
    // manual, mas sem reenvio.
    console.warn('[stripe-webhook] pagamento sem client_reference_id válido', sessao.id);
    return new Response('Sem usuário identificado.', { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { error: erroFundador } = await supabase.from('founders').insert({
    user_id: userId,
    stripe_session_id: sessao.id,
    amount_cents: sessao.amount_total ?? 0,
    currency: sessao.currency ?? 'brl',
  });

  // 23505 = chave duplicada. É o caminho normal quando o Stripe reenvia o
  // mesmo evento; não é erro.
  if (erroFundador && erroFundador.code !== '23505') {
    console.error('[stripe-webhook] falha ao registrar fundador', erroFundador);
    return new Response('Erro ao registrar.', { status: 500 });
  }

  // `is('verified_tier', null)` de propósito: quem já tem selo exclusivo não
  // é rebaixado pra fundador ao apoiar.
  const { error: erroSelo } = await supabase
    .from('profiles')
    .update({ verified_tier: 'fundador' })
    .eq('id', userId)
    .is('verified_tier', null);

  if (erroSelo) {
    console.error('[stripe-webhook] falha ao conceder o selo', erroSelo);
    return new Response('Erro ao conceder o selo.', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
