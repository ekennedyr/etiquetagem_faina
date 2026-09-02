# 🏛️ Sistema de Etiquetagem de Pastas AZ - Prefeitura Municipal de Faina

Aplicação web completa, moderna e fluida desenvolvida para a **Controladoria-Geral do Município (CGM)** da **Prefeitura Municipal de Faina**, voltada para organização arquivística documental de processos licitatórios, balancetes contábeis, dispensas, inexigibilidades e outros arquivos.

Permite cadastro e edição rápida de dados em formato de planilha de alta produtividade, cálculo automático reativo de volumes e geração de folhas A4 com etiquetas de lombada para pastas AZ rigorosamente dimensionadas para impressão física em tamanho real (100%).

---

## 🖨️ Especificações Físicas de Impressão (PDF & Papel)

* **Papel**: Folha A4 em orientação **Paisagem (Landscape)** (`297mm x 210mm`).
* **Dimensões da Etiqueta Unitária**: Largura fixa de `5,0 cm` (50mm) $\times$ Altura fixa de `15,5 cm` (155mm).
* **Distribuição na Folha**:
  - Exatamente **5 etiquetas por folha A4** dispostas lado a lado (1 linha de 5 colunas).
  - Largura total ocupada: $5 \times 50\text{mm} = 250\text{mm}$.
  - Margens horizontais na página: $47\text{mm}$ restantes ($23,5\text{mm}$ em cada lado).
  - Margens verticais na página: $55\text{mm}$ restantes ($27,5\text{mm}$ superior e inferior).
* **Guia de Corte**: Linhas pontilhadas discretas (`#D1D5DB`) entre as etiquetas e cruzetas guias externas nos cantos para corte com guilhotina ou tesoura.
* **Tamanho Real (100%)**: Configurado via CSS Paged Media (`@page { size: 297mm 210mm landscape; margin: 0; }`) garantindo que as etiquetas saiam em 5x15,5cm exatos sem distorção.

---

## 🏷️ Estrutura Visual da Etiqueta (Lombada de Pasta AZ)

1. **Topo (Cabeçalho)**:
   - Logotipo oficial da Prefeitura de Faina (Gestão 2025-2028: *"Nossa cidade rumo ao futuro"*).
   - Código de Localização da Pilha em destaque: `[SIGLA]/[SEQUENCIAL]` (ex.: `LIC-2023/001`), com numeração automática de 3 dígitos.
2. **Corpo Central**:
   - Cartão estruturado com hierarquia visual estrita.
   - Título principal em caixa alta (ex: `PROCESSOS LICITATÓRIOS`, `BALANCETE`, `DISPENSA DE LICITAÇÃO`).
   - Modalidade / Subtítulo com destaque visual.
   - Metadados: Fundo Municipal, Número do Processo, Ano, Mês e Objeto descritivo.
   - **Tipografia Adaptativa**: Ajuste dinâmico do tamanho de fonte do texto do Objeto para nunca vazar os limites físicos da etiqueta.
   - **Indicadores de Volume**: Exibição lado a lado de `Vol. Informado` (digitado da pasta antiga) e `Vol. Calculado` (gerado automaticamente pelo agrupamento do lote).
3. **Rodapé**:
   - Texto de ressalva jurídica da CGM:
     > *"Etiquetagem gerada através de esforços da CGM para organização do arquivo da administração 2021/2024. O conteúdo no interior dessa pasta não foi verificado."*
   - Nome institucional em destaque: **CONTROLADORIA-GERAL DO MUNICÍPIO**.

---

## 📋 Categorias de Documentos Suportadas

1. **Processos Licitatórios**:
   - Modalidade (Pregão Eletrônico, Pregão Presencial, Concorrência, Tomada de Preços, etc.)
   - Fundo Municipal / Gabinete
   - Número do Processo e Ano
   - Agrupamento automático de volume baseado em `[Número + Ano]`.
2. **Balancetes**:
   - Fundo Municipal (FMS, FME, FMAS, Tesouro Geral, etc.)
   - Mês e Ano
   - Agrupamento automático de volume baseado em `[Fundo + Mês + Ano]` (ex.: se houver 3 pastas cadastradas para Março/2022 do FMS, calcula `Vol. 1 de 3`, `Vol. 2 de 3`, `Vol. 3 de 3`).
3. **Dispensas / Inexigibilidades**:
   - Tipo (`DISPENSA DE LICITAÇÃO` ou `INEXIGIBILIDADE`)
   - Fundo, Número, Ano, Objeto e Volumes.
4. **Outros Arquivos**:
   - Título customizado digitado manualmente, descrição livre e volumes.
5. **Documentação Não Identificada**:
   - Título padronizado e campo de observações livres para catalogação rápida.

---

## 💻 Recursos da Interface

- **Experiência de Planilha (Grid Interativo)**:
  - Navegação fluida por teclado (`Tab`, `Enter`).
  - Ações rápidas por linha: Duplicar linha, Inserir nova linha abaixo, Mover para cima/baixo, Excluir.
  - Configuração global da Sigla do Lote e Sequencial Inicial.
  - Upload e personalização de Logotipo com botão de restauração do padrão oficial.
- **Pré-visualização A4 em Tempo Real**:
  - Exibição fidedigna de cada folha A4 com as 5 etiquetas diagramadas.
  - Controles de zoom (50%, 75%, 100% Tamanho Real, etc.) e navegação folha a folha ou visão geral de todas as folhas.
- **Persistência Local e Backup**:
  - Salvamento automático em `localStorage` contínuo.
  - Exportação e importação de arquivo `.json` completo do lote para troca entre operadores.
- **Exportação de PDF & Impressão**:
  - **Imprimir em Tamanho Real**: Aciona a impressão nativa do navegador (`Ctrl+P`) com o CSS milimétrico já configurado para folha A4 em paisagem com 100% de escala.
  - **Baixar PDF**: Geração de arquivo PDF para download via `jsPDF` em alta resolução (~300 DPI).

---

## 🛠️ Tecnologias Utilizadas

- **React 19 + TypeScript + Vite**
- **Tailwind CSS**
- **Lucide Icons**
- **jsPDF & html2canvas**

---

## 🚀 Como Executar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/ekennedyr/etiquetagem_faina.git
   cd etiquetagem_faina
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse no navegador em `http://localhost:5173`.

---

## 📄 Licença e Uso Institucional

Desenvolvido para uso da **Prefeitura Municipal de Faina** - Estado de Goiás.
Controladoria-Geral do Município (CGM) - Administração 2025-2028.
