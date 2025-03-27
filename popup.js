
// 全データを一度だけ取得しておく
let allPromptData = {};

chrome.storage.local.get(null, (data) => {
  allPromptData = data;

  const selector = document.getElementById('fileSelector');
  selector.innerHTML = '<option value="">ファイルを選択</option>';

  for (const fileName in data) {
    const option = document.createElement('option');
    option.value = fileName;
    option.textContent = fileName;
    selector.appendChild(option);
  }

  // 初期表示：最初のファイルがあればそれを選択
  const firstFile = Object.keys(data)[0];
  if (firstFile) {
    selector.value = firstFile;
    renderPrompts(firstFile);
  }

  // イベント：選択されたら描画
  selector.addEventListener('change', (e) => {
    const selectedFile = e.target.value;
    renderPrompts(selectedFile);
  });
});

function renderPrompts(fileName) {
  const container = document.getElementById('promptContainer');
  container.innerHTML = '';

  if (!fileName || !allPromptData[fileName]) return;

  const fileContent = allPromptData[fileName];

  const wrapper = document.createElement('div');
  wrapper.className = 'category-wrapper';

  const content = document.createElement('div');
  content.className = 'category-content open';

  for (const midKey in fileContent) {
    const midValue = fileContent[midKey];

    if (typeof midValue === 'string') {
      let directRow = content.querySelector('.button-row-direct');
      if (!directRow) {
        directRow = document.createElement('div');
        directRow.className = 'button-row button-row-direct';
        content.appendChild(directRow);
      }
      const btn = createPromptButton(midKey, midValue);
      directRow.appendChild(btn);
    }

    else if (typeof midValue === 'object') {
      const midDiv = document.createElement('div');
      midDiv.className = 'mid-category';

      const midLabel = document.createElement('h4');
      midLabel.textContent = midKey;
      midDiv.appendChild(midLabel);

      const midButtonRow = document.createElement('div');
      midButtonRow.className = 'button-row';

      for (const subKey in midValue) {
        const subValue = midValue[subKey];

        if (typeof subValue === 'string') {
          const btn = createPromptButton(subKey, subValue);
          midButtonRow.appendChild(btn);
        }

        else if (typeof subValue === 'object') {
          const subDiv = document.createElement('div');
          subDiv.className = 'sub-category';

          const subLabel = document.createElement('h5');
          subLabel.textContent = subKey;
          subDiv.appendChild(subLabel);

          const buttonRow = document.createElement('div');
          buttonRow.className = 'button-row';

          for (const label in subValue) {
            const value = subValue[label];
            if (typeof value === 'string') {
              const subBtn = createPromptButton(label, value);
              buttonRow.appendChild(subBtn);
            }
          }

          subDiv.appendChild(buttonRow);
          midDiv.appendChild(subDiv);
        }
      }

      if (midButtonRow.childNodes.length > 0) {
        midDiv.appendChild(midButtonRow);
      }

      content.appendChild(midDiv);
    }
  }

  wrapper.appendChild(content);
  container.appendChild(wrapper);
}

function createPromptButton(label, value) {
  const button = document.createElement('button');
  button.textContent = label;
  button.className = 'prompt-button';

  button.addEventListener('click', async () => {
    const isNegative = document.getElementById('negativeMode')?.checked;
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
          const negLabel = Array.from(document.querySelectorAll('label')).find(label =>
            label.textContent.trim() === 'Negative Prompts'
          );
          const negTextarea = negLabel?.closest('.h-item')?.querySelector('textarea');
          insertPrompt(negTextarea, prompt);
        } else {
          const posInput = document.querySelector('#generateInput');
          insertPrompt(posInput, prompt);
        }
      },
      args: [value, isNegative]
    });
  });

  return button;
}
