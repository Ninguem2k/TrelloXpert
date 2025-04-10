document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['config'], (result) => {
      const config = result.config || {};
      document.getElementById('saveFile').checked = config.saveFile !== false;
      document.getElementById('copyToClipboard').checked = config.copyToClipboard !== false;
    });
  
    document.getElementById('save').addEventListener('click', () => {
      const config = {
        saveFile: document.getElementById('saveFile').checked,
        copyToClipboard: document.getElementById('copyToClipboard').checked
      };
      chrome.storage.sync.set({ config }, () => {
        alert('Configurações salvas!');
      });
    });
  });