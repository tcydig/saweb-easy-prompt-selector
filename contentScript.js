console.log("🚀 contentScript loaded");
if (typeof chrome?.runtime?.getURL === 'function') {
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = chrome.runtime.getURL("content.css");
  document.head.appendChild(style);
  console.log("✅ スタイルシート読み込み完了");
} else {
  console.warn("❗ chrome.runtime.getURL is not available. Check script context.");
}

// 全データを保持する変数
let allPromptData = {};

// ✅ 1. フローティングパネルとトグルボタンをページに挿入する関数
function insertPanelAndButton() {
  console.log("🧠 insertPanelAndButton called");
  const targetLabel = document.querySelector('span.switch-btn-label');

  console.log("🔍 Target label found:", targetLabel);
  console.log("🔍 Existing button:", document.getElementById('saweb-toggle-modal-btn'));

  if (!targetLabel || document.getElementById('saweb-toggle-modal-btn')) {
    console.log("⚠️ Target not found or button already exists. Exiting.");
    return;
  }

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
  console.log("✅ ボタン生成済み");

  // 📦 フローティングパネルを作成
  const panelContent = document.createElement('div');
  panelContent.className = 'saweb-panel-content';
  panelContent.style.cssText = `
    position: fixed !important;
    top: 100px !important;
    right: 20px !important;
    width: 400px !important;
    background: #1e1e1e !important;
    border: 1px solid #555 !important;
    border-radius: 8px !important;
    padding: 16px !important;
    color: #eee !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
    z-index: 2147483647 !important;
    max-height: 80vh !important;
    overflow-y: auto !important;
    display: none !important;
  `;

  panelContent.innerHTML = `
    <div class="panel-header" style="display: flex !important; justify-content: space-between !important; align-items: center !important; font-weight: bold !important; margin-bottom: 12px !important; cursor: move !important;">
      <span>プロンプト選択</span>
      <button class="panel-close" style="background: none !important; color: #eee !important; border: none !important; font-size: 18px !important; cursor: pointer !important;">✕</button>
    </div>
    <div class="panel-body">
      <label class="saweb-top" style="display: flex !important; align-items: center !important; margin-bottom: 10px !important; font-size: 14px !important;">
        <input type="checkbox" id="negativeMode" />
        ネガティブに追加
      </label>
      <select id="fileSelector" style="background-color: #2a2a2a !important; color: #eee !important; border: 1px solid #555 !important; border-radius: 6px !important; padding: 8px 12px !important; font-size: 14px !important; width: 100% !important; margin-bottom: 12px !important; appearance: none !important; outline: none !important;">
        <option value="">ファイルを選択</option>
      </select>
      <div id="promptContainer"></div>
    </div>
  `;

  document.body.appendChild(panelContent);
  console.log("✅ パネル生成済み");

  // ✅ ドラッグ移動対応
  enablePanelDragging(
    panelContent,
    panelContent.querySelector('.panel-header')
  );

  // ✅ イベント
  let panelVisible = false;

  button.addEventListener('click', (e) => {
    console.log("🧠 ボタンクリックされた！");
    e.preventDefault();
    e.stopPropagation();

    panelVisible = !panelVisible;

    if (panelVisible) {
      panelContent.style.setProperty('display', 'block', 'important');
      console.log("🔍 パネル表示");
    } else {
      panelContent.style.setProperty('display', 'none', 'important');
      console.log("🔍 パネル非表示");
    }

    // デバッグ情報
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(panelContent);
      console.log("パネル計算済みスタイル:", {
        display: computedStyle.display,
        position: computedStyle.position,
        zIndex: computedStyle.zIndex,
        top: computedStyle.top,
        right: computedStyle.right,
        width: computedStyle.width
      });

      const rect = panelContent.getBoundingClientRect();
      console.log("画面上の位置:", {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }, 100);
  });

  panelContent.querySelector('.panel-close').addEventListener('click', () => {
    console.log("❌ 閉じるボタンがクリックされました");
    panelContent.style.setProperty('display', 'none', 'important');
    panelVisible = false;
  });

  loadPromptData();
}

// ✅ ドラッグ対応処理 - 修正版
function enablePanelDragging(panel, handle) {
  let isDragging = false, startX = 0, startY = 0;
  let startPosX = 0, startPosY = 0;

  handle.style.cursor = 'move';

  handle.addEventListener('mousedown', (e) => {
    isDragging = true;

    // ドラッグ開始位置
    startX = e.clientX;
    startY = e.clientY;

    // パネルの現在位置を取得
    const rect = panel.getBoundingClientRect();
    startPosX = rect.left;
    startPosY = rect.top;

    console.log("🖱️ ドラッグ開始", { x: startX, y: startY, panelX: startPosX, panelY: startPosY });

    // ドラッグ中はテキスト選択を防止
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    // マウスの移動量を計算
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // パネル位置を更新
    panel.style.setProperty('left', `${startPosX + dx}px`, 'important');
    panel.style.setProperty('top', `${startPosY + dy}px`, 'important');
    panel.style.setProperty('right', 'auto', 'important');
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      console.log("🖱️ ドラッグ終了");
      isDragging = false;
    }
  });
}

// ✅ 2. YAMLデータ読み込み処理 (popup.jsからの移植)
function loadPromptData() {
  console.log("📂 loadPromptData関数が呼び出されました");

  try {
    chrome.storage.local.get(null, (data) => {
      console.log("📂 chrome.storage.local.getの結果:", data);

      // データが空かどうかをチェック
      if (!data || Object.keys(data).length === 0) {
        console.warn("⚠️ ストレージにデータがありません");

        // テスト用の初期データ（サンプル）
        const sampleData = {
          "サンプルファイル.yaml": {
            "基本カテゴリ": {
              "風景": {
                "森": "beautiful forest, trees, nature",
                "海": "beautiful ocean, waves, beach"
              },
              "スタイル": {
                "写実的": "photorealistic, detailed",
                "漫画風": "cartoon style, anime"
              }
            },
            "直接プロンプト": "basic prompt example"
          }
        };

        // サンプルデータをストレージに保存
        chrome.storage.local.set(sampleData, () => {
          console.log("✅ サンプルデータを保存しました");
          // 再帰的に関数を呼び出してデータを読み込む
          loadPromptData();
        });

        return;
      }

      // データ処理を継続
      allPromptData = data;

      const selector = document.getElementById('fileSelector');
      if (!selector) {
        console.error("❌ fileSelector要素が見つかりません");
        return;
      }

      console.log("📂 セレクターに入力するファイル名:", Object.keys(data));

      // セレクターのオプションをクリア
      selector.innerHTML = '<option value="">ファイルを選択</option>';

      // データをセレクターに追加
      for (const fileName in data) {
        const option = document.createElement('option');
        option.value = fileName;
        option.textContent = fileName;
        selector.appendChild(option);
        console.log(`📂 オプション追加: ${fileName}`);
      }

      // 最初のファイルを選択
      const firstFile = Object.keys(data)[0];
      if (firstFile) {
        console.log(`📂 最初のファイルを選択: ${firstFile}`);
        selector.value = firstFile;
        renderPrompts(firstFile);
      }

      // セレクター変更イベントのリスナー設定
      selector.addEventListener('change', (e) => {
        console.log(`📂 セレクター変更: ${e.target.value}`);
        renderPrompts(e.target.value);
      });
    });
  } catch (error) {
    console.error("❌ chrome.storage.localアクセスでエラーが発生しました:", error);
  }
}

// ✅ 3. プロンプト描画処理 (popup.jsからの移植)
function renderPrompts(fileName) {
  console.log(`🖌️ renderPrompts called with fileName: ${fileName}`);

  const container = document.getElementById('promptContainer');
  if (!container) {
    console.error("❌ promptContainer要素が見つかりません");
    return;
  }

  // コンテナをクリア
  container.innerHTML = '';

  if (!fileName || !allPromptData[fileName]) {
    console.warn(`⚠️ ファイル「${fileName}」のデータが見つかりません`);
    container.innerHTML = '<p style="color:#f88;">選択されたファイルのデータがありません</p>';
    return;
  }

  console.log(`🖌️ ファイル「${fileName}」の内容:`, allPromptData[fileName]);
  const fileContent = allPromptData[fileName];

  for (const midKey in fileContent) {
    const midValue = fileContent[midKey];

    if (typeof midValue === 'string') {
      let directRow = container.querySelector('.button-row-direct');
      if (!directRow) {
        directRow = document.createElement('div');
        directRow.className = 'button-row button-row-direct';
        directRow.style.cssText = 'display: flex !important; flex-wrap: wrap !important; gap: 8px !important;';
        container.appendChild(directRow);
      }
      const btn = createPromptButton(midKey, midValue);
      directRow.appendChild(btn);
    }

    else if (typeof midValue === 'object') {
      const midDiv = document.createElement('div');
      midDiv.className = 'mid-category';
      midDiv.style.cssText = 'border: 1px solid #555 !important; padding: 14px !important; border-radius: 6px !important; background-color: #1a1a1a !important; display: flex !important; flex-direction: column !important; gap: 10px !important; margin-bottom: 12px !important;';

      const midLabel = document.createElement('h4');
      midLabel.textContent = midKey;
      midLabel.style.cssText = 'background-color: #f90 !important; color: #000 !important; padding: 8px 12px !important; margin: 0 !important; border-radius: 4px !important; font-size: 16px !important;';
      midDiv.appendChild(midLabel);

      const midButtonRow = document.createElement('div');
      midButtonRow.className = 'button-row';
      midButtonRow.style.cssText = 'display: flex !important; flex-wrap: wrap !important; gap: 8px !important;';

      for (const subKey in midValue) {
        const subValue = midValue[subKey];

        if (typeof subValue === 'string') {
          const btn = createPromptButton(subKey, subValue);
          midButtonRow.appendChild(btn);
        } else if (typeof subValue === 'object') {
          const subDiv = document.createElement('div');
          subDiv.className = 'sub-category';
          subDiv.style.cssText = 'border: 1px solid #444 !important; padding: 10px !important; border-radius: 5px !important; background-color: #252525 !important; display: flex !important; flex-direction: column !important; gap: 8px !important;';

          const subLabel = document.createElement('h5');
          subLabel.textContent = subKey;
          subLabel.style.cssText = 'background-color: #fbb040 !important; color: #000 !important; padding: 6px 10px !important; margin: 0 !important; border-radius: 4px !important; font-size: 14px !important;';
          subDiv.appendChild(subLabel);

          const buttonRow = document.createElement('div');
          buttonRow.className = 'button-row';
          buttonRow.style.cssText = 'display: flex !important; flex-wrap: wrap !important; gap: 8px !important;';

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
  button.style.cssText = 'background-color: #333 !important; color: #eee !important; border: 1px solid #666 !important; padding: 6px 12px !important; border-radius: 4px !important; cursor: pointer !important; font-size: 14px !important; transition: background 0.2s !important; flex-shrink: 0 !important; width: auto !important; align-self: flex-start !important;';

  button.addEventListener('click', () => {
    console.log(`🔘 プロンプトボタンがクリックされました: ${label}`);
    const isNegative = document.getElementById('negativeMode')?.checked;
    console.log(`🔘 ネガティブモード: ${isNegative}`);

    const insertPrompt = (textarea, prompt) => {
      if (!textarea) {
        console.error("❌ 対象の入力フィールドが見つかりません");
        return;
      }
      const current = textarea.value.trim();
      textarea.value = current ? `${current}, ${prompt}` : prompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      console.log(`✅ プロンプトを挿入しました: ${prompt}`);
    };

    if (isNegative) {
      const negLabel = Array.from(document.querySelectorAll('label')).find(label =>
        label.textContent.trim() === 'Negative Prompts'
      );
      if (!negLabel) {
        console.error("❌ 'Negative Prompts'ラベルが見つかりません");
      }
      const negTextarea = negLabel?.closest('.h-item')?.querySelector('textarea');
      insertPrompt(negTextarea, value);
    } else {
      const posInput = document.querySelector('#generateInput');
      insertPrompt(posInput, value);
    }
  });

  return button;
}

// 重要: 初期実行を追加
console.log("🔄 初期実行を試みます");
setTimeout(() => {
  console.log("⏱️ 遅延実行開始");
  insertPanelAndButton();
}, 1000);

// ✅ 5. DOMが揃ったら自動挿入（MutationObserver）
const observer = new MutationObserver(() => {
  insertPanelAndButton();
});
observer.observe(document.body, { childList: true, subtree: true });
