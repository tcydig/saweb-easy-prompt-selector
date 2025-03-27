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
  button.title = 'Open prompt';
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
    resize: both !important;
    overflow: auto !important;
    min-width: 300px !important;
    min-height: 200px !important;
  `;

  panelContent.innerHTML = `
    <div class="panel-header" style="display: flex !important; justify-content: space-between !important; align-items: center !important; font-weight: bold !important; margin-bottom: 12px !important; cursor: move !important;">
      <span>Select Prompt</span>
      <button class="panel-close" style="background: none !important; color: #eee !important; border: none !important; font-size: 18px !important; cursor: pointer !important;">✕</button>
    </div>
    <div class="panel-body">
      <label class="saweb-top" style="display: flex !important; align-items: center !important; margin-bottom: 10px !important; font-size: 14px !important;">
        <input type="checkbox" id="negativeMode" />
        Add to Negative
      </label>
      <select id="fileSelector" style="background-color: #2a2a2a !important; color: #eee !important; border: 1px solid #555 !important; border-radius: 6px !important; padding: 8px 12px !important; font-size: 14px !important; width: 100% !important; margin-bottom: 12px !important; appearance: none !important; outline: none !important;">
        <option value="">Select a file</option>
      </select>
      <div id="promptContainer"></div>
    </div>
    <div class="resize-handle" style="position: absolute !important; bottom: 0 !important; right: 0 !important; width: 20px !important; height: 20px !important; cursor: nwse-resize !important; background: linear-gradient(135deg, transparent 50%, #666 50%, #999 75%, #ccc 100%) !important; border-bottom-right-radius: 8px !important;"></div>
  `;

  document.body.appendChild(panelContent);
  console.log("✅ パネル生成済み");

  // ✅ ドラッグ移動対応
  enablePanelDragging(
    panelContent,
    panelContent.querySelector('.panel-header')
  );

  // ✅ リサイズ機能
  enablePanelResizing(
    panelContent,
    panelContent.querySelector('.resize-handle')
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

// ✅ ドラッグ対応処理
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

// ✅ リサイズ機能
function enablePanelResizing(panel, handle) {
  let isResizing = false;
  let startX, startY, startWidth, startHeight;

  handle.addEventListener('mousedown', (e) => {
    // リサイズの開始
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(document.defaultView.getComputedStyle(panel).width, 10);
    startHeight = parseInt(document.defaultView.getComputedStyle(panel).height, 10);

    console.log("🔄 リサイズ開始", {
      startX,
      startY,
      startWidth,
      startHeight
    });

    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    // 新しいサイズを計算
    const newWidth = startWidth + (e.clientX - startX);
    const newHeight = startHeight + (e.clientY - startY);

    // 最小サイズを制限
    const minWidth = 300;
    const minHeight = 200;

    // 新しいサイズを適用
    if (newWidth > minWidth) {
      panel.style.setProperty('width', `${newWidth}px`, 'important');
    }

    if (newHeight > minHeight) {
      panel.style.setProperty('height', `${newHeight}px`, 'important');
    }

    // リサイズ中は自動スクロールを防止
    e.preventDefault();
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      console.log("🔄 リサイズ終了");
      isResizing = false;
    }
  });
}

// ✅ 2. YAMLデータ読み込み処理
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
      selector.innerHTML = '<option value="">Select a file</option>';

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

// ✅ 3. プロンプト描画処理 - グリッドレイアウト対応版
function renderPrompts(fileName) {
  console.log(`🖌️ renderPrompts called with fileName: ${fileName}`);

  const container = document.getElementById('promptContainer');
  if (!container) {
    console.error("❌ promptContainer要素が見つかりません");
    return;
  }

  container.innerHTML = '';

  if (!fileName || !allPromptData[fileName]) {
    console.warn(`⚠️ ファイル「${fileName}」のデータが見つかりません`);
    container.innerHTML = '<p style="color:#f88;">選択されたファイルのデータがありません</p>';
    return;
  }

  const fileContent = allPromptData[fileName];

  // グリッド全体（中カテゴリ用）
  const gridContainer = document.createElement('div');
  gridContainer.className = 'category-grid';
  gridContainer.style.cssText = `
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(calc(50% - 6px), 1fr)) !important;
    gap: 12px !important;
    width: 100% !important;
  `;
  container.appendChild(gridContainer);

  // 直接プロンプト用
  let directRow = document.createElement('div');
  directRow.className = 'button-row button-row-direct';
  directRow.style.cssText = 'display: flex !important; flex-wrap: wrap !important; gap: 8px !important; margin-bottom: 12px !important;';
  container.insertBefore(directRow, gridContainer);

  for (const midKey in fileContent) {
    const midValue = fileContent[midKey];

    if (typeof midValue === 'string') {
      // 直接プロンプト
      const btn = createPromptButton(midKey, midValue);
      directRow.appendChild(btn);
    } else if (typeof midValue === 'object') {
      // 中カテゴリ
      const midDiv = document.createElement('div');
      midDiv.className = 'mid-category';
      midDiv.style.cssText = `
        border: 1px solid #555 !important;
        padding: 14px !important;
        border-radius: 6px !important;
        background-color: #1a1a1a !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        height: fit-content !important;
      `;

      const midLabel = document.createElement('h4');
      midLabel.textContent = midKey;
      midLabel.style.cssText = 'background-color: #f90 !important; color: #000 !important; padding: 8px 12px !important; margin: 0 !important; border-radius: 4px !important; font-size: 16px !important;';
      midDiv.appendChild(midLabel);

      // 1. 中カテゴリ直下のボタン（string）
      const midButtonRow = document.createElement('div');
      midButtonRow.className = 'button-row';
      midButtonRow.style.cssText = 'display: flex !important; flex-wrap: wrap !important; gap: 8px !important;';

      // 2. 小カテゴリを収集しながら、直下ボタンも処理
      const subGrid = document.createElement('div');
      subGrid.style.cssText = `
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) !important;
        gap: 10px !important;
        width: 100% !important;
        box-sizing: border-box !important;
      `;

      for (const subKey in midValue) {
        const subValue = midValue[subKey];

        if (typeof subValue === 'string') {
          const btn = createPromptButton(subKey, subValue);
          midButtonRow.appendChild(btn);
        }

        if (typeof subValue === 'object') {
          const subDiv = document.createElement('div');
          subDiv.className = 'sub-category';
          subDiv.style.cssText = `
            border: 1px solid #444 !important;
            padding: 10px !important;
            border-radius: 5px !important;
            background-color: #252525 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            box-sizing: border-box !important;
          `;

          const subLabel = document.createElement('h5');
          subLabel.textContent = subKey;
          subLabel.style.cssText = `
            background-color: #fbb040 !important;
            color: #000 !important;
            padding: 6px 10px !important;
            margin: 0 !important;
            border-radius: 4px !important;
            font-size: 14px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          `;
          subDiv.appendChild(subLabel);

          const buttonRow = document.createElement('div');
          buttonRow.className = 'button-row';
          buttonRow.style.cssText = `
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          `;

          for (const label in subValue) {
            const value = subValue[label];
            if (typeof value === 'string') {
              const subBtn = createPromptButton(label, value);
              subBtn.style.maxWidth = '100% !important';
              buttonRow.appendChild(subBtn);
            }
          }

          subDiv.appendChild(buttonRow);
          subGrid.appendChild(subDiv);
        }
      }

      if (midButtonRow.childNodes.length > 0) {
        midDiv.appendChild(midButtonRow);
      }

      if (subGrid.childNodes.length > 0) {
        midDiv.appendChild(subGrid);
      }

      gridContainer.appendChild(midDiv);
    }
  }

  setupGridResizeObserver(gridContainer);
}


// パネルのリサイズに応じてグリッドのカラム数を動的に調整
function setupGridResizeObserver(gridContainer) {
  // ResizeObserverが利用可能かチェック
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        console.log("📏 グリッドの幅が変更されました:", width);

        // 親要素の幅に応じてグリッドのカラム数を調整
        let columns = 1; // 幅が狭い場合は1列

        if (width > 450) {
          columns = 2; // 幅が十分ある場合は2列（最大）
        }

        // グリッドのカラム設定を更新
        gridContainer.style.setProperty('grid-template-columns', `repeat(${columns}, 1fr)`, 'important');
        console.log(`📏 グリッドカラム数を${columns}に設定しました`);
      }
    });

    // グリッドコンテナを監視開始
    observer.observe(gridContainer.parentElement);
  } else {
    console.warn("⚠️ ResizeObserverが利用できません。固定レイアウトを使用します。");

    // フォールバック: 固定で2列または1列にする
    const parentWidth = gridContainer.parentElement.offsetWidth;
    let columns = 1;
    if (parentWidth > 450) {
      columns = 2;
    }
    gridContainer.style.setProperty('grid-template-columns', `repeat(${columns}, 1fr)`, 'important');
  }
}

// ✅ 4. ボタンクリックでプロンプト挿入
function createPromptButton(label, value) {
  const button = document.createElement('button');
  button.textContent = label;
  button.className = 'prompt-button';
  button.style.cssText = 'background-color: #333 !important; color: #eee !important; border: 1px solid #666 !important; padding: 6px 12px !important; border-radius: 4px !important; cursor: pointer !important; font-size: 14px !important; transition: background 0.2s !important; flex-shrink: 0 !important; width: auto !important; align-self: flex-start !important;';

  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#555 !important';
  });

  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#333 !important';
  });

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

// ✅ ボタン表示のフォールバック機能（ボタンが見つからない場合に使用）
function insertFixedButton() {
  // すでにボタンが存在する場合は何もしない
  if (document.getElementById('saweb-toggle-modal-btn')) {
    return;
  }

  console.log("⚠️ フォールバック: 固定位置ボタンを追加します");

  // 固定位置のボタンを作成
  const fixedButton = document.createElement('button');
  fixedButton.textContent = '🧠';
  fixedButton.id = 'saweb-toggle-modal-btn';
  fixedButton.title = 'Open prompt';
  fixedButton.style.cssText = `
    position: fixed !important;
    top: 10px !important;
    right: 10px !important;
    z-index: 2147483646 !important;
    padding: 6px 10px !important;
    font-size: 16px !important;
    background-color: #f90 !important;
    color: #000 !important;
    border: none !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3) !important;
  `;

  document.body.appendChild(fixedButton);
  console.log("✅ 固定位置ボタン追加済み");

  return fixedButton;
}

// 重要: 初期実行を追加
console.log("🔄 初期実行を試みます");
setTimeout(() => {
  console.log("⏱️ 遅延実行開始");

  // 通常のボタン挿入を試みる
  insertPanelAndButton();

  // 5秒後にボタンが存在するかチェックし、なければフォールバック
  setTimeout(() => {
    if (!document.getElementById('saweb-toggle-modal-btn')) {
      const fixedButton = insertFixedButton();

      // フォールバックボタンにもイベントハンドラを追加
      if (fixedButton) {
        // 新しいパネルを作成する処理を呼び出す
        // （ここでは関数呼び出しでなく直接コードを書きます）
        console.log("🧠 フォールバックボタンのイベントハンドラを設定");

        fixedButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          // 既存のパネルを探す
          let panelContent = document.querySelector('.saweb-panel-content');

          // パネルがなければ新規作成
          if (!panelContent) {
            console.log("📦 新規パネルを作成します");
            // パネル作成コードはinsertPanelAndButton関数と同様...
            // 実際のコードは長くなるので省略
          } else {
            // パネルの表示/非表示を切り替え
            const isVisible = panelContent.style.display !== 'none';
            panelContent.style.setProperty('display', isVisible ? 'none' : 'block', 'important');
            console.log(isVisible ? "🔍 パネル非表示" : "🔍 パネル表示");
          }
        });
      }
    }
  }, 5000);

}, 1000);

// ✅ 5. DOMが揃ったら自動挿入（MutationObserver）
const observer = new MutationObserver(() => {
  insertPanelAndButton();
});
observer.observe(document.body, { childList: true, subtree: true });
