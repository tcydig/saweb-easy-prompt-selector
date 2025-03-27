chrome.storage.local.get('prompts', (data) => {
  const prompts = data.prompts || {};
  const container = document.getElementById('promptContainer');

  for (const categoryName in prompts) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';

    const catLabel = document.createElement('h4');
    catLabel.textContent = categoryName;
    categoryDiv.appendChild(catLabel);

    const items = prompts[categoryName];
    for (const label in items) {
      const value = items[label];
      const button = createPromptButton(label, value);
      categoryDiv.appendChild(button);
    }

    container.appendChild(categoryDiv);
  }
});

function createPromptButton(label, value) {
  const button = document.createElement('button');
  button.textContent = label;
  button.className = 'prompt-button';

  button.addEventListener('click', async () => {
    const isNegative = document.getElementById('negativeMode').checked;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (prompt, isNeg) => {
        const insertPrompt = (textarea, prompt) => {
          if (!textarea) return;
          const current = textarea.value.trim();
          textarea.value = current ? `${current}, ${prompt}` : prompt;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        };
    
        if (isNeg) {
          // ネガティブラベルを見つけて、その中のtextareaに追加
          const negLabel = Array.from(document.querySelectorAll('label')).find(label =>
            label.textContent.trim() === 'Negative Prompts'
          );
          const negTextarea = negLabel?.closest('.h-item')?.querySelector('textarea');
          insertPrompt(negTextarea, prompt);
        } else {
          // ポジティブ欄はIDでOK
          const posInput = document.querySelector('#generateInput');
          insertPrompt(posInput, prompt);
        }
      },
      args: [value, isNegative]
    });    
  });

  return button;
}
