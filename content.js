// Configurações padrão
const defaultConfig = {
    highlightColor: 'rgba(75, 206, 151, 0.2)',
    highlightBorder: '2px solid #4bce97',
    exportFileName: 'trello-cards-concluidos.md',
    checkIconSelector: 'path[fill="currentcolor"][d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m12.326-2.52-1.152-.96L6.75 9.828 4.826 7.52l-1.152.96 2.5 3a.75.75 0 0 0 1.152 0z"]',
    saveFile: true,  // Padrão: salvar arquivo
    copyToClipboard: true  // Padrão: copiar para área de transferência
  };
  
  // Estado da extensão
  const state = {
    selectedItems: [],
    config: { ...defaultConfig }
  };
  
  // Carrega configurações salvas
  function loadConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['config'], (result) => {
        state.config = { ...defaultConfig, ...result.config };
        resolve();
      });
    });
  }
  
  // Encontra todos os cards concluídos
  function findCompletedCards() {
    const checkIcons = Array.from(document.querySelectorAll(state.config.checkIconSelector));
    return checkIcons.map(icon => {
      let card = icon;
      while (card && !card.matches('[data-testid="card-done-state"]') && card.tagName !== 'BODY') {
        card = card.parentElement;
      }
      return card;
    }).filter(card => card && card.tagName !== 'BODY');
  }
  
  // Seleciona automaticamente os cards concluídos
  function autoSelectCompleted() {
    state.selectedItems = [];
    const completedCards = findCompletedCards();
    
    completedCards.forEach(card => {
      const itemId = card.id || `card-${Math.random().toString(36).substr(2, 9)}`;
      if (!card.id) card.id = itemId;
      
      const linkElement = card.querySelector('a[data-testid="card-name"]');
      const title = linkElement?.textContent.trim() || 'Card sem título';
      const description = linkElement?.textContent.trim() || 'Sem descrição';
      const href = linkElement?.getAttribute('href') || '';
      const code = href.match(/\/(\d+)-/)?.[1] || 'Sem código associado';
      
      highlightElement(card);
      state.selectedItems.push({
        id: itemId,
        title,
        description,
        code,
        element: card
      });
    });
    
    showNotification(`${completedCards.length} cards concluídos encontrados`);
  }
  
  // Limpa a seleção dos cards (desmarcando os concluídos)
  function clearSelection() {
    // Configuração do ícone de concluído
    const CHECK_ICON_SELECTOR = 'path[fill="currentcolor"][d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m12.326-2.52-1.152-.96L6.75 9.828 4.826 7.52l-1.152.96 2.5 3a.75.75 0 0 0 1.152 0z"]';

    // Função para encontrar cards concluídos e extrair seus IDs
    function findCompletedCards() {
    const checkIcons = Array.from(document.querySelectorAll(CHECK_ICON_SELECTOR));
    return checkIcons.map(icon => {
        let card = icon;
        while (card && !card.matches('[data-testid="card-done-state"]') && card.tagName !== 'BODY') {
        card = card.parentElement;
        }
        return card;
    }).filter(card => card && card.tagName !== 'BODY');
    }

    // Função para clicar no botão de conclusão de um card específico
    function clickCardCompletionButton(cardId) {
    const cardElement = document.getElementById(cardId);
    if (cardElement) {
        const button = cardElement.querySelector('button[data-testid="card-done-state-completion-button"]');
        if (button) {
        button.click();
        console.log(`✅ Botão de conclusão clicado para o card ${cardId}`);
        } else {
        console.log(`⚠️ Botão de conclusão não encontrado no card ${cardId}`);
        }
    } else {
        console.log(`❌ Card com ID ${cardId} não encontrado`);
    }
    }

    // Função principal para processar TODOS os cards concluídos
    function processAllCompletedCards() {
    const cards = findCompletedCards();
    
    if (cards.length === 0) {
        console.log('Nenhum card concluído encontrado!');
        return;
    }
    
    console.log(`🔎 Encontrados ${cards.length} cards concluídos. Processando...`);
    
    // Itera sobre TODOS os cards encontrados
    cards.forEach(card => {
        const cardId = card.id;
        clickCardCompletionButton(cardId);
    });
    
    console.log('✔️ Todos os cards concluídos foram processados!');
    }

    // Executa a função
    processAllCompletedCards();
  }
  
  // Gera o conteúdo do commit para GitHub
  function generateCommitContent() {
    if (state.selectedItems.length === 0) {
      return "Nenhum card concluído encontrado";
    }
    
    let content = `# Itens Concluídos - ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    content += `Atualização de status: ${state.selectedItems.length} tarefas concluídas\n\n`;
    
    state.selectedItems.forEach((item, index) => {
      content += `## ${index + 1}. ${item.title}\n`;
      content += `Código: ${item.code}\n`;
    });
    
    return content;
  }
  
  // Exporta os cards concluídos com base nas configurações
  async function exportCompletedCards() {
    await loadConfig(); // Carrega as configurações antes de exportar
    autoSelectCompleted(); // Atualiza a seleção
    
    if (state.selectedItems.length === 0) {
      showNotification('Nenhum card concluído encontrado');
      return;
    }
    
    const content = generateCommitContent();
    const actions = [];
  
    if (state.config.copyToClipboard) {
      actions.push(
        navigator.clipboard.writeText(content)
          .then(() => 'Copiado para área de transferência')
          .catch(err => {
            console.error('Erro ao copiar:', err);
            return 'Erro ao copiar para área de transferência';
          })
      );
    }
  
    if (state.config.saveFile) {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = state.config.exportFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      actions.push(Promise.resolve('Arquivo salvo'));
    }
  
    Promise.all(actions).then(results => {
      showNotification(`${state.selectedItems.length} cards processados: ${results.join(', ')}`);
    });
  }
  
  // Funções auxiliares
  function highlightElement(element) {
    element.style.backgroundColor = state.config.highlightColor;
    element.style.border = state.config.highlightBorder;
    element.style.padding = '8px';
    element.style.margin = '5px 0';
    element.style.borderRadius = '4px';
  }
  
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '12px 16px';
    notification.style.background = '#4bce97';
    notification.style.color = 'white';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '10000';
    notification.style.fontFamily = 'Arial, sans-serif';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
  
  // Atalhos de teclado
  document.addEventListener('keydown', async (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        console.log('DD' );
      clearSelection();
    } else if (e.altKey && e.key.toLowerCase() === 's') {
      await exportCompletedCards();
    }
  });
  
  // Inicialização
  console.log('Extensão TrelloX carregada!');
  loadConfig().then(autoSelectCompleted);
  