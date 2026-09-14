import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

function apiDevPlugin(): Plugin {
  const db = {
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
        objeto: 'Registro de preços para eventual aquisição futura de medicamentos essenciais e insumos hospitalares.',
        volumeInformado: 'Vol. 1',
      }
    ],
  };

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
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];

        if (url === '/api/events' && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          });
          res.write(`data: ${JSON.stringify(db)}\n\n`);
          sseClients.add(res);
          req.on('close', () => sseClients.delete(res));
          return;
        }

        if (url === '/api/data' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
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
                broadcast(db);
                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(db));
                return;
              }
            } catch {}
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'invalid' }));
          });
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
                if (payload.config) db.config = payload.config;
                db.lastUpdated = Date.now();
                broadcast(db);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(db));
                return;
              }
            } catch {}
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'invalid' }));
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
})
