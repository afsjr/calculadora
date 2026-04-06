// ══════════════════════════════════════════════
// ESTADO
// ══════════════════════════════════════════════
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

let cursoAtual = "enfermagem";
let estado = {};
let obsState = {};
let atendimentoHistory = [];
let ultimoResultado = null;

function loadFromLocalStorage(){
  try {
    const saved = localStorage.getItem("csm_calc_history");
    if(saved) {
      atendimentoHistory = JSON.parse(saved);
    }
  } catch(e) {
    console.warn("Failed to load history from localStorage", e);
  }
}

function saveToLocalStorage(){
  try {
    localStorage.setItem("csm_calc_history", JSON.stringify(atendimentoHistory));
  } catch(e) {
    console.warn("Failed to save history to localStorage", e);
  }
}

function init(){
  loadFromLocalStorage();
  
  document.getElementById("course-selector").addEventListener("click", (e) => {
    const btn = e.target.closest(".course-btn");
    if(btn) selecionarCurso(btn.dataset.curso, btn);
  });
  
  document.getElementById("grade-tables").addEventListener("click", (e) => {
    const btn = e.target.closest(".status-btn");
    if(btn) setStatus(btn.dataset.id, btn.dataset.status, btn.dataset.mod);
  });

  document.getElementById("grade-tables").addEventListener("change", (e) => {
    if(e.target.classList.contains("obs-input")){
      obsState[e.target.dataset.id] = e.target.value;
    }
  });

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab, btn));
  });

  document.getElementById("calcBtn").addEventListener("click", calcular);

  document.getElementById("results").addEventListener("click", (e) => {
    const btn = e.target.closest(".action-btn");
    if(!btn) return;
    const action = btn.dataset.action;
    if(action === "imprimir"){
      imprimirRelatorio();
    } else if(action === "copiar"){
      copiarResumo();
    } else if(action === "carta"){
      gerarCarta();
    }
  });

  document.getElementById("history-container").addEventListener("click", (e) => {
    const btn = e.target.closest(".hc-btn");
    if(!btn) return;
    if(btn.textContent.includes("Recarregar")){
      const id = parseInt(btn.dataset.id);
      recarregarAtendimento(id);
    } else if(btn.textContent.includes("Remover")){
      const id = parseInt(btn.dataset.id);
      removerHistorico(id);
    }
  });

  const cs = document.getElementById("course-selector");
  cs.innerHTML = Object.entries(CURSOS).map(([k,v])=>
    `<button class="course-btn ${k===cursoAtual?"active":""}" data-curso="${k}">${v.nome}</button>`
  ).join("");
  resetEstado();
  renderGrade();
}

function selecionarCurso(key, btn){
  cursoAtual = key;
  document.querySelectorAll(".course-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  resetEstado();
  renderGrade();
  document.getElementById("results").style.display="none";
}

function resetEstado(){
  estado = {};
  obsState = {};
  const curso = CURSOS[cursoAtual];
  curso.modulos.forEach(mod=>{
    mod.disciplinas.forEach(d=>{ estado[d.id]=d.def; obsState[d.id]=""; });
  });
}

// ══════════════════════════════════════════════
// RENDER GRADE
// ══════════════════════════════════════════════
const STATUS_LABELS = {cursar:"Cursará",complementar:"Complementar",dispensada:"Dispensada",ementas:"Ag. Ementas"};

function renderGrade(){
  const curso = CURSOS[cursoAtual];
  const container = document.getElementById("grade-tables");
  container.innerHTML = "";
  curso.modulos.forEach(mod=>{
    const chAtivas = mod.disciplinas.filter(d=>estado[d.id]!=="dispensada").reduce((s,d)=>s+d.ch,0);
    const chDisp   = mod.disciplinas.filter(d=>estado[d.id]==="dispensada").reduce((s,d)=>s+d.ch,0);
    const header = document.createElement("div");
    header.className = "modulo-header";
    header.innerHTML = `<span class="modulo-tag ${mod.tagClass}">${sanitize(mod.tag)}</span>
      <span class="modulo-title">${sanitize(mod.titulo)} — ${sanitize(mod.periodo)}</span>
      <span class="modulo-ch" id="ch-${mod.id}">${chAtivas}h em aula · ${chDisp}h dispensadas / ${mod.totalCH}h total</span>`;
    container.appendChild(header);

    const table = document.createElement("table");
    table.className = "disc-table";
    table.innerHTML = `<thead><tr>
      <th>Disciplina</th><th>C/H</th><th style="text-align:center">Status</th><th>Observação</th>
    </tr></thead>`;
    const tbody = document.createElement("tbody");
    mod.disciplinas.forEach(d=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${sanitize(d.nome)}</td>
        <td><span class="ch-badge">${d.ch}h</span></td>
        <td>
          <div class="status-group">
            ${["cursar","complementar","dispensada","ementas"].map(s=>`
              <button class="status-btn btn-${s} ${estado[d.id]===s?"active":""}"
                data-id="${d.id}" data-status="${s}" data-mod="${mod.id}" aria-pressed="${estado[d.id]===s}">${STATUS_LABELS[s]}</button>`).join("")}
          </div>
        </td>
        <td><textarea class="obs-input" rows="1" placeholder="Observação (opcional)"
          data-id="${d.id}">${obsState[d.id]||""}</textarea></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  });
}

function setStatus(discId, status, modId){
  estado[discId] = status;
  
  const container = document.getElementById("grade-tables");
  const buttons = container.querySelectorAll(`.status-btn[data-id="${discId}"]`);
  buttons.forEach(btn => {
    const isActive = btn.dataset.status === status;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive);
  });
  
  atualizarTotaisModulo(modId);
}

function atualizarTotaisModulo(modId){
  const curso = CURSOS[cursoAtual];
  const mod = curso.modulos.find(m => m.id === modId);
  if(!mod) return;
  
  const chAtivas = mod.disciplinas.filter(d=>estado[d.id]!=="dispensada").reduce((s,d)=>s+d.ch,0);
  const chDisp = mod.disciplinas.filter(d=>estado[d.id]==="dispensada").reduce((s,d)=>s+d.ch,0);
  
  const el = document.getElementById(`ch-${modId}`);
  if(el) el.textContent = `${chAtivas}h em aula · ${chDisp}h dispensadas / ${mod.totalCH}h total`;
}

// ══════════════════════════════════════════════
// VALIDATION
// ══════════════════════════════════════════════
function validar(){
  const curso = CURSOS[cursoAtual];
  const ementas = [];
  curso.modulos.forEach(mod=>{
    mod.disciplinas.forEach(d=>{
      if(estado[d.id]==="ementas") ementas.push(d.nome);
    });
  });
  const banner = document.getElementById("val-banner");
  const list = document.getElementById("val-list");
  if(ementas.length>0){
    list.innerHTML = ementas.map(n=>`<li>${sanitize(n)} — aguardando ementas: tratada como complementar (1/3) no cálculo</li>`).join("");
    banner.classList.add("show");
  } else {
    banner.classList.remove("show");
  }
  return true;
}

// ══════════════════════════════════════════════
// CALCULAR
// ══════════════════════════════════════════════
function calcularFatorModulo(mod){
  let chC=0,chComp=0,chD=0,chE=0;
  mod.disciplinas.forEach(d=>{
    const s=estado[d.id];
    if(s==="cursar")       chC+=d.ch;
    if(s==="complementar") chComp+=d.ch;
    if(s==="dispensada")   chD+=d.ch;
    if(s==="ementas")      chE+=d.ch;
  });
  const total = mod.totalCH;
  const fator = chC/total + (chComp/total)*(1/3) + (chE/total)*(1/3);
  const dispensadoTotal = (chC+chComp+chE)===0;
  return {fator,chC,chComp,chD,chE,dispensadoTotal};
}

function fmt(v){ return "R$ "+v.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}); }

function calcular(){
  validar();
  const mensalidade = parseFloat(document.getElementById("mensalidade").value)||370;
  const valMatricula = parseFloat(document.getElementById("val_matricula").value)||370;
  const nome = document.getElementById("nome").value.trim();
  const matricula = document.getElementById("matricula").value.trim();
  const origem = document.getElementById("origem").value.trim();
  const curso = CURSOS[cursoAtual];

  let totalGeral = valMatricula;
  const resMods = [];
  const warnings = [];

  curso.modulos.forEach(mod=>{
    const r = calcularFatorModulo(mod);
    const numP = mod.disciplinas.length > 0 ? 9 : 0;
    let vp=0, totalMod=0, nPCobradas=0;
    if(!r.dispensadoTotal){
      vp = Math.round(mensalidade*r.fator*100)/100;
      totalMod = Math.round(vp*numP*100)/100;
      nPCobradas = numP;
    }
    totalGeral += totalMod;
    if(r.chE>0 && !r.dispensadoTotal)
      warnings.push(`${mod.tag}: ${r.chE}h com status "Aguardando Ementas" — tratadas como complementar (1/3) até definição das ementas.`);
    resMods.push({mod, r, vp, totalMod, nPCobradas, numP, fator:r.fator});
  });

  const parcelasGeral = Math.ceil(totalGeral / mensalidade);

  const cursoNormal = 28*mensalidade + (valMatricula-mensalidade);
  const economia = cursoNormal - totalGeral;

  document.getElementById("result-aluno").innerHTML =
    `<strong>${sanitize(nome)||"Aluno"}</strong>${matricula?" · Mat: "+sanitize(matricula):""}${origem?" · Origem: "+sanitize(origem):""} · ${sanitize(curso.nome)} · <em>${new Date().toLocaleDateString("pt-BR")}</em>`;

  document.getElementById("modulos-grid").innerHTML = resMods.map(m=>`
    <div class="modulo-card ${["m1","m2","m3"][curso.modulos.indexOf(m.mod)]}">
      <div class="mc-label">${m.mod.tag}</div>
      <div class="mc-name">${sanitize(m.mod.titulo)}</div>
      <div class="mc-value">${m.nPCobradas===0?"—":m.nPCobradas}</div>
      <div class="mc-sub">${m.nPCobradas===0?"Módulo dispensado":`parcelas de ${fmt(m.vp)}`}</div>
      <div class="mc-total">${fmt(m.totalMod)}</div>
    </div>`).join("");

  document.getElementById("total-card").innerHTML = `
    <div class="tc-item">
      <div class="tc-label">Total a pagar</div>
      <div class="tc-value">${fmt(totalGeral)}</div>
      <div class="tc-sub">${parcelasGeral}x de ${fmt(mensalidade)}</div>
    </div>
    <div class="tc-divider"></div>
    <div class="tc-item">
      <div class="tc-label">Nº de parcelas</div>
      <div class="tc-value">${parcelasGeral}</div>
      <div class="tc-sub">de 28 possíveis</div>
    </div>
    <div class="tc-divider"></div>
    <div class="tc-item">
      <div class="tc-label">Duração</div>
      <div class="tc-value">${parcelasGeral} meses</div>
      <div class="tc-sub">integralização com a turma</div>
    </div>`;

  document.getElementById("economy-area").innerHTML = economia>0
    ? `<div class="economy-banner">🎉 <span>O aluno economiza <strong>${fmt(economia)}</strong> em relação ao curso sem aproveitamento (${fmt(cursoNormal)} → ${fmt(totalGeral)})</span></div>`
    : "";

  document.getElementById("warnings-area").innerHTML = warnings.map(w=>
    `<div class="warning-box">⚠️ <span>${sanitize(w)}</span></div>`).join("");

  const rows = document.getElementById("breakdown-rows");
  rows.innerHTML = `<div class="pb-row">
    <div class="pb-num">Parcela 1</div><div>Matrícula</div>
    <div class="pb-val">${fmt(valMatricula)}</div>
    <div class="pb-tot">${fmt(valMatricula)}</div></div>`;
  resMods.forEach((m,i)=>{
    const p1=m.mod.disciplinas.length>0 ? m.mod.parcelaInicio : "–";
    const p2=m.mod.parcelaFim;
    const desc = m.nPCobradas===0
      ? "Módulo totalmente dispensado"
      : `${(m.fator*100).toFixed(1)}% da mensalidade · ${m.r.chC}h integral + ${m.r.chComp}h compl. + ${m.r.chE}h em análise`;
    rows.innerHTML += `<div class="pb-row">
      <div class="pb-num">Parc. ${p1}–${p2}</div>
      <div>${m.mod.tag} — ${m.mod.titulo}<br><span class="pb-desc">${desc}</span></div>
      <div class="pb-val">${m.nPCobradas===0?"—":fmt(m.vp)}</div>
      <div class="pb-tot">${fmt(m.totalMod)}</div></div>`;
  });
  rows.innerHTML += `<div class="pb-row" style="background:#fff0f0;font-weight:700">
    <div class="pb-num">TOTAL</div>
    <div>${parcelasGeral} parcelas</div>
    <div></div>
    <div class="pb-tot" style="font-size:14px">${fmt(totalGeral)}</div></div>`;

  document.getElementById("results").style.display="block";
  document.getElementById("results").scrollIntoView({behavior:"smooth",block:"start"});
  
  ultimoResultado = {
    nome, matricula, origem,
    mensalidade, valMatricula,
    curso: curso.nome,
    resMods, totalGeral, parcelasGeral, economia, cursoNormal
  };
  
  salvarHistorico({nome,matricula,origem,curso:curso.nome,totalGeral,parcelasGeral,economia,valMatricula,mensalidade,estadoSnap:{...estado},obsSnap:{...obsState}});
}

// ══════════════════════════════════════════════
// HISTÓRICO
// ══════════════════════════════════════════════
function salvarHistorico(entry){
  entry.ts = new Date().toLocaleString("pt-BR");
  entry.id = Date.now();
  atendimentoHistory.unshift(entry);
  saveToLocalStorage();
  renderHistory();
}

function renderHistory(){
  const c = document.getElementById("history-container");
  if(atendimentoHistory.length===0){
    c.innerHTML='<div class="history-empty">Nenhum atendimento calculado ainda nesta sessão.</div>';
    return;
  }
  c.innerHTML = `<div class="history-list">${atendimentoHistory.map(e=>`
    <div class="history-card" id="hc-${e.id}">
      <div class="hc-header">
        <div>
          <div class="hc-name">${sanitize(e.nome)||"Aluno sem nome"}</div>
          <div class="hc-mat">${sanitize(e.matricula)||"Sem matrícula"}${e.origem?" · "+sanitize(e.origem):""}</div>
        </div>
        <span class="hc-curso">${sanitize(e.curso)}</span>
        <span class="hc-date">${e.ts}</span>
      </div>
      <div class="hc-grid">
        <div class="hc-stat"><div class="hc-stat-val">${fmt(e.totalGeral)}</div><div class="hc-stat-label">Total</div></div>
        <div class="hc-stat"><div class="hc-stat-val">${e.parcelasGeral}</div><div class="hc-stat-label">Parcelas</div></div>
        <div class="hc-stat"><div class="hc-stat-val">${fmt(e.economia)}</div><div class="hc-stat-label">Economia</div></div>
        <div class="hc-stat"><div class="hc-stat-val">${fmt(e.mensalidade)}</div><div class="hc-stat-label">Mensalidade</div></div>
      </div>
      <div class="hc-actions">
        <button class="hc-btn" data-id="${e.id}">↩ Recarregar</button>
        <button class="hc-btn danger" data-id="${e.id}">✕ Remover</button>
      </div>
    </div>`).join("")}</div>`;
}

function recarregarAtendimento(id){
  const e = atendimentoHistory.find(h=>h.id===id);
  if(!e) return;
  document.getElementById("nome").value = e.nome||"";
  document.getElementById("matricula").value = e.matricula||"";
  document.getElementById("origem").value = e.origem||"";
  document.getElementById("mensalidade").value = e.mensalidade||370;
  document.getElementById("val_matricula").value = e.valMatricula||370;
  estado = {...e.estadoSnap};
  obsState = {...e.obsSnap};
  renderGrade();
  calcular();
  switchTab("calc", document.querySelector(".tab-btn"));
}

function removerHistorico(id){
  atendimentoHistory = atendimentoHistory.filter(h=>h.id!==id);
  saveToLocalStorage();
  renderHistory();
}

// ══════════════════════════════════════════════
// TABS
// ══════════════════════════════════════════════
function switchTab(tab, btn){
  document.querySelectorAll(".tab-pane").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  document.getElementById("tab-"+tab).classList.add("active");
  btn.classList.add("active");
}

// ══════════════════════════════════════════════
// PRINT
// ══════════════════════════════════════════════
function imprimirRelatorio(){
  const results = document.getElementById("results");
  if(results.style.display==="none"){ alert("Calcule as parcelas primeiro."); return; }
  const nome = document.getElementById("nome").value||"Aluno";
  const mat  = document.getElementById("matricula").value||"";
  const old  = document.title;
  document.title = `CSM Tec — Aproveitamento — ${nome}${mat?" ("+mat+")":""}`;
  window.print();
  setTimeout(()=>{ document.title=old; },1000);
}

// ══════════════════════════════════════════════
// COPIAR RESUMO
// ══════════════════════════════════════════════
function copiarResumo(){
  const results = document.getElementById("results");
  if(results.style.display==="none"){ alert("Calcule as parcelas primeiro."); return; }
  
  const nome = document.getElementById("nome").value||"Aluno";
  const mat  = document.getElementById("matricula").value||"";
  const orig = document.getElementById("origem").value||"";
  const mens = parseFloat(document.getElementById("mensalidade").value)||370;
  const vmat = parseFloat(document.getElementById("val_matricula").value)||370;
  
  let total, linhas, totalParcelas;
  
  if(ultimoResultado && ultimoResultado.nome === nome && ultimoResultado.mensalidade === mens){
    total = ultimoResultado.totalGeral;
    totalParcelas = ultimoResultado.parcelasGeral;
    linhas = [
      "APROVEITAMENTO DE ESTUDOS — CSM TEC",
      `Aluno: ${nome}${mat?" | Mat: "+mat:""}${orig?" | Origem: "+orig:""}`,
      `Curso: ${ultimoResultado.curso}`,
      `Data: ${new Date().toLocaleDateString("pt-BR")}`,
      "",
      `Matrícula (Parcela 1): ${fmt(vmat)}`,
    ];
    
    ultimoResultado.resMods.forEach(m => {
      const pStart = m.mod.parcelaInicio;
      const pEnd = m.mod.parcelaFim;
      if(m.nPCobradas===0){
        linhas.push(`${m.mod.tag} (Parc. ${pStart}–${pEnd}): DISPENSADO — R$ 0,00`);
      } else {
        linhas.push(`${m.mod.tag} (Parc. ${pStart}–${pEnd}): ${m.nPCobradas}x ${fmt(m.vp)} = ${fmt(m.totalMod)}`);
      }
    });
  } else {
    const curso = CURSOS[cursoAtual];
    total = vmat;
    linhas = [
      "APROVEITAMENTO DE ESTUDOS — CSM TEC",
      `Aluno: ${nome}${mat?" | Mat: "+mat:""}${orig?" | Origem: "+orig:""}`,
      `Curso: ${curso.nome}`,
      `Data: ${new Date().toLocaleDateString("pt-BR")}`,
      "",
      `Matrícula (Parcela 1): ${fmt(vmat)}`,
    ];
    curso.modulos.forEach((mod, i)=>{
      const r=calcularFatorModulo(mod);
      const numP=mod.numParcelas;
      const pStart = mod.parcelaInicio;
      const pEnd = mod.parcelaFim;
      if(r.dispensadoTotal){
        linhas.push(`${mod.tag} (Parc. ${pStart}–${pEnd}): DISPENSADO — R$ 0,00`);
      } else {
        const vp=Math.round(mens*r.fator*100)/100;
        const tot=Math.round(vp*numP*100)/100;
        total+=tot;
        linhas.push(`${mod.tag} (Parc. ${pStart}–${pEnd}): ${numP}x ${fmt(vp)} = ${fmt(tot)}`);
      }
    });
    totalParcelas = Math.ceil(total/mens);
  }
  
  linhas.push("","TOTAL: "+fmt(total)+" em "+totalParcelas+" parcelas");
  linhas.push("Duração: "+totalParcelas+" meses (integralização com a turma)");
  const texto = linhas.join("\n");
  
  function showSuccess(){
    alert("Resumo copiado para a área de transferência!");
  }
  
  function fallbackCopy(){
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(ta);
    if(copied){
      showSuccess();
    } else {
      alert("Não foi possível copiar. Por favor, selecione e copie manualmente.");
    }
  }
  
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(texto).then(showSuccess).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }
}

// ══════════════════════════════════════════════
// GERAR CARTA
// ══════════════════════════════════════════════
function gerarCarta(){
  const results = document.getElementById("results");
  if(results.style.display==="none"){ alert("Calcule as parcelas primeiro."); return; }
  const nome = document.getElementById("nome").value||"[Nome do aluno]";
  const mat  = document.getElementById("matricula").value||"[Matrícula]";
  const orig = document.getElementById("origem").value||"[Instituição de origem]";
  const mens = parseFloat(document.getElementById("mensalidade").value)||370;
  const vmat = parseFloat(document.getElementById("val_matricula").value)||370;
  const curso = CURSOS[cursoAtual];

  const hoje = new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});
  const dataHoje = new Date().toLocaleDateString("pt-BR");
  
  let linhasDisp=[], linhasComp=[], linhasCursar=[], linhasEmentas=[];
  let total=vmat;
  curso.modulos.forEach(mod=>{
    mod.disciplinas.forEach(d=>{
      const s=estado[d.id];
      if(s==="dispensada")    linhasDisp.push(`  • ${sanitize(d.nome)} (${d.ch}h)`);
      if(s==="complementar")  linhasComp.push(`  • ${sanitize(d.nome)} (${d.ch}h)`);
      if(s==="cursar")        linhasCursar.push(`  • ${sanitize(d.nome)} (${d.ch}h)`);
      if(s==="ementas")       linhasEmentas.push(`  • ${sanitize(d.nome)} (${d.ch}h)`);
    });
    const r=calcularFatorModulo(mod);
    if(!r.dispensadoTotal){
      const vp=Math.round(mens*r.fator*100)/100;
      total+=Math.round(vp*mod.numParcelas*100)/100;
    }
  });

  const totalParcelas = Math.ceil(total/mens);

  const cartaHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Carta de Aproveitamento — ${sanitize(nome)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11px;
  line-height: 1.4;
  padding: 15mm;
  max-width: 210mm;
  margin: 0 auto;
}
.header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #9b1c1c;
}
.logo {
  font-size: 28px;
  font-weight: bold;
  color: #9b1c1c;
  margin-right: 15px;
}
.logo-text {
  font-size: 28px;
  font-weight: bold;
  color: #9b1c1c;
  margin-right: 15px;
}
.header-info h1 {
  font-size: 16px;
  color: #9b1c1c;
  margin-bottom: 3px;
}
.header-info p {
  font-size: 10px;
  color: #666;
}
h2 {
  font-size: 13px;
  color: #333;
  margin: 15px 0 8px 0;
  padding-bottom: 3px;
  border-bottom: 1px solid #ccc;
}
h3 {
  font-size: 11px;
  color: #555;
  margin: 12px 0 5px 0;
}
ul {
  margin-left: 15px;
  margin-bottom: 8px;
}
.financial-box {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  border: 1px solid #ddd;
}
.financial-box p {
  margin: 3px 0;
}
.financial-box strong {
  color: #9b1c1c;
}
.signatures {
  margin-top: 25px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
}
.signature-box {
  flex: 1;
  border-top: 1px solid #333;
  padding-top: 5px;
  font-size: 10px;
}
.signature-box p {
  margin: 3px 0;
}
.signature-box .date {
  text-align: center;
  margin-top: 15px;
}
.print-btn {
  display: block;
  margin: 20px auto;
  padding: 10px 24px;
  background: #9b1c1c;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
@media print {
  body { padding: 10mm; }
  .print-btn { display: none !important; }
  @page { size: A4; margin: 10mm; }
}
</style>
</head>
<body>
<button class="print-btn" id="printBtn">🖨️ Imprimir / Salvar PDF</button>

<div class="header">
  <div class="logo-text">🎓 CSM TEC</div>
  <div class="header-info">
    <h1>COLÉGIO SANTA MÔNICA TÉCNICO — CSM TEC</h1>
    <p>Carta de Análise de Aproveitamento de Estudos</p>
  </div>
</div>

<p><strong>Limoeiro/PE, ${hoje}</strong></p>
<p>Prezado(a) <strong>${sanitize(nome)}</strong>,</p>

<p>Após análise do histórico acadêmico apresentado pela instituição de origem (${sanitize(orig)}), informamos o resultado da avaliação de aproveitamento de estudos para ingresso no Curso Técnico em Enfermagem do CSM Tec (Matrícula: ${sanitize(mat)}).</p>

<h2>DISCIPLINAS DISPENSADAS</h2>
<p><em>Equivalência ≥75% da C/H</em></p>
<ul>${linhasDisp.length>0?linhasDisp.map(d=>`<li>${d}</li>`).join(""):"<li>Nenhuma</li>"}</ul>

<h2>DISCIPLINAS COM AVALIAÇÃO COMPLEMENTAR</h2>
<p><em>C/H parcial — cobrança de 1/3 da mensalidade</em></p>
<ul>${linhasComp.length>0?linhasComp.map(d=>`<li>${d}</li>`).join(""):"<li>Nenhuma</li>"}</ul>

<h2>DISCIPLINAS AGUARDANDO EMENTAS</h2>
<p><em>Dispensa sujeita à análise das ementas</em></p>
<ul>${linhasEmentas.length>0?linhasEmentas.map(d=>`<li>${d}</li>`).join(""):"<li>Nenhuma</li>"}</ul>

<h2>DISCIPLINAS A CURSAR INTEGRALMENTE</h2>
<ul>${linhasCursar.length>0?linhasCursar.map(d=>`<li>${d}</li>`).join(""):"<li>Nenhuma</li>"}</ul>

<h2>CONDIÇÕES FINANCEIRAS</h2>
<div class="financial-box">
  <p>Matrícula: <strong>${fmt(vmat)}</strong></p>
  <p>Mensalidade: <strong>${fmt(mens)}</strong></p>
  <p>Total a pagar: <strong>${fmt(total)}</strong> em <strong>${totalParcelas} parcelas</strong></p>
</div>

<p>O aluno cursará as disciplinas aproveitadas junto com as turmas que estão em andamento, seguindo o cronograma regular de aulas.</p>

<p>Esta análise está sujeita à homologação final pela Coordenação Pedagógica do CSM Tec.</p>

<div class="signatures">
  <div class="signature-box">
    <p>_________________________________</p>
    <p><strong>${sanitize(nome)}</strong></p>
    <p>Estudante - Ciente e Aceito a Proposta</p>
  </div>
  <div class="signature-box">
    <p>_________________________________</p>
    <p>Coordenação Pedagógica CSM Tec</p>
    <p>Representante do Colegio</p>
    <p class="date">Data: ___/___/______</p>
  </div>
</div>

<button class="print-btn" id="printBtn2">🖨️ Imprimir / Salvar PDF</button>
<script>document.getElementById('printBtn').onclick=function(){window.print();};document.getElementById('printBtn2').onclick=function(){window.print();};<\/script>
</body>
</html>`;

  const blob = new Blob([cartaHtml], {type: 'text/html'});
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "width=700,height=600");
  win.onload = () => URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════
// START
// ══════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", init);
