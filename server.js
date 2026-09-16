import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const DIST_DIR = path.join(__dirname, 'dist');

// Garante que o diretório de dados exista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_DATA = {
  lastUpdated: Date.now(),
  config: {
    siglaPilha: 'LIC-2023',
    sequencialInicial: 1,
    logoUrl: '/logo-faina.png',
    nomeInstitucional: 'CONTROLADORIA-GERAL DO MUNICÍPIO DE FAINA',
    ressalvaJuridica:
      'Etiquetagem gerada através de esforços da CGM para organização do arquivo da administração 2021/2024. O conteúdo no interior dessa pasta não foi verificado.',
    mostrarMarcasCorte: true,
  },
  items: [
    {
      id: 'sample-1',
      categoria: 'licitacao',
      modalidade: 'PREGÃO ELETRÔNICO',
      fundoMunicipal: 'Prefeitura Municipal / Gabinete',
      numeroProcesso: '15',
      ano: '2023',
      objeto: 'Registro de preços para eventual aquisição futura de medicamentos essenciais e insumos hospitalares para a rede municipal.',
      volumeInformado: 'Vol. 1',
    },
    {
      id: 'sample-2',
      categoria: 'licitacao',
      modalidade: 'PREGÃO ELETRÔNICO',
      fundoMunicipal: 'Prefeitura Municipal / Gabinete',
      numeroProcesso: '15',
      ano: '2023',
      objeto: 'Registro de preços para eventual aquisição futura de medicamentos essenciais e insumos hospitalares para a rede municipal.',
      volumeInformado: 'Vol. 2',
    }
  ],
};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler database.json:', err);
  }
  saveDatabase(DEFAULT_DATA);
  return DEFAULT_DATA;
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar database.json:', err);
  }
}

let db = loadDatabase();

// Obter endereços IPs da máquina na rede local (Wi-Fi / Ethernet)
function getLocalNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      // Pega apenas IPv4 e não-interno (evita 127.0.0.1)
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({
          interface: name,
          ip: net.address,
        });
      }
    }
  }
  return addresses;
}

// Lista de conexões ativas do Server-Sent Events (SSE)
const sseClients = new Set();

function broadcastSSE(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Ping para manter conexões SSE ativas em proxies, navegadores móveis e conexões Wi-Fi
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 10000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  // CORS Headers universais para permitir conexões de qualquer dispositivo/porta na rede
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. Endpoint de Saúde: /api/health
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), count: db.items.length, clients: sseClients.size }));
    return;
  }

  // 2. Endpoint de Informações de Rede: /api/network-info
  if (pathname === '/api/network-info' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    const networks = getLocalNetworkAddresses();
    res.end(JSON.stringify({
      port: PORT,
      networks,
      connectedClients: sseClients.size,
    }));
    return;
  }

  // 3. Endpoint SSE: /api/events (Streaming em tempo real bidirecional)
  if (pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(`data: ${JSON.stringify(db)}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 4. Endpoint GET /api/data
  if (pathname === '/api/data' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    });
    res.end(JSON.stringify(db));
    return;
  }

  // 5. Endpoint POST /api/items (Adicionar item do celular ou PC)
  if (pathname === '/api/items' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const newItem = JSON.parse(body);
        if (newItem && newItem.id) {
          // Adiciona ao banco de dados local
          db.items.push(newItem);
          db.lastUpdated = Date.now();
          saveDatabase(db);
          broadcastSSE(db);

          res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(db));
          return;
        }
      } catch (err) {
        console.error('Erro no POST /api/items:', err);
      }
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Payload inválido' }));
    });
    return;
  }

  // 6. Endpoint DELETE /api/items/:id (Remover item)
  if (pathname.startsWith('/api/items/') && req.method === 'DELETE') {
    const itemId = pathname.replace('/api/items/', '').trim();
    if (itemId) {
      db.items = db.items.filter((item) => item.id !== itemId);
      db.lastUpdated = Date.now();
      saveDatabase(db);
      broadcastSSE(db);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(db));
      return;
    }
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'ID do item ausente' }));
    return;
  }

  // 7. Endpoint PUT /api/data (Atualizar lote completo ou configurações)
  if (pathname === '/api/data' && req.method === 'PUT') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload && Array.isArray(payload.items)) {
          db.items = payload.items;
          if (payload.config) {
            db.config = { ...db.config, ...payload.config };
          }
          db.lastUpdated = Date.now();
          saveDatabase(db);
          broadcastSSE(db);

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(db));
          return;
        }
      } catch (err) {
        console.error('Erro no PUT /api/data:', err);
      }
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Payload inválido' }));
    });
    return;
  }

  // 8. Servir arquivos estáticos do frontend compilado em dist/
  let filePath = path.join(DIST_DIR, pathname);

  // Segurança contra Directory Traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Acesso Negado');
    return;
  }

  // Se existir arquivo estático exato, serve
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // SPA Fallback: serve dist/index.html para qualquer rota (ex: /formulario, /mobile, /preview)
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(indexPath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Aplicação não compilada. Execute npm run build.');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de Etiquetagem Faina rodando em http://0.0.0.0:${PORT}`);
  const networks = getLocalNetworkAddresses();
  if (networks.length > 0) {
    console.log(`📱 Acesso na rede local / Celular:`);
    networks.forEach((net) => {
      console.log(`   - http://${net.ip}:${PORT}/#/formulario (${net.interface})`);
    });
  }
});

