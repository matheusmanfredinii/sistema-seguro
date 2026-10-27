/**
 * Script de Simulação de Tráfego Contínuo (Requisito da Lousa)
 * Roda aproximadamente a cada 1 minuto:
 * 1. Cadastra um novo usuário simulado
 * 2. Faz login e obtém o token JWT
 * 3. Anuncia um produto
 * 4. Realiza uma compra/transação com status de entrega
 */

const BASE_URL = 'http://localhost:3000';

const NOMES = ['Carlos Souza', 'Mariana Lima', 'Felipe Santos', 'Beatriz Costa', 'Lucas Pereira', 'Juliana Rocha'];
const PRODUTOS = [
  { nome: 'Teclado Mecânico RGB', preco: 289.90, desc: 'Switches azuis, padrão ABNT2' },
  { nome: 'Mouse Gamer 16000 DPI', preco: 199.50, desc: 'Sensor óptico de alta precisão' },
  { nome: 'Headset 7.1 Surround', preco: 349.00, desc: 'Microfone com cancelamento de ruído' },
  { nome: 'SSD NVMe 1TB', preco: 450.00, desc: 'Leitura até 3500MB/s' }
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gerarNumeroAleatorio(tamanho) {
  let res = '';
  for (let i = 0; i < tamanho; i++) res += Math.floor(Math.random() * 10);
  return res;
}

async function cicloTransacao() {
  const timestamp = Date.now().toString().slice(-4);
  const nome = `${getRandomItem(NOMES)} ${timestamp}`;
  const cpf = `${gerarNumeroAleatorio(3)}.${gerarNumeroAleatorio(3)}.${gerarNumeroAleatorio(3)}-${gerarNumeroAleatorio(2)}`;
  const email = `user_${timestamp}@loja.com`;
  const cartao = `4532${gerarNumeroAleatorio(12)}`;
  const senha = `SenhaForte@${timestamp}`;

  console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Iniciando ciclo automático de transação...`);

  try {
    // 1. Cadastrar Usuário
    const resReg = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        email,
        cpf,
        telefone: '(11) 9' + gerarNumeroAleatorio(8),
        endereco_principal: `Rua das Acácias, ${gerarNumeroAleatorio(3)} - Bloco B`,
        cartao_credito: cartao,
        senha
      })
    });

    if (!resReg.ok) {
      console.log('⚠️ Falha no registro de usuário simulado.');
      return;
    }
    console.log(`✅ 1. Usuário registrado: ${nome} (CPF e Cartão criptografados via AES)`);

    // 2. Login
    const resLogin = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf, senha })
    });
    const dataLogin = await resLogin.json();
    const token = dataLogin.token;
    console.log(`🔑 2. Login autenticado via JWT.`);

    // 3. Cadastrar Produto
    const prodModelo = getRandomItem(PRODUTOS);
    const resProd = await fetch(`${BASE_URL}/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        nome: `${prodModelo.nome} #${timestamp}`,
        preco: prodModelo.preco,
        descricao: prodModelo.desc,
        imagemUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'
      })
    });
    const dataProd = await resProd.json();
    const produtoId = dataProd.produto.id;
    console.log(`📦 3. Produto anunciado: ID ${produtoId} - ${prodModelo.nome}`);

    // 4. Realizar Transação / Compra
    const resCompra = await fetch(`${BASE_URL}/comprar/${produtoId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const dataCompra = await resCompra.json();
    console.log(`💳 4. Transação concluída! Pedido #${dataCompra.pedido.id} gerado com status "${dataCompra.pedido.status_entrega}".`);

  } catch (err) {
    console.error('❌ Erro no ciclo de transação:', err.message);
  }
}

// Executa a primeira vez imediatamente
cicloTransacao();

// Repete a cada 60 segundos (+/- a cada minuto como pedido pelo professor)
setInterval(cicloTransacao, 60000);

