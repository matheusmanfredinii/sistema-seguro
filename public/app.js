const FALLBACK_IMG = 'https://placehold.co/600x400/e5e7eb/6b7280?text=Produto';

let tokenJWT = localStorage.getItem('loja_jwt') || null;
let usuarioAtual = JSON.parse(localStorage.getItem('loja_user') || 'null');
let listaPedidosCache = [];
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

// CARREGAR E DETALHAR COMPRAS, VENDAS E ENTREGAS
async function carregarPedidos() {
  const list = document.getElementById('pedidos-list');
  list.innerHTML = '<div class="empty-state">Carregando...</div>';

  try {
    const res = await fetch('/pedidos', {
      headers: { Authorization: `Bearer ${tokenJWT}` }
    });

    const data = await res.json();
    listaPedidosCache = data.pedidos || [];
    atualizarContadoresPedidos();
    renderizarPedidos();
  } catch (err) {
    list.innerHTML = '<div class="empty-state">Erro ao carregar pedidos.</div>';
  }
}

function atualizarContadoresPedidos() {
  const total = listaPedidosCache.length;
  const emRota = listaPedidosCache.filter((p) => p.status_entrega === 'Em Rota de Entrega').length;
  const entregues = listaPedidosCache.filter((p) => p.status_entrega === 'Entregue').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-rota').textContent = emRota;
  document.getElementById('stat-entregues').textContent = entregues;
}

function renderizarPedidos() {
  const list = document.getElementById('pedidos-list');

  const filtrados = listaPedidosCache.filter((ped) => {
    if (!usuarioAtual) return true;
    if (filtroPedidoAtual === 'compras') return ped.compradorId === usuarioAtual.id;
    if (filtroPedidoAtual === 'vendas') return ped.produto && ped.produto.vendedorId === usuarioAtual.id;
    return true;
  });

  if (filtrados.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        Nenhum registro encontrado para este filtro.
      </div>
    `;
    return;
  }

  list.innerHTML = '';
  filtrados.forEach((ped) => {
    const dataFormatada = new Date(ped.data_compra).toLocaleString('pt-BR');
    const precoFormatado = Number(ped.produto.preco).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    const fotoUrl = ped.produto.imagemUrl && ped.produto.imagemUrl.trim() !== ''
      ? ped.produto.imagemUrl
      : FALLBACK_IMG;

    const souComprador = usuarioAtual && ped.compradorId === usuarioAtual.id;
    const souVendedor = usuarioAtual && ped.produto.vendedorId === usuarioAtual.id;

    let classeBadge = 'status-outro';
    if (ped.status_entrega === 'Em Rota de Entrega') classeBadge = 'status-rota';
    if (ped.status_entrega === 'Entregue') classeBadge = 'status-entregue';

    // Etapas visuais de entrega
    const step1Class = ped.status_entrega === 'Processando Pagamento' ? 'active' : 'done';
    const step2Class = ped.status_entrega === 'Em Rota de Entrega' ? 'active' : (ped.status_entrega === 'Entregue' ? 'done' : '');
    const step3Class = ped.status_entrega === 'Entregue' ? 'done' : '';

    const card = document.createElement('div');
    card.className = 'pedido-card';
    card.innerHTML = `
      <div class="pedido-top">
        <div class="pedido-produto-box">
          <img class="pedido-thumb" src="${fotoUrl}" alt="${ped.produto.nome}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" />
          <div class="pedido-info">
            <div class="pedido-tags">
              ${souComprador ? '<span class="tag-tipo tag-compra">Compra</span>' : ''}
              ${souVendedor ? '<span class="tag-tipo tag-venda">Venda</span>' : ''}
            </div>
            <h4>Pedido #${ped.id} — ${ped.produto.nome}</h4>
            <span class="produto-preco">${precoFormatado}</span>
          </div>
        </div>

        <div class="pedido-actions">
          <span class="badge-status ${classeBadge}">${ped.status_entrega}</span>
          <select class="select-status" data-id="${ped.id}">
            <option value="Processando Pagamento" ${ped.status_entrega === 'Processando Pagamento' ? 'selected' : ''}>Processando Pagamento</option>
            <option value="Em Rota de Entrega" ${ped.status_entrega === 'Em Rota de Entrega' ? 'selected' : ''}>Em Rota de Entrega</option>
            <option value="Entregue" ${ped.status_entrega === 'Entregue' ? 'selected' : ''}>Entregue</option>
            <option value="Cancelado" ${ped.status_entrega === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
          </select>
          <button class="btn btn-primary btn-sm btn-salvar-status" data-id="${ped.id}">Atualizar Entrega</button>
        </div>
      </div>

      <div class="pedido-details-grid">
        <div class="detail-item">
          <span>Cliente</span>
          <strong>${ped.comprador ? ped.comprador.nome : 'Cliente #' + ped.compradorId}</strong>
        </div>
        <div class="detail-item">
          <span>Endereço de Entrega</span>
          <strong>${ped.endereco_entrega}</strong>
        </div>
        <div class="detail-item">
          <span>Data da Compra</span>
          <strong>${dataFormatada}</strong>
        </div>
      </div>

      <div class="delivery-stepper">
        <div class="step-item ${step1Class}">1. Pagamento Aprovado</div>
        <div class="step-item ${step2Class}">2. Em Rota de Entrega</div>
        <div class="step-item ${step3Class}">3. Pedido Entregue</div>
      </div>
    `;
    list.appendChild(card);
  });

  document.querySelectorAll('.btn-salvar-status').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const pedidoId = btn.getAttribute('data-id');
      const selectEl = document.querySelector(`.select-status[data-id="${pedidoId}"]`);
      const novoStatus = selectEl.value;
      await atualizarStatusEntrega(pedidoId, novoStatus);
    });
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
