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
      await chrome.storage.local.set({
        ...existing,
        [key]: parsed
      });

      console.log(`✅ '${key}' を保存しました`);
      console.log("🧠 JSON構造確認：", JSON.stringify({ [key]: parsed }, null, 2));

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
