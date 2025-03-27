let positivePrompts = [];
let negativePrompts = [];

function createButton(text, category, type) {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = 'prompt-button';
  button.addEventListener('click', () => {
    const list = type === 'positive' ? positivePrompts : negativePrompts;
    const index = list.indexOf(text);
    if (index === -1) {
      list.push(text);
      button.classList.add('selected');
    } else {
      list.splice(index, 1);
      button.classList.remove('selected');
    }
    updateDisplay();
  });
  return button;
}

function updateDisplay() {
  document.getElementById('positiveOutput').textContent = positivePrompts.join(', ');
  document.getElementById('negativeOutput').textContent = negativePrompts.join(', ');
}

chrome.storage.local.get('prompts', (data) => {
  const prompts = data.prompts || {};
  const container = document.getElementById('promptContainer');

  ['positive', 'negative'].forEach(type => {
    const section = document.createElement('div');
    section.className = 'prompt-section';

    const header = document.createElement('h2');
    header.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Prompts`;
    section.appendChild(header);

    const categories = prompts[type];
    if (categories) {
      for (const categoryName in categories) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';

        const catLabel = document.createElement('h4');
        catLabel.textContent = categoryName;
        categoryDiv.appendChild(catLabel);

        categories[categoryName].forEach(prompt => {
          const button = createButton(prompt, categoryName, type);
          categoryDiv.appendChild(button);
        });

        section.appendChild(categoryDiv);
      }
    }

    container.appendChild(section);
  });
});

document.getElementById('insertButton').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (positive, negative) => {
      const insert = (selector, value) => {
        const input = document.querySelector(selector);
        if (input) {
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      insert('#positivePrompt', positive); // ← 適宜SeaArtの正しいセレクタに変更
      insert('#negativePrompt', negative);
    },
    args: [positivePrompts.join(', '), negativePrompts.join(', ')]
  });
});
