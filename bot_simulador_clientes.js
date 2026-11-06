/**
 * Bot Simulador de Clientes Variados
 * Requisito: Cadastra novos clientes diferentes (2 a cada 2 minutos)
 * e realiza compras com comentários e quantidades na tabela de registros.
 */

const BASE_URL = 'http://localhost:3000';

const NOMES_BASE = [
  'Lucas Fernandes', 'Juliana Moreira', 'Rafael Albuquerque', 'Camila Duarte',
  'Bruno Guimarães', 'Larissa Azevedo', 'Diego Nascimento', 'Fernanda Silveira',
  'Thiago Mendonça', 'Patrícia Barros', 'Rodrigo Farias', 'Aline Cavalcanti',
  'Guilherme Antunes', 'Bianca Macedo', 'Leonardo Vasconcelos', 'Renata Fonseca'
];

const COMENTARIOS = [
  'Deixar na portaria com o zelador',
  'Entregar após as 18h no condomínio',
  'Presente de aniversário, embalar com cuidado',
  'Tocar interfone do bloco B apto 42',
  'Pedido urgente para trabalho remoto',
  'Favor ligar antes de efetuar a entrega',
  'Deixar com a recepção do prédio comercial',
  'Sem observações, entrega normal'
];

function gerarCpfValidoAleatorio() {
  const n = () => Math.floor(Math.random() * 9);
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function simularNovoClienteECompra(indice) {
  const timestamp = Date.now().toString().slice(-4) + Math.floor(Math.random() * 100);
  const nome = `${getRandom(NOMES_BASE)} ${timestamp}`;
  const cpf = gerarCpfValidoAleatorio();
  const email = `cliente_${timestamp}@gmail.com`;
  const telefone = `(11) 9${Math.floor(10000000 + Math.random() * 90000000)}`;
  const endereco = `Rua das Palmeiras, ${Math.floor(10 + Math.random() * 900)} - Bairro Novo, SP`;
  const cartao = `4532${Math.floor(100000000000 + Math.random() * 900000000000)}`;
  const senha = `ClienteForte@${timestamp}`;

  try {
    // 1. Cadastrar novo cliente (dados sensíveis são criptografados com AES no banco)
    const resReg = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        email,
        cpf,
        telefone,
        endereco_principal: endereco,
        cartao_credito: cartao,
        senha
      })
    });

    if (!resReg.ok) {
      console.log(`⚠️ [SIMULADOR #${indice}] Falha no cadastro de ${nome}`);
      return;
    }

    const regData = await resReg.json();
    console.log(`👤 [NOVO CLIENTE #${indice}] Cadastrado: "${nome}" (CPF criptografado no banco)`);

    // 2. Fazer Login e obter Token JWT
    const resLogin = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf, senha })
    });

    const loginData = await resLogin.json();
    const token = loginData.token;

    // 3. Consultar catálogo de produtos
    const resProd = await fetch(`${BASE_URL}/produtos`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const dataProd = await resProd.json();
    const produtos = dataProd.produtos || [];

    if (produtos.length === 0) {
      console.log(`⏳ [SIMULADOR #${indice}] Nenhum produto disponível para compra.`);
      return;
    }

    const produtoEscolhido = getRandom(produtos);
    const quantidade = Math.floor(1 + Math.random() * 3); // 1 a 3 unidades
    const comentario = getRandom(COMENTARIOS);

    // 4. Efetuar a Compra e registrar na Planilha
    const resCompra = await fetch(`${BASE_URL}/comprar/${produtoEscolhido.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Forwarded-For': `10.81.211.${Math.floor(10 + Math.random() * 200)}` // Simula IPs da rede
      },
      body: JSON.stringify({ quantidade, comentario })
    });

    if (resCompra.ok) {
      const dataCompra = await resCompra.json();
      console.log(
        `🛒 [TRANSAÇÃO #${indice}] ${nome} comprou "${produtoEscolhido.nome}" (${quantidade} un) | Pedido #${dataCompra.pedido.id} registrado na planilha!`
      );
    }
  } catch (err) {
    console.error(`❌ [SIMULADOR #${indice}] Erro:`, err.message);
  }
}

async function cicloSimulacao() {
  console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Iniciando ciclo: Cadastrando 2 novos clientes e movimentando a planilha...`);
  // Roda 2 clientes em sequência com intervalo de 3 segundos entre eles
  await simularNovoClienteECompra(1);
  setTimeout(async () => {
    await simularNovoClienteECompra(2);
  }, 3000);
}

// Inicia imediatamente ao rodar o script
console.log('🚀 Iniciando Bot Simulador de Clientes (2 clientes a cada 2 minutos)...');
cicloSimulacao();

// Repete a cada 2 minutos (120000 ms)
setInterval(cicloSimulacao, 120000);

