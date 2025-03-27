let positivePrompts = [];
let negativePrompts = [];

function createButton(label, value) {
  const button = document.createElement('button');
  button.textContent = label;
  button.className = 'prompt-button';

  button.addEventListener('click', () => {
    const isNegative = document.getElementById('negativeMode').checked;
    const list = isNegative ? negativePrompts : positivePrompts;
    const index = list.indexOf(value);

    if (index === -1) {
      list.push(value);
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

  for (const categoryName in prompts) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';

    const catLabel = document.createElement('h4');
    catLabel.textContent = categoryName;
    categoryDiv.appendChild(catLabel);

    const items = prompts[categoryName];
    for (const label in items) {
      const value = items[label];
      const button = createButton(label, value);
      categoryDiv.appendChild(button);
    }

    container.appendChild(categoryDiv);
  }
});

document.getElementById('insertButton').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (positive, negative) => {
      const posInput = document.querySelector('#generateInput');
      const negInput = document.querySelector('textarea.el-textarea__inner:not([id])');

      if (posInput) {
        posInput.value = positive;
        posInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (negInput) {
        negInput.value = negative;
        negInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },
    args: [positivePrompts.join(', '), negativePrompts.join(', ')]
  });
});
