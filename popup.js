chrome.storage.local.get(null, (data) => {
  const container = document.getElementById('promptContainer');
  container.innerHTML = '';

  for (const fileName in data) {
    const fileContent = data[fileName];

    const wrapper = document.createElement('div');
    wrapper.className = 'category-wrapper';

    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `<span>${fileName}</span><span class="toggle-icon">▼</span>`;

    const content = document.createElement('div');
    content.className = 'category-content';

    header.addEventListener('click', () => {
      wrapper.classList.toggle('open');
    });

    for (const midKey in fileContent) {
      const midValue = fileContent[midKey];

      // ✅ 中カテゴリ直下のボタン（例: アニメ風、リアル）
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

      // ✅ 中カテゴリ（Object）→ 見出し＋中 or 小カテゴリ処理
      else if (typeof midValue === 'object') {
        const midDiv = document.createElement('div');
        midDiv.className = 'mid-category';

        const midLabel = document.createElement('h4');
        midLabel.textContent = midKey;
        midDiv.appendChild(midLabel);

        // ✅ 中カテゴリ直下のボタンをまとめる
        const midButtonRow = document.createElement('div');
        midButtonRow.className = 'button-row';

        for (const subKey in midValue) {
          const subValue = midValue[subKey];

          if (typeof subValue === 'string') {
            const btn = createPromptButton(subKey, subValue);
            midButtonRow.appendChild(btn);
          }

          // ✅ 小カテゴリ（Object）
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
          midDiv.appendChild(midButtonRow); // ← ボタンがあれば midDiv に追加
        }

        content.appendChild(midDiv);
      }
    }

    wrapper.appendChild(header);
    wrapper.appendChild(content);
    container.appendChild(wrapper);
  }
});

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
