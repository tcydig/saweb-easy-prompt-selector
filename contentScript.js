
console.log("🚀 contentScript loaded");
if (typeof chrome?.runtime?.getURL === 'function') {
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = chrome.runtime.getURL("content.css");
  document.head.appendChild(style);
} else {
  console.warn("❗ chrome.runtime.getURL is not available. Check script context.");
}
// ✅ 1. モーダルUIとトグルボタンをページに挿入する関数
function insertModalAndButton() {
  console.log("🧠 insertModalAndButton called");
  const targetLabel = document.querySelector('span.switch-btn-label');
  if (!targetLabel || document.getElementById('saweb-toggle-modal-btn')) return;

  // 🔘 トグルボタン
  const button = document.createElement('button');
  button.textContent = '🧠';
  button.id = 'saweb-toggle-modal-btn';
  button.title = 'プロンプトを開く';
  button.style.marginRight = '8px';
  button.style.padding = '4px 8px';
  button.style.fontSize = '14px';
  button.style.cursor = 'pointer';
  targetLabel.parentElement.insertBefore(button, targetLabel);

  // 📦 モーダルHTML
  const modal = document.createElement('div');
  modal.id = 'saweb-modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <span>プロンプト選択</span>
        <button class="modal-close">✕</button>
      </div>
      <div class="modal-body">
        <label class="saweb-top">
          <input type="checkbox" id="negativeMode" />
          ネガティブに追加
        </label>
        <select id="fileSelector">
          <option value="">ファイルを選択</option>
        </select>
        <div id="promptContainer"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  console.log("✅ モーダルDOM生成済み")

  // ✅ CSS読み込み
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = chrome.runtime.getURL("content.css");
  document.head.appendChild(style);

  // ✅ ドラッグ移動対応
  enableModalDragging(
    modal.querySelector('.modal-content'),
    modal.querySelector('.modal-header')
  );

  // ✅ イベント
  // button.addEventListener('click', () => modal.classList.add('show'));
  button.addEventListener('click', () => {
    console.log("🧠 ボタンクリックされた！");
    modal.classList.add('show');
  });
  modal.querySelector('.modal-close').addEventListener('click', () => modal.classList.remove('show'));
  modal.querySelector('.modal-overlay').addEventListener('click', () => modal.classList.remove('show'));

  loadPromptData();
}

// ✅ ドラッグ対応処理
function enableModalDragging(modal, handle) {
  let isDragging = false, offsetX = 0, offsetY = 0;

  handle.style.cursor = 'move';
  handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = modal.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    modal.style.position = 'fixed';
    modal.style.margin = '0';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    modal.style.left = `${e.clientX - offsetX}px`;
    modal.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

// ✅ 2. YAMLロード処理（省略なし）
let allPromptData = {};

function loadPromptData() {
  chrome.storage.local.get(null, (data) => {
    allPromptData = data;

    const selector = document.getElementById('fileSelector');
    if (!selector) return;

    selector.innerHTML = '<option value="">ファイルを選択</option>';
    for (const fileName in data) {
      const option = document.createElement('option');
      option.value = fileName;
      option.textContent = fileName;
      selector.appendChild(option);
    }

    const firstFile = Object.keys(data)[0];
    if (firstFile) {
      selector.value = firstFile;
      renderPrompts(firstFile);
    }

    selector.addEventListener('change', (e) => {
      renderPrompts(e.target.value);
    });
  });
}

// ✅ 3. プロンプト描画処理（そのまま）
function renderPrompts(fileName) {
  const container = document.getElementById('promptContainer');
  container.innerHTML = '';

  if (!fileName || !allPromptData[fileName]) return;
  const fileContent = allPromptData[fileName];

  for (const midKey in fileContent) {
    const midValue = fileContent[midKey];

    if (typeof midValue === 'string') {
      let directRow = container.querySelector('.button-row-direct');
      if (!directRow) {
        directRow = document.createElement('div');
        directRow.className = 'button-row button-row-direct';
        container.appendChild(directRow);
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
        } else if (typeof subValue === 'object') {
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

      container.appendChild(midDiv);
    }
  }
}

// ✅ 4. ボタンクリックでプロンプト挿入
function createPromptButton(label, value) {
  const button = document.createElement('button');
  button.textContent = label;
  button.className = 'prompt-button';

  button.addEventListener('click', () => {
    const isNegative = document.getElementById('negativeMode')?.checked;

    const insertPrompt = (textarea, prompt) => {
      if (!textarea) return;
      const current = textarea.value.trim();
      textarea.value = current ? `${current}, ${prompt}` : prompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    };

    if (isNegative) {
      const negLabel = Array.from(document.querySelectorAll('label')).find(label =>
        label.textContent.trim() === 'Negative Prompts'
      );
      const negTextarea = negLabel?.closest('.h-item')?.querySelector('textarea');
      insertPrompt(negTextarea, value);
    } else {
      const posInput = document.querySelector('#generateInput');
      insertPrompt(posInput, value);
    }
  });

  return button;
}

// ✅ 5. DOMが揃ったら自動挿入（MutationObserver）
const observer = new MutationObserver(() => {
  insertModalAndButton();
});
observer.observe(document.body, { childList: true, subtree: true });
