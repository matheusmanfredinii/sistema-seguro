/**
 * Bot de Movimentação Automatizada (Requisitos do Professor)
 * 
 * 1. Cadastra 2 novos usuários diferentes a cada 10 minutos (dados sensíveis com AES-256 no MySQL).
 * 2. Anuncia 1 produto novo e diferente a cada 20 minutos (catálogo rotativo sem repetições).
 * 3. Efetua 1 compra a cada 20 minutos (cartão descriptografado em memória, gerando pedido na planilha com IP).
 * 
 * Executa uma rodada inicial imediatamente para testes e depois entra nos intervalos programados.
 */

const BASE_URL = 'http://localhost:3000';

// Catálogo com 25 produtos com nomes simples e realistas de e-commerce
const CATALOGO_PRODUTOS = [
  {
    nome: 'Notebook Dell 15"',
    preco: 3499.00,
    desc: 'Processador Intel Core i5, 16GB de memória RAM, SSD de 512GB e tela Full HD.',
    img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800'
  },
  {
    nome: 'Smartphone Galaxy S23',
    preco: 4299.00,
    desc: 'Armazenamento de 256GB, tela AMOLED de 120Hz e câmera tripla de alta resolução.',
    img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800'
  },
  {
    nome: 'Monitor Gamer 27"',
    preco: 1290.00,
    desc: 'Tela curva de 27 polegadas, taxa de 165Hz e tempo de resposta de 1ms.',
    img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'
  },
  {
    nome: 'Cadeira de Escritório Ergonômica',
    preco: 799.00,
    desc: 'Encosto em tela mesh respirável, ajuste de altura e apoio lombar.',
    img: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800'
  },
  {
    nome: 'Fone de Ouvido Bluetooth',
    preco: 590.00,
    desc: 'Cancelamento de ruído, bateria com até 30 horas de duração e conexão sem fio.',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
  },
  {
    nome: 'Teclado Mecânico Compacto',
    preco: 280.00,
    desc: 'Teclas mecânicas macias, iluminação LED branca e padrão ABNT2.',
    img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800'
  },
  {
    nome: 'Mouse Sem Fio Ergonômico',
    preco: 190.00,
    desc: 'Sensor óptico de alta precisão, cliques silenciosos e bateria recarregável.',
    img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800'
  },
  {
    nome: 'Console PlayStation 5',
    preco: 3699.00,
    desc: 'Edição com leitor de disco, SSD ultrarrápido de 1TB e controle sem fio.',
    img: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800'
  },
  {
    nome: 'Placa de Vídeo RTX 4070',
    preco: 4190.00,
    desc: '12GB de memória GDDR6X, suporte a Ray Tracing e resfriamento eficiente.',
    img: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800'
  },
  {
    nome: 'Tablet iPad 10"',
    preco: 3899.00,
    desc: 'Tela Liquid Retina de 10.9 polegadas, 64GB de memória e suporte a caneta.',
    img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800'
  },
  {
    nome: 'Relógio Smartwatch',
    preco: 450.00,
    desc: 'Monitor de passos e batimentos cardíacos, notificações no pulso e bateria de 7 dias.',
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
  },
  {
    nome: 'Caixa de Som Portátil',
    preco: 320.00,
    desc: 'Conexão Bluetooth, resistente a respingos dágua e som estéreo nítido.',
    img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800'
  },
  {
    nome: 'Câmera Fotográfica Digital',
    preco: 2890.00,
    desc: 'Sensor de 24MP, gravação de vídeo em Full HD e lente intercambiável inclusa.',
    img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'
  },
  {
    nome: 'Microfone de Mesa USB',
    preco: 240.00,
    desc: 'Ideal para chamadas, aulas e podcasts, com botão de mudo rápido e pedestal.',
    img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800'
  },
  {
    nome: 'Mesa Digitalizadora',
    preco: 350.00,
    desc: 'Área de desenho de 10 polegadas com caneta de precisão sem bateria.',
    img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800'
  },
  {
    nome: 'Drone Portátil com Câmera',
    preco: 2450.00,
    desc: 'Câmera HD integrada, retorno automático e autonomia de voo de 25 minutos.',
    img: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800'
  },
  {
    nome: 'Processador Ryzen 7',
    preco: 1890.00,
    desc: '8 núcleos e 16 threads, compatível com memórias DDR5 e soquete AM5.',
    img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800'
  },
  {
    nome: 'Óculos de Realidade Virtual',
    preco: 2690.00,
    desc: 'Sistema autônomo sem necessidade de fios ou computadores, áudio espacial.',
    img: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=800'
  },
  {
    nome: 'Soundbar para TV',
    preco: 650.00,
    desc: 'Som potente para sala, subwoofer sem fio e conexão óptica e Bluetooth.',
    img: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800'
  },
  {
    nome: 'Carregador Portátil Power Bank',
    preco: 140.00,
    desc: 'Capacidade de 20.000mAh, saídas USB duplas e carregamento veloz para celular.',
    img: 'https://images.unsplash.com/photo-1609592426508-3011a0b3b426?w=800'
  },
  {
    nome: 'Smart TV 50" 4K',
    preco: 2399.00,
    desc: 'Resolução 4K HDR, sistema inteligente com aplicativos de streaming integrados.',
    img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800'
  },
  {
    nome: 'SSD Portátil 1TB',
    preco: 499.00,
    desc: 'Conexão USB 3.2 rápida, corpo de alumínio compacto e resistente a impactos.',
    img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800'
  },
  {
    nome: 'Webcam Full HD 1080p',
    preco: 180.00,
    desc: 'Sensor de alta nitidez para videochamadas, com microfone duplo integrado.',
    img: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800'
  },
  {
    nome: 'Roteador Wi-Fi 6 Gigabit',
    preco: 290.00,
    desc: 'Quatro antenas externas de alto alcance e velocidade de até 1800Mbps.',
    img: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800'
  },
  {
    nome: 'Hub USB-C 6 em 1',
    preco: 130.00,
    desc: 'Entradas HDMI 4K, portas USB 3.0 rápidas e leitor de cartões de memória.',
    img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800'
  }
];

const NOMES_CLIENTES = [
  'Arthur Guimarães', 'Beatriz Nogueira', 'Caio Albuquerque', 'Débora Vasconcelos',
  'Eduardo Peixoto', 'Fernanda Castilho', 'Gustavo Linhares', 'Helena Valente',
  'Igor Medeiros', 'Juliana Rezende', 'Lucas Alencar', 'Mariana Prado',
  'Nicolas Fontes', 'Otávio Cerqueira', 'Priscila Aguiar', 'Renan Teles',
  'Sabrina Chaves', 'Tiago Bittencourt', 'Vanessa Barreto', 'Wagner Drummond'
];

const COMENTARIOS_COMPRA = [
  'Deixar na portaria com o zelador',
  'Entrega em horário comercial',
  'Cuidado ao manusear, produto frágil',
  'Tocar o interfone número 304',
  'Avisar pelo WhatsApp antes de sair para rota',
  'Presente surpresa, não incluir preço na nota de remessa',
  'Deixar com a recepcionista do prédio comercial',
  'Entrega normal sem observações adicionais'
];

let indiceProduto = 0;
let indiceCliente = 0;
let tokenVendedorGeral = null;

// Gera CPF com formato válido
function gerarCpfAleatorio() {
  const d = () => Math.floor(Math.random() * 9);
  return `${d()}${d()}${d()}.${d()}${d()}${d()}.${d()}${d()}${d()}-${d()}${d()}`;
}

// Retorna item aleatório de array
function aleatorio(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Login ou cadastro da conta vendedor
async function obterTokenVendedor() {
  if (tokenVendedorGeral) return tokenVendedorGeral;

  const creds = { cpf: '000.111.222-33', senha: 'SenhaVendedor@2026' };

  let res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds)
  });

  if (res.ok) {
    const data = await res.json();
    tokenVendedorGeral = data.token;
    return tokenVendedorGeral;
  }

  // Se não existir, cadastra a conta
  await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'Loja Oficial Matriz',
      email: 'matriz@lojaoficial.com',
      cpf: creds.cpf,
      telefone: '(11) 98888-0000',
      endereco_principal: 'Centro Logístico Principal, 1000 - SP',
      cartao_credito: '4532000011112222',
      senha: creds.senha
    })
  });

  res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds)
  });
  const data = await res.json();
  tokenVendedorGeral = data.token;
  return tokenVendedorGeral;
}

/**
 * ROTINA 1: Cadastra 2 Usuários Diferentes (A cada 10 minutos)
 */
async function rotinaCadastrarDoisUsuarios() {
  console.log(`\n👥 [ROTINA USUÁRIOS - 10 MIN] [${new Date().toLocaleTimeString()}] Iniciando cadastro de 2 novos usuários...`);

  for (let i = 1; i <= 2; i++) {
    const baseNome = NOMES_CLIENTES[indiceCliente % NOMES_CLIENTES.length];
    indiceCliente++;
    const idUnico = Date.now().toString().slice(-4) + Math.floor(Math.random() * 90);
    const nome = `${baseNome} ${idUnico}`;
    const cpf = gerarCpfAleatorio();
    const email = `usuario_${idUnico}@provedor.com`;
    const telefone = `(11) 9${Math.floor(10000000 + Math.random() * 90000000)}`;
    const endereco = `Av. Brasil, ${Math.floor(50 + Math.random() * 900)} - Sala ${Math.floor(1 + Math.random() * 50)}`;
    const cartao = `4532${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const senha = `SenhaSegura@${idUnico}`;

    try {
      const res = await fetch(`${BASE_URL}/register`, {
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

      if (res.ok) {
        console.log(`  ✅ [Usuário ${i}/2 Cadastrado]: "${nome}" | CPF: ${cpf.slice(0, 3)}.***.***-${cpf.slice(-2)} (AES-256 no banco)`);
      } else {
        const err = await res.json();
        console.log(`  ⚠️ Falha ao cadastrar usuário ${i}: ${err.erro}`);
      }
    } catch (e) {
      console.error(`  ❌ Erro ao registrar usuário ${i}:`, e.message);
    }
  }
}

/**
 * ROTINA 2: Anuncia 1 Venda Diferente (A cada 20 minutos)
 */
async function rotinaAnunciarVendaDiferente() {
  console.log(`\n📢 [ROTINA VENDA - 20 MIN] [${new Date().toLocaleTimeString()}] Publicando 1 novo anúncio de produto diferente...`);

  try {
    const token = await obterTokenVendedor();
    const produto = CATALOGO_PRODUTOS[indiceProduto % CATALOGO_PRODUTOS.length];
    indiceProduto++;

    // Adiciona uma leve variação nos centavos para refletir precificação dinâmica
    const variacao = (Math.random() * 10 - 5).toFixed(2);
    const precoFinal = parseFloat((produto.preco + parseFloat(variacao)).toFixed(2));

    const res = await fetch(`${BASE_URL}/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        nome: produto.nome,
        preco: precoFinal,
        descricao: produto.desc,
        imagemUrl: produto.img
      })
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`  🏷️ [Nova Venda Publicada]: "${data.produto.nome}" por R$ ${data.produto.preco.toFixed(2)} (Item #${indiceProduto} do catálogo rotativo)`);
    } else {
      const err = await res.json();
      console.log(`  ⚠️ Falha ao publicar anúncio: ${err.erro}`);
    }
  } catch (e) {
    console.error('  ❌ Erro ao publicar anúncio de venda:', e.message);
  }
}

/**
 * ROTINA 3: Efetua 1 Compra (A cada 20 minutos)
 */
async function rotinaEfetuarCompra() {
  console.log(`\n🛒 [ROTINA COMPRA - 20 MIN] [${new Date().toLocaleTimeString()}] Realizando 1 nova compra...`);

  try {
    // 1. Cadastra/loga um comprador temporário para a transação
    const idSufixo = Date.now().toString().slice(-4);
    const nomeComprador = `Comprador #${idSufixo}`;
    const cpfComprador = gerarCpfAleatorio();
    const senhaComprador = `Compra@${idSufixo}`;

    await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: nomeComprador,
        cpf: cpfComprador,
        telefone: '(11) 99123-4567',
        endereco_principal: `Rua Comercial, ${Math.floor(100 + Math.random() * 800)} - Centro`,
        cartao_credito: '4532111122228888',
        senha: senhaComprador
      })
    });

    const resLogin = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: cpfComprador, senha: senhaComprador })
    });

    if (!resLogin.ok) return;
    const { token } = await resLogin.json();

    // 2. Busca os produtos disponíveis na loja
    const resProd = await fetch(`${BASE_URL}/produtos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { produtos } = await resProd.json();

    if (!produtos || produtos.length === 0) {
      console.log('  ⏳ Sem produtos disponíveis para compra no momento.');
      return;
    }

    // Escolhe um produto para comprar
    const produtoEscolhido = aleatorio(produtos);
    const quantidade = Math.floor(1 + Math.random() * 2); // 1 ou 2 unidades
    const comentario = aleatorio(COMENTARIOS_COMPRA);
    const ipSimulado = `10.81.211.${Math.floor(10 + Math.random() * 200)}`;

    // 3. Efetua a compra
    const resCompra = await fetch(`${BASE_URL}/comprar/${produtoEscolhido.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Forwarded-For': ipSimulado
      },
      body: JSON.stringify({ quantidade, comentario })
    });

    if (resCompra.ok) {
      const { pedido, cobranca_simulada } = await resCompra.json();
      console.log(`  💳 [Compra Aprovada]: Pedido #${pedido.id} | "${produtoEscolhido.nome}" (${quantidade} un) | IP: ${ipSimulado} | Cartão final: ${cobranca_simulada.cartao_final}`);
    } else {
      const err = await resCompra.json();
      console.log(`  ⚠️ Falha ao efetuar compra: ${err.erro}`);
    }
  } catch (e) {
    console.error('  ❌ Erro ao efetuar compra:', e.message);
  }
}

// ============================================================================
// INICIALIZAÇÃO E AGENDAMENTO
// ============================================================================

console.log('================================================================');
console.log('🚀 BOT DE MOVIMENTAÇÃO AUTOMÁTICA INICIADO COM SUCESSO');
console.log('⏱️  Intervalos:');
console.log('   • 2 novos usuários a cada 10 minutos');
console.log('   • 1 venda diferente a cada 20 minutos (catálogo rotativo sem repetições)');
console.log('   • 1 compra com registro de auditoria a cada 20 minutos');
console.log('================================================================');

// Executa 1 rodada inicial agora para demonstrar imediatamente ao professor
(async () => {
  await rotinaAnunciarVendaDiferente();
  await rotinaCadastrarDoisUsuarios();
  await rotinaEfetuarCompra();
})();

// Configura os intervalos exatos solicitados
const DEZ_MINUTOS = 10 * 60 * 1000;
const VINTE_MINUTOS = 20 * 60 * 1000;

setInterval(rotinaCadastrarDoisUsuarios, DEZ_MINUTOS);
setInterval(rotinaAnunciarVendaDiferente, VINTE_MINUTOS);
setInterval(rotinaEfetuarCompra, VINTE_MINUTOS);
