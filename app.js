import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm';

const supabaseUrl = 'https://sekwikxguprknuzuamdw.supabase.co';
const supabaseKey = 'sb_publishable_7JiM5Zjxaxz1AJWlblO8vg_-jKgh-Qg';
const supabase = createClient(supabaseUrl, supabaseKey);

// Variáveis Globais
const areas = ['Lataria', 'Pintura', 'Vidros', 'Rodas', 'Interior', 'Eletrica', 'Motor'];
const etapasFixas = ['Lixamento e Preparação', 'Pintura', 'Mecânica', 'Elétrica', 'Instalação de Vidros', 'Forração e Bancos'];
let itensGlobais = [];
let etapasGlobais = [];

// --- NAVEGAÇÃO DE TELAS ---
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('ativa'));
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    
    btn.classList.add('ativa');
    document.getElementById(`tela-${btn.dataset.tela}`).classList.add('ativa');
  });
});

// --- AÇÕES DE ITENS ---
document.getElementById('btn-add-item').addEventListener('click', async () => {
  const nome = document.getElementById('item-nome').value;
  const preco = parseFloat(document.getElementById('item-preco').value) || 0;
  const area = document.getElementById('item-area').value;
  const status = document.getElementById('item-status').value;

  if (!nome) return alert('Digite o nome do item!');

  const { error } = await supabase.from('itens').insert([{ nome, preco, area, status }]);
  if (error) alert('Erro ao salvar: ' + error.message);
  else {
    document.getElementById('item-nome').value = '';
    document.getElementById('item-preco').value = '';
  }
});

async function deletarItem(id) {
  if (!confirm('Tem certeza que deseja excluir?')) return;
  await supabase.from('itens').delete().eq('id', id);
}

async function mudarStatus(id, novoStatus) {
  await supabase.from('itens').update({ status: novoStatus }).eq('id', id);
}

// --- RENDERIZAÇÃO ---
function renderizarTela() {
  renderItens();
  renderFinanceiro();
  atualizarProgresso();
}

function renderItens() {
  const listaItens = document.getElementById('lista-itens');
  listaItens.innerHTML = '';
  
  if (itensGlobais.length === 0) {
    listaItens.innerHTML = '<p class="placeholder">Nenhum item cadastrado ainda.</p>';
    return;
  }

  itensGlobais.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-linha';
    
    let classeStatus = '';
    if (item.status === 'A comprar') classeStatus = 'status-a-comprar';
    else if (item.status === 'Comprado') classeStatus = 'status-comprado';
    else if (item.status === 'Em andamento') classeStatus = 'status-em-andamento';
    else if (item.status === 'Instalado') classeStatus = 'status-instalado';
    
    const precoFormatado = item.preco > 0 ? `R$ ${item.preco.toFixed(2).replace('.', ',')}` : '';

    div.innerHTML = `
      <div class="item-info">
        <span class="item-nome">${item.nome} <span style="font-size:10px; color:var(--success)">${precoFormatado}</span></span>
        <span class="item-area">${item.area}</span>
      </div>
      <div class="item-acoes">
        <select class="select-status ${classeStatus}" data-id="${item.id}">
          <option value="A comprar" ${item.status === 'A comprar' ? 'selected' : ''}>A comprar</option>
          <option value="Comprado" ${item.status === 'Comprado' ? 'selected' : ''}>Comprado</option>
          <option value="Em andamento" ${item.status === 'Em andamento' ? 'selected' : ''}>Em andamento</option>
          <option value="Instalado" ${item.status === 'Instalado' ? 'selected' : ''}>Instalado</option>
        </select>
        <button class="btn-edit" data-id="${item.id}" title="Editar item">✏️</button>
        <button class="btn-delete" data-id="${item.id}">🗑️</button>
      </div>
    `;
    listaItens.appendChild(div);
  });

  // Eventos de mudar status
  document.querySelectorAll('.select-status').forEach(select => {
    select.addEventListener('change', (e) => mudarStatus(e.target.getAttribute('data-id'), e.target.value));
  });
  
  // Eventos de deletar
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => deletarItem(e.target.getAttribute('data-id')));
  });

  // Eventos de EDITAR
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const item = itensGlobais.find(i => i.id == id);
      editarItem(id, item.nome, item.preco);
    });
  });
}

// NOVA FUNÇÃO PARA EDITAR O ITEM
async function editarItem(id, nomeAtual, precoAtual) {
  const novoNome = prompt("Edite o nome do item:", nomeAtual);
  if (novoNome === null) return; // Se o usuário cancelar

  const novoPrecoStr = prompt("Edite o preço (use ponto em vez de vírgula, ex: 150.50):", precoAtual);
  if (novoPrecoStr === null) return;

  const novoPreco = parseFloat(novoPrecoStr) || 0;

  const { error } = await supabase
    .from('itens')
    .update({ nome: novoNome, preco: novoPreco })
    .eq('id', id);

  if (error) alert('Erro ao editar: ' + error.message);
}

function renderFinanceiro() {
  let totalGasto = 0;
  let qtdComprados = 0;
  const listaGastos = document.getElementById('lista-gastos');
  listaGastos.innerHTML = '';

  itensGlobais.forEach(item => {
    // Só conta como gasto se já foi comprado ou além
    if (item.status !== 'A comprar') {
      totalGasto += Number(item.preco) || 0;
      qtdComprados++;
      
      listaGastos.innerHTML += `
        <div class="gasto-item">
          <span>${item.nome}</span>
          <strong>R$ ${(Number(item.preco) || 0).toFixed(2).replace('.', ',')}</strong>
        </div>
      `;
    }
  });

  document.getElementById('total-gasto').textContent = `R$ ${totalGasto.toFixed(2).replace('.', ',')}`;
  document.getElementById('qtd-comprados').textContent = qtdComprados;
}

function atualizarProgresso() {
  const pesos = { 'A comprar': 0, 'Comprado': 0.33, 'Em andamento': 0.66, 'Instalado': 1 };
  let somaTotalAreas = 0;
  let areasConcluidas = 0;
  const divAreas = document.getElementById('progresso-areas');
  divAreas.innerHTML = '';

  areas.forEach(area => {
    const itensArea = itensGlobais.filter(i => i.area === area);
    let somaArea = 0;
    itensArea.forEach(item => { somaArea += pesos[item.status] || 0; });
    
    const porcArea = itensArea.length === 0 ? 0 : (somaArea / itensArea.length);
    if (porcArea === 1) areasConcluidas++;
    somaTotalAreas += porcArea;

    const porcVisual = Math.round(porcArea * 100);
    divAreas.innerHTML += `
      <div class="area-item">
        <div class="nome-area"><span>${area}</span><span>${porcVisual}%</span></div>
        <div class="barra-fundo"><div class="barra-preenchida" style="width: ${porcVisual}%; background: var(--accent)"></div></div>
      </div>
    `;
  });

  const porcentagemGeral = Math.round((somaTotalAreas / areas.length) * 100);
  document.getElementById('barra-geral').style.width = `${porcentagemGeral}%`;
  document.getElementById('texto-progresso').textContent = `${porcentagemGeral}% concluído`;

  const carro = document.getElementById('carro-fusca');
  if (carro) carro.style.left = `${5 + (porcentagemGeral * 0.9)}%`;

  const cenario = document.getElementById('cenario-box');
  if (areasConcluidas === areas.length && itensGlobais.length > 0) {
    cenario.classList.add('concluido');
  } else {
    cenario.classList.remove('concluido');
  }
}

// --- LÓGICA DE ETAPAS ---
function renderEtapas() {
  const lista = document.getElementById('lista-etapas');
  lista.innerHTML = '';

  etapasGlobais.forEach(etapa => {
    const isConcluida = etapa.status === 'Concluída';
    lista.innerHTML += `
      <div class="etapa-item">
        <span class="etapa-nome">${etapa.nome}</span>
        <button class="btn-etapa ${isConcluida ? 'concluida' : 'pendente'}" onclick="mudarEtapa(${etapa.id}, '${isConcluida ? 'Pendente' : 'Concluída'}')">
          ${isConcluida ? '✓ Concluída' : 'Pendente'}
        </button>
      </div>
    `;
  });
}

// Função global para o botão de etapa funcionar no HTML
window.mudarEtapa = async (id, novoStatus) => {
  await supabase.from('etapas').update({ status: novoStatus }).eq('id', id);
};

// --- DIA E NOITE ---
function verificarHorario() {
  const hora = new Date().getHours();
  const cenario = document.getElementById('cenario-box');
  if (hora >= 18 || hora < 6) cenario.classList.add('noite');
  else cenario.classList.remove('noite');
}

// --- INICIALIZAÇÃO E TEMPO REAL ---
async function inicializar() {
  // 1. Criar etapas se não existirem
  const { data: checkEtapas } = await supabase.from('etapas').select('id').limit(1);
  if (checkEtapas.length === 0) {
    const novasEtapas = etapasFixas.map(nome => ({ nome, status: 'Pendente' }));
    await supabase.from('etapas').insert(novasEtapas);
  }

  // 2. Carregar dados
  carregarDados();
  verificarHorario();
  setInterval(verificarHorario, 60000); 

  // 3. Escutar mudanças no banco em tempo real
  supabase.channel('realtime-fusca')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'itens' }, () => carregarDados())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'etapas' }, () => carregarEtapas())
    .subscribe();
}

async function carregarDados() {
  const { data } = await supabase.from('itens').select('*').order('id', { ascending: false });
  itensGlobais = data || [];
  renderizarTela();
}

async function carregarEtapas() {
  const { data } = await supabase.from('etapas').select('*').order('id', { ascending: true });
  etapasGlobais = data || [];
  renderEtapas();
}

inicializar();