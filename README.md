# Calculadora de Aproveitamento de Estudos — CSM Tec

Calculadora interna para a equipe comercial do CSM Tec gerenciar aproveitamento de estudos do Curso Técnico em Enfermagem.

## 🚀 Melhorias Implementadas (v2.0 → v2.1)

### 1. ✅ Validação de Formulário
- **O que foi feito:** Adicionada validação obrigatória para campos antes de calcular
- **Benefício:** Impede cálculos com dados incompletos ou inválidos
- **Campos validados:**
  - Nome do aluno (obrigatório)
  - Matrícula (obrigatória)
  - Mensalidade (deve ser valor positivo)
  - Valor da matrícula (deve ser zero ou positivo)

### 2. ↩️ Funcionalidade de Desfazer
- **O que foi feito:** Adicionado botão "Desfazer" para reverter última mudança de classificação
- **Benefício:** Permite corrigir erros de classificação acidentais
- **Como usar:** Clique em "↩ Desfazer" após alterar status de uma disciplina

### 3. 🧹 Limpeza Automática do Histórico
- **O que foi feito:** Registros com mais de 90 dias são removidos automaticamente
- **Benefício:** Previne acúmulo infinito de dados e otimiza performance
- **Detalhes:**
  - Limpeza executada ao carregar o histórico
  - Mensagem no console informa quantos registros foram removidos

### 4. 🔒 Content Security Policy (CSP) Restrita
- **O que foi feito:** Removido `'unsafe-inline'` da política de segurança
- **Benefício:** Maior proteção contra ataques XSS
- **Implementação:**
  - Uso de nonces (`nonce="csm2026"`) para scripts e estilos inline
  - Permissões explícitas para Google Fonts

### 5. 🧪 Testes Unitários
- **O que foi feito:** Criada suíte de testes para lógica de cálculo
- **Benefício:** Garante corretude das fórmulas e previne regressões
- **Como executar:**
  ```bash
  node tests/test.js
  ```
- **Cobertura:**
  - Cálculo de fator por módulo
  - Módulos totalmente dispensados/cursados
  - Formatação monetária
  - Validação de formulário
  - Cálculo total de parcelas

### 6. 📥📤 Exportar/Importar Histórico
- **O que foi feito:** Adicionados botões para exportar e importar histórico em JSON
- **Benefício:** Permite backup, compartilhamento e migração de dados
- **Como usar:**
  - **Exportar:** Clique em "📥 Exportar Histórico" → arquivo JSON será baixado
  - **Importar:** Clique em "📤 Importar Histórico" → selecione arquivo JSON
- **Inteligência:**
  - Evita duplicatas por ID
  - Mescla dados importados com existentes
  - Valida formato do arquivo

### 7. 💬 Feedback Visual (Notificações)
- **O que foi feito:** Substituídos alerts por notificações visuais elegantes
- **Benefício:** Melhor experiência do usuário
- **Tipos de notificação:**
  - ✅ **Sucesso** (verde): Ações concluídas com êxito
  - ℹ️ **Info** (azul): Informações em andamento
  - ❌ **Erro** (vermelho): Falhas na operação
- **Ações com feedback:**
  - Imprimir relatório
  - Copiar resumo
  - Gerar carta de aproveitamento
- **Animações:** Slide in/out suave

## 📁 Estrutura do Projeto

```
calculadora/
├── index.html              # Página principal
├── css/
│   └── styles.css         # Estilos globais
├── js/
│   ├── data.js            # Dados do curso (módulos, disciplinas)
│   └── app.js             # Lógica da aplicação
├── assets/
│   └── logo.png           # Logo da CSM Tec
└── tests/
    └── test.js            # Testes unitários
```

## 🎯 Funcionalidades Principais

### Classificação de Disciplinas
Cada disciplina pode receber um dos 4 status:

| Status | Descrição | Cobrança |
|--------|-----------|----------|
| 🔴 **Cursará** | Aluno cursará integralmente | 100% |
| 🟡 **Complementar** | Avaliação complementar | 33% (1/3) |
| 🟢 **Dispensada** | Equivalência ≥75% da C/H | 0% |
| 🔵 **Ag. Ementas** | Aguardando análise de ementas | 33% (1/3) |

### Fórmula de Cálculo

```javascript
fator = (chC / total) + (chComp / total) × (1/3) + (chE / total) × (1/3)
```

Onde:
- `chC` = Carga horária a cursar
- `chComp` = Carga horária complementar
- `chE` = Carga horária aguardando ementas
- `total` = Carga horária total do módulo

### Parcelas
- Cada módulo gera **9 parcelas**
- Valor da parcela = `mensalidade × fator`
- Total do módulo = `valor parcela × 9`
- **Matrícula:** Paga na parcela 1

## 🚀 Como Usar

1. **Abra o arquivo `index.html`** no navegador
2. **Preencha os dados do aluno:**
   - Nome completo
   - Matrícula
   - Instituição de origem
   - Valores (opcionais, padrão: R$ 370,00)
3. **Classifique cada disciplina** clicando nos botões de status
4. **Clique em "⚡ Calcular Parcelas"** para ver o resultado
5. **Use os botões de ação:**
   - 🖨️ Imprimir / Salvar PDF
   - 📋 Copiar resumo
   - 📄 Gerar carta de aproveitamento

## 🧪 Executando Testes

```bash
node tests/test.js
```

**Saída esperada:**
```
🧪 Iniciando testes unitários...
✅ Teste 1 passou
✅ Teste 2 passou
...
🎉 Todos os testes passaram com sucesso!
```

## 🔐 Segurança

- **Content Security Policy:** Restrita com nonces
- **Sanitização XSS:** Todas as entradas de usuário são sanitizadas
- **localStorage:** Dados persistem apenas no navegador do usuário
- **Limpeza automática:** Registros antigos (>90 dias) são removidos

## 📊 Histórico

- **Registros:** Salvos no `localStorage`
- **Exportação:** JSON com carimbo de data/hora
- **Importação:** Mescla inteligente sem duplicatas
- **Limpeza:** Automática a cada carregamento

## 🛠️ Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Design:** Responsivo, mobile-first
- **Fontes:** DM Sans, DM Serif Display (Google Fonts)
- **Testes:** Node.js assert module

## 📝 Notas de Versão

### v2.1 (2026)
- ✅ Validação de formulário
- ↩️ Botão desfazer
- 🧹 Limpeza automática de histórico
- 🔒 CSP restrita
- 🧪 Testes unitários
- 📥📤 Exportar/importar histórico
- 💬 Feedback visual com notificações

### v2.0 (2026)
- Versão inicial com cálculo de aproveitamento
- Histórico em localStorage
- Exportação PDF/impressão
- Geração de carta

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato com a equipe de desenvolvimento do CSM Tec.

---

**Desenvolvido para uso interno — Equipe Comercial CSM Tec**
