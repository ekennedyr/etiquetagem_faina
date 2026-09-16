import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

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
    console.error('Erro ao ler database.json em dev:', err);
  }
  saveDatabase(DEFAULT_DATA);
  return DEFAULT_DATA;
}

function saveDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar database.json em dev:', err);
  }
}

function getLocalNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses: { interface: string; ip: string }[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
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

function apiDevPlugin(): Plugin {
  let db = loadDatabase();
  const sseClients = new Set<any>();

  function broadcast(data: any) {
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach((res) => {
      try {
        res.write(msg);
      } catch {
        sseClients.delete(res);
      }
    });
  }

  return {
    name: 'api-dev-server',
    configureServer(server) {
      // Ping periódico apenas enquanto o dev server estiver ativo
      const pingTimer = setInterval(() => {
        sseClients.forEach((res) => {
          try {
            res.write(': ping\n\n');
          } catch {
            sseClients.delete(res);
          }
        });
      }, 10000);

      if (pingTimer.unref) {
        pingTimer.unref();
      }

      server.httpServer?.on('close', () => {
        clearInterval(pingTimer);
      });

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];


        // Headers CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (url === '/api/network-info' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            port: 5173,
            networks: getLocalNetworkAddresses(),
            connectedClients: sseClients.size,
          }));
          return;
        }

        if (url === '/api/events' && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          });
          res.write(`data: ${JSON.stringify(db)}\n\n`);
          sseClients.add(res);
          req.on('close', () => sseClients.delete(res));
          return;
        }

        if (url === '/api/data' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(db));
          return;
        }

        if (url === '/api/items' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              const item = JSON.parse(body);
              if (item && item.id) {
                db.items.push(item);
                db.lastUpdated = Date.now();
                saveDatabase(db);
                broadcast(db);
                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify(db));
                return;
              }
            } catch {}
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'invalid payload' }));
          });
          return;
        }

        if (url?.startsWith('/api/items/') && req.method === 'DELETE') {
          const itemId = url.replace('/api/items/', '').trim();
          if (itemId) {
            db.items = db.items.filter((item: any) => item.id !== itemId);
            db.lastUpdated = Date.now();
            saveDatabase(db);
            broadcast(db);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(db));
            return;
          }
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'invalid item id' }));
          return;
        }

        if (url === '/api/data' && req.method === 'PUT') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              if (payload && Array.isArray(payload.items)) {
                db.items = payload.items;
                if (payload.config) db.config = { ...db.config, ...payload.config };
                db.lastUpdated = Date.now();
                saveDatabase(db);
                broadcast(db);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify(db));
                return;
              }
            } catch {}
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'invalid payload' }));
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})

