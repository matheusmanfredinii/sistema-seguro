/**
 * Bot 1: VENDEDOR OFICIAL
 * Nome fixo: "Loja Oficial"
 * Variedade dinâmica: Alterna entre dezenas de produtos diferentes com nomes,
 * preços, descrições detalhadas e fotos reais do Unsplash.
 */

const BASE_URL = 'http://localhost:3000';

const VENDEDOR = {
  nome: 'Loja Oficial',
  email: 'lojaoficial@loja.com',
  cpf: '111.222.333-44',
  telefone: '(11) 98888-7777',
  endereco: 'Centro de Distribuição Nacional, 1500 - SP',
  cartao: '4532111122223333',
  senha: 'SenhaVendedor@123'
};

// Catálogo com 15 produtos diversificados (sem repetições monótonas)
const CATALOGO = [
  {
    nome: 'Notebook Dell Inspiron 15',
    preco: 3899.00,
    desc: 'Intel Core i5 12ª Geração, 16GB RAM, SSD 512GB, Tela 15.6 Full HD antirreflexo.',
    img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800'
  },
  {
    nome: 'Smartphone Galaxy S23 Ultra',
    preco: 4799.00,
    desc: 'Câmera de 200MP, 256GB armazenamento, tela Dynamic AMOLED 2X e Caneta S Pen inclusa.',
    img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800'
  },
  {
    nome: 'Monitor Gamer Curvo 27"',
    preco: 1450.00,
    desc: 'Taxa de atualização de 165Hz, tempo de resposta 1ms, resolução Quad HD com FreeSync.',
    img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'
  },
  {
    nome: 'Cadeira Gamer Ergonômica',
    preco: 899.90,
    desc: 'Apoio lombar ajustável, reclinação de até 180 graus e estofamento em couro sintético premium.',
    img: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800'
  },
  {
    nome: 'Fone Bluetooth Sony WH-1000XM4',
    preco: 1690.00,
    desc: 'Cancelamento de ruído ativo líder do setor, bateria com autonomia de 30 horas e áudio Hi-Res.',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
  },
  {
    nome: 'Teclado Mecânico Custom Hot-Swap',
    preco: 420.00,
    desc: 'Switches Gateron Yellow lubrificados de fábrica, keycaps PBT doubleshot e conexão wireless.',
    img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800'
  },
  {
    nome: 'Mouse Sem Fio Logitech MX Master 3S',
    preco: 580.00,
    desc: 'Sensor óptico de 8000 DPI com precisão em vidro, cliques silenciosos e roda de rolagem MagSpeed.',
    img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800'
  },
  {
    nome: 'Console PlayStation 5 Slim',
    preco: 3699.00,
    desc: 'Edição com leitor de disco, SSD ultrarrápido de 1TB e controle DualSense com feedback tátil.',
    img: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800'
  },
  {
    nome: 'Placa de Vídeo RTX 4070 12GB',
    preco: 4290.00,
    desc: 'Arquitetura Ada Lovelace, suporte a DLSS 3 e Ray Tracing com resfriamento triplo fan.',
    img: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800'
  },
  {
    nome: 'Apple iPad Air M2 128GB',
    preco: 5399.00,
    desc: 'Tela Liquid Retina de 11 polegadas, chip M2 com alto desempenho e compatibilidade Apple Pencil.',
    img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800'
  },
  {
    nome: 'Smartwatch Esportivo GPS',
    preco: 699.00,
    desc: 'Monitor cardíaco contínuo, oxímetro de pulso, resistência à água 5ATM e 14 dias de bateria.',
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
  },
  {
    nome: 'Caixa de Som Portátil JBL Flip 6',
    preco: 599.90,
    desc: 'Potência de 30W RMS, proteção à prova dágua IP67 e emparelhamento PartyBoost.',
    img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800'
  },
  {
    nome: 'Camera Mirrorless 4K Sony Alpha',
    preco: 6200.00,
    desc: 'Sensor CMOS Exmor de 24.2 MP, foco automático híbrido em tempo real e gravação 4K HDR.',
    img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'
  },
  {
    nome: 'Microfone Condensador USB Podcasting',
    preco: 379.00,
    desc: 'Padrão polar cardioide, botão de mute com toque rápido e suporte articulado incluso.',
    img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800'
  },
  {
    nome: 'Mesa Digitalizadora Profissional',
    preco: 499.00,
    desc: '8192 níveis de sensibilidade à pressão, caneta sem bateria e 8 teclas de atalho personalizáveis.',
    img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800'
  }
];

let indiceAtual = 0;
let tokenVendedor = null;

async function obterTokenVendedor() {
  let res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf: VENDEDOR.cpf, senha: VENDEDOR.senha })
  });

  if (res.ok) {
    const data = await res.json();
    return data.token;
  }

  // Cadastra se não existir
  await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: VENDEDOR.nome,
      email: VENDEDOR.email,
      cpf: VENDEDOR.cpf,
      telefone: VENDEDOR.telefone,
      endereco_principal: VENDEDOR.endereco,
      cartao_credito: VENDEDOR.cartao,
      senha: VENDEDOR.senha
    })
  });

  res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf: VENDEDOR.cpf, senha: VENDEDOR.senha })
  });
  const data = await res.json();
  return data.token;
}

async function cicloAnunciar() {
  try {
    if (!tokenVendedor) {
      tokenVendedor = await obterTokenVendedor();
    }

    // Pega o próximo produto do catálogo rotativo (garantindo variedade)
    const prod = CATALOGO[indiceAtual % CATALOGO.length];
    indiceAtual++;

    // Gera uma pequena variação de lote e preço realista para parecer um e-commerce vivo
    const variacaoCentavos = (Math.random() * 20 - 10).toFixed(2);
    const precoFinal = parseFloat((prod.preco + parseFloat(variacaoCentavos)).toFixed(2));

    const res = await fetch(`${BASE_URL}/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenVendedor}`
      },
      body: JSON.stringify({
        nome: prod.nome,
        preco: precoFinal,
        descricao: prod.desc,
        imagemUrl: prod.img
      })
    });

    if (res.ok) {
      const data = await res.json();
      console.log(
        `🛒 [VENDEDOR - ${VENDEDOR.nome}] Anunciado item ${indiceAtual}/${CATALOGO.length}: "${data.produto.nome}" (R$ ${data.produto.preco})`
      );
    } else {
      console.log('⚠️ [VENDEDOR] Falha ao anunciar produto.');
    }
  } catch (err) {
    console.error('❌ [VENDEDOR] Erro de conexão:', err.message);
  }
}

console.log(`🚀 Iniciando Bot Vendedor Oficial com catálogo rotativo de ${CATALOGO.length} produtos...`);
cicloAnunciar();
setInterval(cicloAnunciar, 60000);
