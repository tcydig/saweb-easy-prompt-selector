const uploader = document.getElementById("yamlUploader");
const fileList = document.getElementById("fileList");

uploader.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files);
  for (const file of files) {
    const text = await file.text();
    try {
      const parsed = jsyaml.load(text);  // ← これでYAML構造を保持

      const key = file.name.replace(/\.ya?ml$/, "");

      // 現在のデータ取得
      const existing = await chrome.storage.local.get();

      // ✅ YAML構造をそのまま保持して保存
      const newFormatted = convertToNewFormat(parsed);
      await chrome.storage.local.set({
        ...existing,
        [key]: newFormatted
      });

      console.log(`✅ '${key}' を保存しました`);
      console.log("🧠 JSON構造確認：", JSON.stringify({ [key]: parsed }, null, 2));
      console.log("🧠 JSON構造確認(新フォーマット)：", JSON.stringify({ [key]: newFormatted }, null, 2));

    } catch (e) {
      alert(`❌ ${file.name} の読み込みに失敗しました: ${e.message}`);
      console.error(e);
    }
  }

  event.target.value = "";
  renderList();
});

async function renderList() {
  const data = await chrome.storage.local.get();
  fileList.innerHTML = "";
  Object.keys(data).forEach(key => {
    const li = document.createElement("li");
    li.textContent = key;
    const btn = document.createElement("button");
    btn.textContent = "Delete";
    btn.onclick = async () => {
      await chrome.storage.local.remove(key);
      renderList();
    };
    li.appendChild(btn);
    fileList.appendChild(li);
  });
}

renderList();


// Helper関数
// Easy Prompt Selector(SD)で許可されているYaml形式を名部フォーマットに修正する
function convertToNewFormat(oldData) {
  const midList = [];

  for (const [midKey, midValue] of Object.entries(oldData)) {
    const midEntry = {};

    // 直接プロンプトのように文字列1つならそのまま入れる
    if (typeof midValue === 'string') {
      midEntry[midKey] = midValue;
      midList.push(midEntry);
      continue;
    }

    const subList = [];

    for (const [subKey, subValue] of Object.entries(midValue)) {
      // 小カテゴリも文字列なら直接プロンプトとして処理
      if (typeof subValue === 'string') {
        subList.push({
          [subKey]: subValue
        });
        continue;
      }

      // promptsに変換（順序を保つ）
      const prompts = Object.entries(subValue).map(([label, prompt]) => ({
        [label]: prompt
      }));

      subList.push({
        [subKey]: {
          prompts
        }
      });
    }

    midEntry[midKey] = { subList };
    midList.push(midEntry);
  }

  return { midList };
}