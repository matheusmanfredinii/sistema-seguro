const FALLBACK_IMG = 'https://placehold.co/600x400/e5e7eb/6b7280?text=Produto';

let tokenJWT = localStorage.getItem('loja_jwt') || null;
let usuarioAtual = JSON.parse(localStorage.getItem('loja_user') || 'null');
let listaPedidosCache = [];
let listaUsuariosCache = [];
let listaProdutosCache = [];
let filtroPedidoAtual = 'todos';

const authSection = document.getElementById('auth-section');
const storeSection = document.getElementById('store-section');
const userPanel = document.getElementById('user-panel');
const userGreeting = document.getElementById('user-greeting');
const toastEl = document.getElementById('toast');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const inputProdImagem = document.getElementById('prod-imagem');
const imgPreview = document.getElementById('img-preview');

function mostrarMensagem(texto, tipo = 'success') {
  toastEl.textContent = texto;
  toastEl.className = `toast ${tipo}`;
  setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 4000);
}

// Pré-visualização em tempo real do link da imagem ao cadastrar produto
inputProdImagem.addEventListener('input', () => {
  const url = inputProdImagem.value.trim();
  imgPreview.src = url || FALLBACK_IMG;
});

imgPreview.addEventListener('error', () => {
  imgPreview.src = FALLBACK_IMG;
});

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  formLogin.classList.remove('hidden');
  formRegister.classList.add('hidden');
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  formRegister.classList.remove('hidden');
  formLogin.classList.add('hidden');
});

document.querySelectorAll('.nav-pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-pill').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const view = btn.getAttribute('data-view');
    document.querySelectorAll('.store-view').forEach((v) => v.classList.add('hidden'));
    document.getElementById(`view-${view}`).classList.remove('hidden');

    if (view === 'vitrine') carregarProdutos();
    if (view === 'pedidos') carregarPedidos();1
  });
});

// Filtros de Compras / Vendas na aba de Pedidos
document.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    filtroPedidoAtual = btn.getAttribute('data-filter');
    renderizarPedidos();
  });
});

function atualizarInterfaceAuth() {
  if (tokenJWT && usuarioAtual) {
    authSection.classList.add('hidden');
    storeSection.classList.remove('hidden');
    userPanel.classList.remove('hidden');
    userGreeting.textContent = usuarioAtual.nome;
    carregarProdutos();
  } else {
    authSection.classList.remove('hidden');
    storeSection.classList.add('hidden');
    userPanel.classList.add('hidden');
  }
}

document.getElementById('btn-logout').addEventListener('click', () => {
  tokenJWT = null;
  usuarioAtual = null;
  localStorage.removeItem('loja_jwt');
  localStorage.removeItem('loja_user');
  atualizarInterfaceAuth();
});

// CADASTRO
formRegister.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    nome: document.getElementById('reg-nome').value.trim(),
    email: document.getElementById('reg-email').value.trim() || undefined,
    cpf: document.getElementById('reg-cpf').value.trim(),
    telefone: document.getElementById('reg-telefone').value.trim(),
    endereco_principal: document.getElementById('reg-endereco').value.trim(),
    cartao_credito: document.getElementById('reg-cartao').value.replace(/\s+/g, ''),
    senha: document.getElementById('reg-senha').value
  };

  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      return mostrarMensagem(data.erro || 'Erro ao cadastrar.', 'error');
    }

    mostrarMensagem('Cadastro realizado com sucesso. Faça login para continuar.');
    formRegister.reset();
    tabLogin.click();
  } catch (err) {
    mostrarMensagem('Não foi possível conectar ao servidor.', 'error');
  }
});

// LOGIN
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();

  const identificador = document.getElementById('login-identificador').value.trim();
  const senha = document.getElementById('login-senha').value;

  const body = identificador.includes('@')
    ? { email: identificador, senha }
    : { cpf: identificador, senha };

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      return mostrarMensagem(data.erro || 'Dados de acesso incorretos.', 'error');
    }

    tokenJWT = data.token;
    usuarioAtual = data.usuario;
    localStorage.setItem('loja_jwt', tokenJWT);
    localStorage.setItem('loja_user', JSON.stringify(usuarioAtual));

    formLogin.reset();
    atualizarInterfaceAuth();
  } catch (err) {
    mostrarMensagem('Erro ao conectar ao servidor.', 'error');
  }
});

// LISTAR PRODUTOS (LOJA / VITRINE)
async function carregarProdutos() {
  const grid = document.getElementById('produtos-grid');
  grid.innerHTML = '<div class="empty-state">Carregando...</div>';

  try {
    const res = await fetch('/produtos', {
      headers: { Authorization: `Bearer ${tokenJWT}` }
    });

    if (res.status === 401 || res.status === 403) {
      document.getElementById('btn-logout').click();
      return;
    }

    const data = await res.json();
    const produtos = data.produtos || [];

    if (produtos.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          Nenhum produto anunciado na loja. Clique em "Vender Produto" para cadastrar o primeiro item.
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    produtos.forEach((p) => {
      const precoFormatado = Number(p.preco).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });

      const fotoUrl = p.imagemUrl && p.imagemUrl.trim() !== '' ? p.imagemUrl : FALLBACK_IMG;

      const card = document.createElement('div');
      card.className = 'produto-card';
      card.innerHTML = `
        <div class="produto-img-wrapper">
          <img src="${fotoUrl}" alt="${p.nome}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" />
        </div>
        <div class="produto-body">
          <h3>${p.nome}</h3>
          <p class="produto-desc">${p.descricao}</p>
          <div class="produto-footer">
            <span class="produto-preco">${precoFormatado}</span>
            <button class="btn btn-primary btn-sm btn-comprar" data-id="${p.id}">Comprar</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    document.querySelectorAll('.btn-comprar').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-id');
        comprarProduto(prodId);
      });
    });
  } catch (err) {
    grid.innerHTML = '<div class="empty-state">Erro ao carregar produtos.</div>';
  }
}

document.getElementById('btn-refresh-produtos').addEventListener('click', carregarProdutos);

// CADASTRAR PRODUTO PARA VENDA
document.getElementById('form-produto').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('prod-nome').value.trim();
  const preco = parseFloat(document.getElementById('prod-preco').value);
  const imagemUrl = document.getElementById('prod-imagem').value.trim();
  const descricao = document.getElementById('prod-descricao').value.trim();

  try {
    const res = await fetch('/produtos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenJWT}`
      },
      body: JSON.stringify({ nome, preco, imagemUrl, descricao })
    });

    const data = await res.json();
    if (!res.ok) {
      return mostrarMensagem(data.erro || 'Erro ao salvar produto.', 'error');
    }

    document.getElementById('form-produto').reset();
    imgPreview.src = FALLBACK_IMG;
    mostrarMensagem('Produto publicado para venda com sucesso.');
    document.querySelector('[data-view="vitrine"]').click();
  } catch (err) {
    mostrarMensagem('Erro ao comunicar com o servidor.', 'error');
  }
});

// COMPRAR PRODUTO
async function comprarProduto(produtoId) {
  try {
    const res = await fetch(`/comprar/${produtoId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenJWT}` }
    });

    const data = await res.json();
    if (!res.ok) {
      return mostrarMensagem(data.erro || 'Não foi possível concluir a compra.', 'error');
    }

    mostrarMensagem(`Compra aprovada (Cartão final ${data.cobranca_simulada.cartao_final.slice(-4)}). Pedido enviado para entrega!`);
    document.querySelector('[data-view="pedidos"]').click();
  } catch (err) {
    mostrarMensagem('Erro ao processar compra.', 'error');
  }
}

// CARREGAR E DETALHAR PLANILHA DE AUDITORIA E EVENTOS
async function carregarPedidos() {
  const tbody = document.getElementById('pedidos-tabela-body');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:24px; color:#64748b;">Carregando registros de auditoria...</td></tr>';
  }

  try {
    const res = await fetch('/pedidos', {
      headers: { Authorization: `Bearer ${tokenJWT}` }
    });

    const data = await res.json();
    listaPedidosCache = data.pedidos || [];
    listaUsuariosCache = data.usuarios || [];
    listaProdutosCache = data.produtos || [];
    
    // Atualiza os 4 Indicadores Simples e Numéricos no Topo (Requisito do Professor)
    if (data.estatisticas) {
      document.getElementById('stat-clientes').textContent = data.estatisticas.totalClientes || 0;
      document.getElementById('stat-produtos').textContent = data.estatisticas.totalProdutos || 0;
      document.getElementById('stat-vendas').textContent = data.estatisticas.totalVendas || 0;
      document.getElementById('stat-compras').textContent = data.estatisticas.totalCompras || 0;
    }

    renderizarPedidos();
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:24px; color:#dc2626;">Erro ao carregar planilha de registros.</td></tr>';
    }
  }
}

function renderizarPedidos() {
  const tbody = document.getElementById('pedidos-tabela-body');
  if (!tbody) return;

  let filtrados = [];
  if (filtroPedidoAtual === 'vendas') {
    filtrados = [...listaPedidosCache];
  } else if (filtroPedidoAtual === 'usuarios') {
    filtrados = [...listaUsuariosCache];
  } else if (filtroPedidoAtual === 'produtos') {
    filtrados = [...listaProdutosCache];
  } else {
    // "todos": combina vendas, novos usuários e produtos ordenados pelo horário mais recente
    filtrados = [...listaPedidosCache, ...listaUsuariosCache, ...listaProdutosCache].sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
    );
  }

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:32px; color:#64748b;">
          Nenhum registro encontrado para este filtro.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  filtrados.forEach((item) => {
    let classeBadge = 'status-outro';
    if (item.status_entrega === 'Em Rota de Entrega') classeBadge = 'status-rota';
    if (item.status_entrega === 'Entregue' || item.status_entrega === 'Ativo') classeBadge = 'status-entregue';

    let tagTipoClass = 'badge-venda';
    let tagTipoNome = 'Venda';
    if (item.tipo === 'usuario') {
      tagTipoClass = 'badge-usuario';
      tagTipoNome = 'Usuário';
    } else if (item.tipo === 'produto') {
      tagTipoClass = 'badge-produto';
      tagTipoNome = 'Produto';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge-tipo ${tagTipoClass}">${tagTipoNome}</span></td>
      <td><span class="tag-id">#${item.id}</span></td>
      <td><strong>${item.clienteNome}</strong></td>
      <td><span class="tag-cpf-mascarado" title="Metade oculta para proteção OWASP/LGPD">${item.cpfMascarado}</span></td>
      <td>
        <strong>${item.produtoNome}</strong>
        ${item.tipo === 'venda' ? `<span style="display:inline-block; margin-left:4px; font-weight:600; color:#475569;">(${item.quantidade} un)</span>` : ''}
      </td>
      <td>
        <span class="horario-texto">${item.horaRegistro}</span>
        <small style="display:block; font-size:0.75rem; color:#94a3b8;">${item.dataRegistro}</small>
      </td>
      <td>
        <span class="comentario-texto" title="${item.comentario}">
          ${item.comentario}
        </span>
      </td>
      <td><span class="tag-ip">${item.ip}</span></td>
      <td><span class="badge-status ${classeBadge}">${item.status_entrega}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

async function atualizarStatusEntrega(pedidoId, status_entrega) {
  try {
    const res = await fetch(`/pedidos/${pedidoId}/entrega`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenJWT}`
      },
      body: JSON.stringify({ status_entrega })
    });

    const data = await res.json();
    if (!res.ok) {
      return mostrarMensagem(data.erro || 'Erro ao atualizar entrega.', 'error');
    }

    mostrarMensagem(`Status de entrega do pedido #${pedidoId} atualizado para "${status_entrega}".`);
    carregarPedidos();
  } catch (err) {
    mostrarMensagem('Falha ao atualizar status.', 'error');
  }
}

document.getElementById('btn-refresh-pedidos').addEventListener('click', carregarPedidos);

atualizarInterfaceAuth();
