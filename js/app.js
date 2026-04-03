// ══════════════════════════════════════════════
// ESTADO
// ══════════════════════════════════════════════
let cursoAtual = "enfermagem";
let estado = {};
let obsState = {};
let history = [];

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
function init(){
  const cs = document.getElementById("course-selector");
  cs.innerHTML = Object.entries(CURSOS).map(([k,v])=>
    `<button class="course-btn ${k===cursoAtual?"active":""}" onclick="selecionarCurso('${k}',this)">${v.nome}</button>`
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
    header.innerHTML = `<span class="modulo-tag ${mod.tagClass}">${mod.tag}</span>
      <span class="modulo-title">${mod.titulo} — ${mod.periodo}</span>
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
        <td>${d.nome}</td>
        <td><span class="ch-badge">${d.ch}h</span></td>
        <td>
          <div class="status-group">
            ${["cursar","complementar","dispensada","ementas"].map(s=>`
              <button class="status-btn btn-${s} ${estado[d.id]===s?"active":""}"
                onclick="setStatus('${d.id}','${s}','${mod.id}')">${STATUS_LABELS[s]}</button>`).join("")}
          </div>
        </td>
        <td><textarea class="obs-input" rows="1" placeholder="Observação (opcional)"
          onchange="obsState['${d.id}']=this.value">${obsState[d.id]||""}</textarea></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  });
}

function setStatus(discId, status, modId){
  estado[discId] = status;
  renderGrade();
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
    list.innerHTML = ementas.map(n=>`<li>${n} — aguardando ementas: tratada como complementar (1/3) no cálculo</li>`).join("");
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
    let totalMod=0;
    if(!r.dispensadoTotal){
      totalMod = Math.round(mensalidade*r.fator*100)/100;
    }
    totalGeral += totalMod;
    if(r.chE>0 && !r.dispensadoTotal)
      warnings.push(`${mod.tag}: ${r.chE}h com status "Aguardando Ementas" — tratadas como complementar (1/3) até definição das ementas.`);
    resMods.push({mod, r, totalMod, fator:r.fator});
  });

  const parcelasGeral = Math.ceil(totalGeral / mensalidade);

  const cursoNormal = 28*mensalidade + (valMatricula-mensalidade);
  const economia = cursoNormal - totalGeral;

  document.getElementById("result-aluno").innerHTML =
    `<strong>${nome||"Aluno"}</strong>${matricula?" · Mat: "+matricula:""}${origem?" · Origem: "+origem:""} · ${curso.nome} · <em>${new Date().toLocaleDateString("pt-BR")}</em>`;

  document.getElementById("modulos-grid").innerHTML = resMods.map(m=>`
    <div class="modulo-card ${["m1","m2","m3"][curso.modulos.indexOf(m.mod)]}">
      <div class="mc-label">${m.mod.tag}</div>
      <div class="mc-name">${m.mod.titulo}</div>
      <div class="mc-value">${m.totalMod===0?"—":fmt(mensalidade)}</div>
      <div class="mc-sub">${m.totalMod===0?"Dispensado":`${Math.ceil(m.totalMod/mensalidade)}x de ${fmt(mensalidade)}`}</div>
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
    `<div class="warning-box">⚠️ <span>${w}</span></div>`).join("");

  const rows = document.getElementById("breakdown-rows");
  rows.innerHTML = "";
  let parcelasUsadas = 0;
  resMods.forEach((m,i)=>{
    const numP = m.totalMod > 0 ? Math.ceil(m.totalMod/mensalidade) : 0;
    const p1 = numP > 0 ? parcelasUsadas + 1 : "–";
    const p2 = numP > 0 ? parcelasUsadas + numP : "–";
    if(numP > 0) parcelasUsadas += numP;
    const desc = m.totalMod===0
      ? "Módulo totalmente dispensado"
      : `${(m.fator*100).toFixed(1)}% da mensalidade · ${m.r.chC}h integral + ${m.r.chComp}h compl. + ${m.r.chE}h em análise`;
    rows.innerHTML += `<div class="pb-row">
      <div class="pb-num">Parc. ${p1}–${p2}</div>
      <div>${m.mod.tag} — ${m.mod.titulo}<br><span class="pb-desc">${desc}</span></div>
      <div class="pb-val">${m.totalMod===0?"—":fmt(mensalidade)}</div>
      <div class="pb-tot">${fmt(m.totalMod)}</div></div>`;
  });
  rows.innerHTML += `<div class="pb-row" style="background:#fff0f0;font-weight:700">
    <div class="pb-num">TOTAL</div>
    <div>${parcelasUsadas} parcelas</div>
    <div></div>
    <div class="pb-tot" style="font-size:14px">${fmt(totalGeral)}</div></div>`;

  document.getElementById("results").style.display="block";
  document.getElementById("results").scrollIntoView({behavior:"smooth",block:"start"});

  salvarHistorico({nome,matricula,origem,curso:curso.nome,totalGeral,parcelasGeral,economia,valMatricula,mensalidade,estadoSnap:{...estado},obsSnap:{...obsState}});
}

// ══════════════════════════════════════════════
// HISTÓRICO
// ══════════════════════════════════════════════
function salvarHistorico(entry){
  entry.ts = new Date().toLocaleString("pt-BR");
  entry.id = Date.now();
  history.unshift(entry);
  renderHistory();
}

function renderHistory(){
  const c = document.getElementById("history-container");
  if(history.length===0){
    c.innerHTML='<div class="history-empty">Nenhum atendimento calculado ainda nesta sessão.</div>';
    return;
  }
  c.innerHTML = `<div class="history-list">${history.map(e=>`
    <div class="history-card" id="hc-${e.id}">
      <div class="hc-header">
        <div>
          <div class="hc-name">${e.nome||"Aluno sem nome"}</div>
          <div class="hc-mat">${e.matricula||"Sem matrícula"}${e.origem?" · "+e.origem:""}</div>
        </div>
        <span class="hc-curso">${e.curso}</span>
        <span class="hc-date">${e.ts}</span>
      </div>
      <div class="hc-grid">
        <div class="hc-stat"><div class="hc-stat-val">${fmt(e.totalGeral)}</div><div class="hc-stat-label">Total</div></div>
        <div class="hc-stat"><div class="hc-stat-val">${e.parcelasGeral}</div><div class="hc-stat-label">Parcelas</div></div>
        <div class="hc-stat"><div class="hc-stat-val">${fmt(e.economia)}</div><div class="hc-stat-label">Economia</div></div>
        <div class="hc-stat"><div class="hc-stat-val">${fmt(e.mensalidade)}</div><div class="hc-stat-label">Mensalidade</div></div>
      </div>
      <div class="hc-actions">
        <button class="hc-btn" onclick="recarregarAtendimento(${e.id})">↩ Recarregar</button>
        <button class="hc-btn danger" onclick="removerHistorico(${e.id})">✕ Remover</button>
      </div>
    </div>`).join("")}</div>`;
}

function recarregarAtendimento(id){
  const e = history.find(h=>h.id===id);
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
  history = history.filter(h=>h.id!==id);
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
  const curso = CURSOS[cursoAtual];

  let total=vmat;
  let linhas = [
    "APROVEITAMENTO DE ESTUDOS — CSM TEC",
    `Aluno: ${nome}${mat?" | Mat: "+mat:""}${orig?" | Origem: "+orig:""}`,
    `Curso: ${curso.nome}`,
    `Data: ${new Date().toLocaleDateString("pt-BR")}`,
    "",
    `Matrícula: ${fmt(vmat)}`,
  ];
  let parcelasUsadas = 0;
  curso.modulos.forEach((mod,i)=>{
    const r=calcularFatorModulo(mod);
    if(r.dispensadoTotal){
      linhas.push(`${mod.tag}: DISPENSADO — R$ 0,00`);
    } else {
      const tot=Math.round(mens*r.fator*100)/100;
      const numP = Math.ceil(tot/mens);
      const p1 = parcelasUsadas + 1;
      const p2 = parcelasUsadas + numP;
      parcelasUsadas += numP;
      total+=tot;
      linhas.push(`${mod.tag} (Parc. ${p1}–${p2}): ${numP}x ${fmt(mens)} = ${fmt(tot)}`);
    }
  });
  const totalParcelas = Math.ceil(total/mens);
  linhas.push("","TOTAL: "+fmt(total)+" em "+parcelasUsadas+" parcelas");
  linhas.push("Duração: "+parcelasUsadas+" meses (integralização com a turma)");
  navigator.clipboard.writeText(linhas.join("\n"))
    .then(()=>alert("Resumo copiado para a área de transferência!"));
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
  let linhasDisp=[], linhasComp=[], linhasCursar=[], linhasEmentas=[];
  let total=mens;
  curso.modulos.forEach(mod=>{
    mod.disciplinas.forEach(d=>{
      const s=estado[d.id];
      if(s==="dispensada")    linhasDisp.push(`  • ${d.nome} (${d.ch}h)`);
      if(s==="complementar")  linhasComp.push(`  • ${d.nome} (${d.ch}h)`);
      if(s==="cursar")        linhasCursar.push(`  • ${d.nome} (${d.ch}h)`);
      if(s==="ementas")       linhasEmentas.push(`  • ${d.nome} (${d.ch}h)`);
    });
    const r=calcularFatorModulo(mod);
    if(!r.dispensadoTotal){ total+=Math.round(mens*r.fator*100)/100; }
  });

  const totalParcelas = Math.ceil(total/mens);

  const carta = `COLÉGIO SANTA MÔNICA TÉCNICO — CSM TEC
Carta de Análise de Aproveitamento de Estudos

Limoeiro/PE, ${hoje}

Prezado(a) ${nome},

Após análise do histórico acadêmico apresentado pela instituição de origem (${orig}), informamos o resultado da avaliação de aproveitamento de estudos para ingresso no Curso Técnico em Enfermagem do CSM Tec (Matrícula: ${mat}).

DISCIPLINAS DISPENSADAS (equivalência ≥75% da C/H):
${linhasDisp.length>0?linhasDisp.join("\n"):"  Nenhuma"}

DISCIPLINAS COM AVALIAÇÃO COMPLEMENTAR (C/H parcial — cobrança de 1/3 da mensalidade):
${linhasComp.length>0?linhasComp.join("\n"):"  Nenhuma"}

DISCIPLINAS AGUARDANDO EMENTAS (dispensa sujeita à análise das ementas):
${linhasEmentas.length>0?linhasEmentas.join("\n"):"  Nenhuma"}

DISCIPLINAS A CURSAR INTEGRALMENTE:
${linhasCursar.length>0?linhasCursar.join("\n"):"  Nenhuma"}

CONDIÇÕES FINANCEIRAS:
  Matrícula: ${fmt(vmat)}
  Mensalidade padrão: ${fmt(mens)}
  Total com aproveitamento: ${fmt(total)} em ${totalParcelas} parcelas
  Duração do curso: ${totalParcelas} meses (integralização com a turma)

O aproveitamento de estudos não altera o prazo de conclusão do curso. O aluno integraliza junto com a turma, com redução proporcional da frequência nas disciplinas dispensadas e complementares.

Esta análise está sujeita à homologação final pela Coordenação Pedagógica do CSM Tec.

Atenciosamente,
Equipe Comercial — CSM Tec Santa Mônica`;

  const win = window.open("","_blank","width=700,height=600");
  win.document.write(`<html><head><title>Carta de Aproveitamento — ${nome}</title>
  <style>body{font-family:monospace;font-size:13px;padding:40px;white-space:pre-wrap;line-height:1.7;max-width:700px;margin:0 auto;}
  .print-btn{display:block;margin:20px auto;padding:10px 24px;background:#9b1c1c;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;}
  @media print{.print-btn{display:none!important;}}
  </style></head><body>
  <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
  ${carta.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
  <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
  </body></html>`);
  win.document.close();
}

// ══════════════════════════════════════════════
// START
// ══════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", init);
