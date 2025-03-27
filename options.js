document.getElementById('yamlInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    try {
      const parsed = jsyaml.load(reader.result);
      chrome.storage.local.set({ prompts: parsed }, () => {
        document.getElementById('status').textContent = 'YAMLを保存しました。';
      });
    } catch (err) {
      document.getElementById('status').textContent = 'YAMLの読み込みに失敗しました。';
      console.error(err);
    }
  };
  reader.readAsText(file);
});
