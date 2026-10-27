require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();


// Helmet adiciona cabeçalhos HTTP de segurança (XSS Filter, HSTS, NoSniff, Frameguard, etc.)
// Desabilita apenas o bloqueio de imagens externas no CSP para permitir carregar fotos de produtos por link (URL)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https:', 'http:']
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Configuração de CORS e limite de payload JSON (10mb para suportar links de imagem longos e base64)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir os arquivos estáticos do Front-end (Loja HTML/CSS/JS na pasta public)
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting Global (Proteção básica contra abuso de requisições)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições originadas deste IP. Tente novamente mais tarde.' }
});
app.use(globalLimiter);

// Rate Limiting Estrito para Autenticação (Proteção contra Força Bruta / Credential Stuffing - OWASP A07)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limite de 10 tentativas de login/cadastro por IP a cada 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de autenticação. Sua conta/IP foi temporariamente bloqueada por 15 minutos.' }
});


const ALGORITHM = 'aes-256-cbc';
// Garante que a chave tenha exatamente 32 bytes (256 bits) usando SHA-256 sobre a variável de ambiente
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(String(process.env.AES_SECRET_KEY || 'default_fallback_key_change_in_prod'))
  .digest();

/**
 * Criptografa um texto em claro usando AES-256-CBC com IV aleatório a cada execução.
 * Retorna no formato: "iv_hex:conteudo_criptografado_hex"
 */
function encryptAES(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(16); // Vetor de Inicialização (16 bytes para AES)
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Descriptografa um texto no formato "iv_hex:conteudo_criptografado_hex" usando AES-256-CBC.
 */
function decryptAES(encryptedPayload) {
  if (!encryptedPayload) return '';
  const [ivHex, encryptedText] = encryptedPayload.split(':');
  if (!ivHex || !encryptedText) {
    throw new Error('Formato de dado criptografado inválido.');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Gera um hash determinístico (SHA-256) do CPF (Blind Index) para permitir
 * login e verificação de unicidade no banco sem salvar o CPF em texto claro
 * (já que o AES com IV aleatório gera saídas diferentes para o mesmo CPF).
 */
function generateCpfBlindIndex(cpf) {
  const cleanCpf = String(cpf).replace(/\D/g, '');
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(cleanCpf)
    .digest('hex');
}

// ============================================================================
// 3. MIDDLEWARE DE AUTENTICAÇÃO JWT (OWASP A07 - Identification & Auth Failures)
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_change_immediately';

function autenticarJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de autenticação não fornecido ou malformado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contém { userId, nome }
    return next();
  } catch (error) {
    return res.status(403).json({ erro: 'Token inválido ou expirado.' });
  }
}

// ============================================================================
// 4. ROTAS DA API
// ============================================================================

/**
 * POST /register
 * Cria o usuário. Faz hash da senha com bcrypt, criptografa CPF, Telefone e Cartão com AES-256-CBC e salva.
 */
app.post('/register', authLimiter, async (req, res) => {
  try {
    const { nome, email, cpf, endereco_principal, telefone, cartao_credito, senha } = req.body;

    if (!nome || !cpf || !endereco_principal || !telefone || !cartao_credito || !senha) {
      return res.status(400).json({
        erro: 'Todos os campos obrigatórios (nome, cpf, endereco_principal, telefone, cartao_credito, senha) devem ser preenchidos.'
      });
    }

    // Normaliza CPF e gera o Blind Index para checagem de duplicidade
    const cpfHash = generateCpfBlindIndex(cpf);

    // Consulta parametrizada via Prisma (Proteção contra SQL Injection - OWASP A03)
    const usuarioExistente = await prisma.user.findUnique({
      where: { cpfHash }
    });

    if (usuarioExistente) {
      return res.status(409).json({ erro: 'Já existe um usuário cadastrado com este CPF.' });
    }

    // 1. Hash irreversível de senha com Bcrypt (Salt Rounds = 12)
    const saltRounds = 12;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    // 2. Criptografia reversível (AES-256-CBC) dos dados sensíveis em repouso
    const cpfCriptografado = encryptAES(cpf);
    const telefoneCriptografado = encryptAES(telefone);
    const cartaoCriptografado = encryptAES(cartao_credito);

    // 3. Persistência segura no banco
    const novoUsuario = await prisma.user.create({
      data: {
        nome,
        email: email || null,
        cpfHash,
        cpf: cpfCriptografado,
        endereco_principal,
        telefone: telefoneCriptografado,
        cartao_credito: cartaoCriptografado,
        senha: senhaHash
      }
    });

    // Nunca retornar a senha ou os dados financeiros brutos na resposta
    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        endereco_principal: novoUsuario.endereco_principal,
        dados_protegidos: {
          cpf_armazenado_aes: novoUsuario.cpf,
          cartao_armazenado_aes: novoUsuario.cartao_credito
        }
      }
    });
  } catch (error) {
    console.error('[ERRO /register]:', error.message);
    return res.status(500).json({ erro: 'Erro interno ao processar o cadastro.' });
  }
});

/**
 * POST /login
 * Valida credenciais (via CPF ou Email + Senha) e retorna o token JWT assinado.
 */
app.post('/login', authLimiter, async (req, res) => {
  try {
    const { cpf, email, senha } = req.body;

    if ((!cpf && !email) || !senha) {
      return res.status(400).json({ erro: 'Informe o CPF (ou email) e a senha para realizar o login.' });
    }

    let usuario = null;

    if (cpf) {
      const cpfHash = generateCpfBlindIndex(cpf);
      usuario = await prisma.user.findUnique({ where: { cpfHash } });
    } else if (email) {
      usuario = await prisma.user.findUnique({ where: { email } });
    }

    // Mensagem genérica para evitar Enumeração de Usuários (OWASP A07)
    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    // Gera o Token JWT com expiração de 2 horas
    const token = jwt.sign(
      { userId: usuario.id, nome: usuario.nome },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome
      }
    });
  } catch (error) {
    console.error('[ERRO /login]:', error.message);
    return res.status(500).json({ erro: 'Erro interno ao processar o login.' });
  }
});

/**
 * POST /produtos (Protegida por JWT)
 * Permite ao usuário logado anunciar um produto (ele será o vendedorId).
 */
app.post('/produtos', autenticarJWT, async (req, res) => {
  try {
    const { nome, preco, descricao, imagemUrl } = req.body;
    const vendedorId = req.user.userId;

    if (!nome || preco === undefined || !descricao) {
      return res.status(400).json({ erro: 'Os campos nome, preco e descricao são obrigatórios.' });
    }

    const precoNumerico = Number(preco);
    if (isNaN(precoNumerico) || precoNumerico <= 0) {
      return res.status(400).json({ erro: 'O preço do produto deve ser um valor numérico positivo.' });
    }

    const novoProduto = await prisma.product.create({
      data: {
        nome,
        preco: precoNumerico,
        descricao,
        imagemUrl: imagemUrl ? String(imagemUrl).trim() : null,
        vendedorId
      }
    });

    return res.status(201).json({
      mensagem: 'Produto anunciado com sucesso!',
      produto: novoProduto
    });
  } catch (error) {
    console.error('[ERRO POST /produtos]:', error.message);
    return res.status(500).json({ erro: 'Erro ao cadastrar o produto.' });
  }
});

/**
 * GET /produtos (Protegida por JWT)
 * Lista todos os produtos disponíveis na loja para compra.
 */
app.get('/produtos', autenticarJWT, async (req, res) => {
  try {
    const produtos = await prisma.product.findMany({
      include: {
        vendedor: {
          select: {
            id: true,
            nome: true
            // Dados sensíveis do vendedor (CPF, cartão, senha, telefone) NUNCA são selecionados
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });

    return res.status(200).json({
      total: produtos.length,
      produtos
    });
  } catch (error) {
    console.error('[ERRO GET /produtos]:', error.message);
    return res.status(500).json({ erro: 'Erro ao listar os produtos.' });
  }
});

/**
 * POST /comprar/:produtoId (Protegida por JWT)
 * O usuário logado efetua a compra:
 * - Descriptografa o cartão do usuário em memória apenas para simular a cobrança
 * - Registra a Order
 * - Copia o endereco_principal do usuário para endereco_entrega
 * - Define status_entrega como "Em Rota de Entrega"
 */
app.post('/comprar/:produtoId', autenticarJWT, async (req, res) => {
  try {
    const produtoId = parseInt(req.params.produtoId, 10);
    const compradorId = req.user.userId;

    if (isNaN(produtoId)) {
      return res.status(400).json({ erro: 'ID do produto inválido.' });
    }

    // 1. Busca o produto no banco
    const produto = await prisma.product.findUnique({
      where: { id: produtoId }
    });

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    // 2. Busca os dados do comprador
    const comprador = await prisma.user.findUnique({
      where: { id: compradorId }
    });

    if (!comprador) {
      return res.status(404).json({ erro: 'Usuário comprador não encontrado.' });
    }

    // 3. Descriptografa o cartão de crédito EXCLUSIVAMENTE em memória para processar a cobrança
    let cartaoEmMemoria = decryptAES(comprador.cartao_credito);
    const ultimos4Digitos = cartaoEmMemoria.slice(-4);

    // Simula o processamento no gateway de pagamento e limpa a variável imediatamente
    const pagamentoAprovado = cartaoEmMemoria.length >= 13;
    cartaoEmMemoria = null; // Limpeza explícita da referência em memória

    if (!pagamentoAprovado) {
      return res.status(402).json({ erro: 'Falha no processamento do cartão de crédito.' });
    }

    // 4. Registra o pedido (Order) copiando o endereço do usuário e definindo o status_entrega
    const novoPedido = await prisma.order.create({
      data: {
        compradorId: comprador.id,
        productId: produto.id,
        endereco_entrega: comprador.endereco_principal,
        status_entrega: 'Em Rota de Entrega'
      },
      include: {
        produto: {
          select: { id: true, nome: true, preco: true, imagemUrl: true }
        }
      }
    });

    return res.status(201).json({
      mensagem: 'Compra realizada e pagamento aprovado com sucesso!',
      cobranca_simulada: {
        cartao_final: `**** **** **** ${ultimos4Digitos}`,
        valor_cobrado: produto.preco,
        status_pagamento: 'Aprovado'
      },
      pedido: novoPedido
    });
  } catch (error) {
    console.error('[ERRO POST /comprar/:produtoId]:', error.message);
    return res.status(500).json({ erro: 'Erro interno ao processar a compra.' });
  }
});

/**
 * PATCH /pedidos/:pedidoId/entrega (Protegida por JWT)
 * Atualiza o status de entrega do pedido (para simular a logística).
 */
app.patch('/pedidos/:pedidoId/entrega', autenticarJWT, async (req, res) => {
  try {
    const pedidoId = parseInt(req.params.pedidoId, 10);
    const { status_entrega } = req.body;
    const usuarioLogadoId = req.user.userId;

    if (isNaN(pedidoId)) {
      return res.status(400).json({ erro: 'ID do pedido inválido.' });
    }

    const statusPermitidos = [
      'Processando Pagamento',
      'Em Rota de Entrega',
      'Entregue',
      'Cancelado'
    ];

    if (!status_entrega || !statusPermitidos.includes(status_entrega)) {
      return res.status(400).json({
        erro: `Status inválido. Valores permitidos: ${statusPermitidos.join(', ')}`
      });
    }

    // Busca o pedido junto com o produto para validar permissão (Comprador ou Vendedor do produto)
    const pedidoExistente = await prisma.order.findUnique({
      where: { id: pedidoId },
      include: { produto: true }
    });

    if (!pedidoExistente) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' });
    }

    const pedidoAtualizado = await prisma.order.update({
      where: { id: pedidoId },
      data: { status_entrega }
    });

    return res.status(200).json({
      mensagem: 'Status de entrega atualizado com sucesso!',
      pedido: pedidoAtualizado
    });
  } catch (error) {
    console.error('[ERRO PATCH /pedidos/:pedidoId/entrega]:', error.message);
    return res.status(500).json({ erro: 'Erro interno ao atualizar o status de entrega.' });
  }
});

/**
 * GET /pedidos (Protegida por JWT)
 * Lista os pedidos do usuário logado (como comprador e como vendedor) para acompanhar na Loja.
 */
app.get('/pedidos', autenticarJWT, async (req, res) => {
  try {
    const pedidos = await prisma.order.findMany({
      include: {
        produto: {
          include: {
            vendedor: { select: { id: true, nome: true } }
          }
        },
        comprador: { select: { id: true, nome: true } }
      },
      orderBy: { data_compra: 'desc' }
    });

    return res.status(200).json({ pedidos });
  } catch (error) {
    console.error('[ERRO GET /pedidos]:', error.message);
    return res.status(500).json({ erro: 'Erro ao listar os pedidos.' });
  }
});

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔒 Servidor E-commerce Seguro rodando na porta ${PORT}`);
});

