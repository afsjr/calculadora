// Testes unitários para a Calculadora CSM Tec
// Execute com: node tests/test.js

const assert = require('assert');

// Simulações mínimas para testar a lógica
const CURSOS = {
  enfermagem: {
    nome: "Téc. em Enfermagem",
    modulos: [
      {
        id: "mod1",
        tag: "Módulo I",
        tagClass: "",
        titulo: "Fundamentos",
        periodo: "Parcelas 1–10",
        totalCH: 410,
        parcelaInicio: 2,
        parcelaFim: 10,
        numParcelas: 9,
        disciplinas: [
          { id: "psicologia", nome: "Psicologia Aplicada", ch: 60, def: "cursar" },
          { id: "nutricao", nome: "Nutrição e Dietética", ch: 60, def: "complementar" },
          { id: "portugues", nome: "Português Instrumental", ch: 30, def: "cursar" },
          { id: "matematica", nome: "Matemática Instrumental", ch: 30, def: "cursar" },
          { id: "microbiologia", nome: "Microbiologia e Parasitologia", ch: 50, def: "dispensada" },
          { id: "higiene", nome: "Higiene e Profilaxia", ch: 50, def: "cursar" },
          { id: "etica", nome: "Ética Profissional", ch: 30, def: "dispensada" },
          { id: "anatomia", nome: "Anatomia e Fisiologia Humana", ch: 100, def: "cursar" },
        ]
      },
      {
        id: "mod2",
        tag: "Módulo II",
        tagClass: "ii",
        titulo: "Assistência Clínica",
        periodo: "Parcelas 11–19",
        totalCH: 440,
        parcelaInicio: 11,
        parcelaFim: 19,
        numParcelas: 9,
        disciplinas: [
          { id: "introducao", nome: "Introdução à Enfermagem", ch: 140, def: "complementar" },
          { id: "medica", nome: "Enfermagem Médica", ch: 120, def: "dispensada" },
          { id: "farmacologia", nome: "Noções de Farmacologia", ch: 40, def: "dispensada" },
          { id: "cirurgica", nome: "Enfermagem Cirúrgica", ch: 110, def: "dispensada" },
          { id: "adm", nome: "Noções de Adm. em Unidade de Enfermagem", ch: 30, def: "complementar" },
        ]
      },
      {
        id: "mod3",
        tag: "Módulo III",
        tagClass: "iii",
        titulo: "Especialidades",
        periodo: "Parcelas 20–28",
        totalCH: 350,
        parcelaInicio: 20,
        parcelaFim: 28,
        numParcelas: 9,
        disciplinas: [
          { id: "materno", nome: "Enf. Materno Infantil", ch: 130, def: "ementas" },
          { id: "pronto", nome: "Enf. em Pronto Socorro", ch: 60, def: "ementas" },
          { id: "neuro", nome: "Enf. Neuro Psiquiátrica", ch: 60, def: "dispensada" },
          { id: "saude", nome: "Enf. em Saúde Pública", ch: 100, def: "dispensada" },
        ]
      }
    ]
  }
};

// Estado simulado
let estado = {};

function initEstado() {
  estado = {};
  const curso = CURSOS.enfermagem;
  curso.modulos.forEach(mod => {
    mod.disciplinas.forEach(d => {
      estado[d.id] = d.def;
    });
  });
}

// Função de cálculo (copiada de app.js)
function calcularFatorModulo(mod) {
  let chC = 0, chComp = 0, chD = 0, chE = 0;
  mod.disciplinas.forEach(d => {
    const s = estado[d.id];
    if (s === "cursar") chC += d.ch;
    if (s === "complementar") chComp += d.ch;
    if (s === "dispensada") chD += d.ch;
    if (s === "ementas") chE += d.ch;
  });
  const total = mod.totalCH;
  const fator = chC / total + (chComp / total) * (1 / 3) + (chE / total) * (1 / 3);
  const dispensadoTotal = (chC + chComp + chE) === 0;
  return { fator, chC, chComp, chD, chE, dispensadoTotal };
}

function fmt(v) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ══════════════════════════════════════════════
// TESTES
// ══════════════════════════════════════════════

console.log("🧪 Iniciando testes unitários...\n");

// Teste 1: Cálculo do fator do Módulo I
console.log("Teste 1: Fator do Módulo I (com disciplinas mistas)");
initEstado();
const mod1 = CURSOS.enfermagem.modulos[0];
const fator1 = calcularFatorModulo(mod1);
// chC = 60+30+30+50+100 = 270, chComp = 60, chD = 50+30 = 80, chE = 0
// fator = 270/410 + (60/410)*(1/3) = 0.6585 + 0.0488 = 0.7073
assert.strictEqual(fator1.chC, 270, "chC deveria ser 270");
assert.strictEqual(fator1.chComp, 60, "chComp deveria ser 60");
assert.strictEqual(fator1.chD, 80, "chD deveria ser 80");
assert.strictEqual(fator1.chE, 0, "chE deveria ser 0");
assert.ok(Math.abs(fator1.fator - 0.7073) < 0.001, `Fator deveria ser ~0.7073, mas foi ${fator1.fator}`);
console.log("✅ Teste 1 passou\n");

// Teste 2: Cálculo do fator do Módulo II (todas dispensadas ou complementares)
console.log("Teste 2: Fator do Módulo II (todas dispensadas ou complementares)");
const mod2 = CURSOS.enfermagem.modulos[1];
const fator2 = calcularFatorModulo(mod2);
// chComp = 140+30 = 170, chD = 120+40+110 = 270
// fator = 0 + (170/440)*(1/3) = 0.1288
assert.strictEqual(fator2.chC, 0, "chC deveria ser 0");
assert.strictEqual(fator2.chComp, 170, "chComp deveria ser 170");
assert.strictEqual(fator2.chD, 270, "chD deveria ser 270");
assert.ok(Math.abs(fator2.fator - 0.1288) < 0.001, `Fator deveria ser ~0.1288, mas foi ${fator2.fator}`);
assert.strictEqual(fator2.dispensadoTotal, false, "Módulo não está totalmente dispensado");
console.log("✅ Teste 2 passou\n");

// Teste 3: Cálculo do fator do Módulo III (com ementas)
console.log("Teste 3: Fator do Módulo III (com ementas)");
const mod3 = CURSOS.enfermagem.modulos[2];
const fator3 = calcularFatorModulo(mod3);
// chE = 130+60 = 190, chD = 60+100 = 160
// fator = 0 + 0 + (190/350)*(1/3) = 0.1810
assert.strictEqual(fator3.chC, 0, "chC deveria ser 0");
assert.strictEqual(fator3.chComp, 0, "chComp deveria ser 0");
assert.strictEqual(fator3.chD, 160, "chD deveria ser 160");
assert.strictEqual(fator3.chE, 190, "chE deveria ser 190");
assert.ok(Math.abs(fator3.fator - 0.1810) < 0.001, `Fator deveria ser ~0.1810, mas foi ${fator3.fator}`);
console.log("✅ Teste 3 passou\n");

// Teste 4: Módulo totalmente dispensado
console.log("Teste 4: Módulo totalmente dispensado");
const modDispensado = {
  id: "modTest",
  tag: "Módulo Teste",
  totalCH: 200,
  disciplinas: [
    { id: "disc1", nome: "Disciplina 1", ch: 100, def: "dispensada" },
    { id: "disc2", nome: "Disciplina 2", ch: 100, def: "dispensada" }
  ]
};
estado = { disc1: "dispensada", disc2: "dispensada" };
const fatorDisp = calcularFatorModulo(modDispensado);
assert.strictEqual(fatorDisp.fator, 0, "Fator deveria ser 0");
assert.strictEqual(fatorDisp.dispensadoTotal, true, "Deveria estar totalmente dispensado");
console.log("✅ Teste 4 passou\n");

// Teste 5: Módulo totalmente cursado
console.log("Teste 5: Módulo totalmente cursado");
const modCursar = {
  id: "modTest2",
  tag: "Módulo Teste 2",
  totalCH: 300,
  disciplinas: [
    { id: "disc3", nome: "Disciplina 3", ch: 150, def: "cursar" },
    { id: "disc4", nome: "Disciplina 4", ch: 150, def: "cursar" }
  ]
};
estado = { disc3: "cursar", disc4: "cursar" };
const fatorCursar = calcularFatorModulo(modCursar);
assert.strictEqual(fatorCursar.fator, 1, "Fator deveria ser 1");
assert.strictEqual(fatorCursar.dispensadoTotal, false, "Não deveria estar dispensado");
console.log("✅ Teste 5 passou\n");

// Teste 6: Formatação de valores monetários
console.log("Teste 6: Formatação de valores monetários");
assert.strictEqual(fmt(370), "R$ 370,00", "Deveria formatar 370 corretamente");
assert.strictEqual(fmt(1234.56), "R$ 1.234,56", "Deveria formatar 1234.56 corretamente");
assert.strictEqual(fmt(0), "R$ 0,00", "Deveria formatar 0 corretamente");
console.log("✅ Teste 6 passou\n");

// Teste 7: Validação de formulário (simulada)
console.log("Teste 7: Validação de formulário");
function validarFormularioSimulado(nome, matricula, mensalidade, valMatricula) {
  const erros = [];
  if (!nome) erros.push("Nome do aluno é obrigatório");
  if (!matricula) erros.push("Matrícula é obrigatória");
  if (isNaN(mensalidade) || mensalidade <= 0) erros.push("Mensalidade deve ser um valor positivo");
  if (isNaN(valMatricula) || valMatricula < 0) erros.push("Valor da matrícula deve ser zero ou positivo");
  return erros;
}

const erros1 = validarFormularioSimulado("", "ENF123", 370, 370);
assert.strictEqual(erros1.length, 1, "Deveria ter 1 erro");
assert.strictEqual(erros1[0], "Nome do aluno é obrigatório");

const erros2 = validarFormularioSimulado("João", "", 370, 370);
assert.strictEqual(erros2.length, 1, "Deveria ter 1 erro");

const erros3 = validarFormularioSimulado("João", "ENF123", -100, 370);
assert.strictEqual(erros3.length, 1, "Deveria ter 1 erro");

const erros4 = validarFormularioSimulado("João", "ENF123", 370, 370);
assert.strictEqual(erros4.length, 0, "Não deveria ter erros");
console.log("✅ Teste 7 passou\n");

// Teste 8: Cálculo de parcelas
console.log("Teste 8: Cálculo total de parcelas");
initEstado();
const mensalidade = 370;
const valMatricula = 370;
let totalGeral = valMatricula;

CURSOS.enfermagem.modulos.forEach(mod => {
  const r = calcularFatorModulo(mod);
  const numP = mod.disciplinas.length > 0 ? 9 : 0;
  if (!r.dispensadoTotal) {
    const vp = Math.round(mensalidade * r.fator * 100) / 100;
    const totalMod = Math.round(vp * numP * 100) / 100;
    totalGeral += totalMod;
  }
});

const parcelasGeral = Math.ceil(totalGeral / mensalidade);
assert.ok(parcelasGeral > 0, "Deveria ter pelo menos 1 parcela");
assert.ok(totalGeral > valMatricula, "Total deveria ser maior que valor da matrícula");
console.log(`   Total calculado: ${fmt(totalGeral)} em ${parcelasGeral} parcelas`);
console.log("✅ Teste 8 passou\n");

console.log("🎉 Todos os testes passaram com sucesso!");
