/**
 * Bot 2: COMPRADOR AUTOMÁTICO
 * Mantém o mesmo nome fixo ("Cliente VIP").
 * A cada ciclo (~1 minuto), busca os produtos da loja e efetua a compra de um item.
 */

const BASE_URL = 'http://localhost:3000';

const COMPRADOR = {
  nome: 'Cliente VIP',
  email: 'clientevip@email.com',
  cpf: '999.888.777-66',
  telefone: '(11) 97777-5555',
  endereco: 'Av. Paulista, 1500 - Apto 82, São Paulo - SP',
  cartao: '4532999988887777',
  senha: 'SenhaComprador@123'
};

let tokenComprador = null;

async function obterTokenComprador() {
  let res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf: COMPRADOR.cpf, senha: COMPRADOR.senha })
  });

  if (res.ok) {
    const data = await res.json();
    return data.token;
  }

  // Se não existir, cadastra a conta fixa
  await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: COMPRADOR.nome,
      email: COMPRADOR.email,
      cpf: COMPRADOR.cpf,
      telefone: COMPRADOR.telefone,
      endereco_principal: COMPRADOR.endereco,
      cartao_credito: COMPRADOR.cartao,
      senha: COMPRADOR.senha
    })
  });

  res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf: COMPRADOR.cpf, senha: COMPRADOR.senha })
  });
  const data = await res.json();
  return data.token;
}

async function cicloComprar() {
  try {
    if (!tokenComprador) {
      tokenComprador = await obterTokenComprador();
    }

    // 1. Listar produtos disponíveis na loja
    const resProd = await fetch(`${BASE_URL}/produtos`, {
      headers: { Authorization: `Bearer ${tokenComprador}` }
    });

    if (!resProd.ok) {
      console.log('⚠️ [COMPRADOR] Falha ao consultar vitrine.');
      return;
    }

    const dataProd = await resProd.json();
    const produtos = dataProd.produtos || [];

    if (produtos.length === 0) {
      console.log('⏳ [COMPRADOR] Nenhum produto disponível na loja para compra no momento.');
      return;
    }

    // Escolhe um produto aleatório da vitrine para comprar
    const produtoEscolhido = produtos[Math.floor(Math.random() * produtos.length)];

    // 2. Efetuar a compra
    const resCompra = await fetch(`${BASE_URL}/comprar/${produtoEscolhido.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenComprador}` }
    });

    if (resCompra.ok) {
      const dataCompra = await resCompra.json();
      console.log(
        `💳 [COMPRADOR - ${COMPRADOR.nome}] Comprou: "${produtoEscolhido.nome}" | Pedido #${dataCompra.pedido.id} gerado com status "${dataCompra.pedido.status_entrega}"`
      );
    } else {
      const err = await resCompra.json();
      console.log(`⚠️ [COMPRADOR] Falha na compra: ${err.erro}`);
    }
  } catch (err) {
    console.error('❌ [COMPRADOR] Erro de conexão:', err.message);
  }
}

// Inicia imediatamente e repete a cada 60s
console.log(`🚀 Iniciando Bot Comprador fixo: "${COMPRADOR.nome}"`);
cicloComprar();
setInterval(cicloComprar, 60000);

