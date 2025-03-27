document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('yaml-file');
  const uploadButton = document.getElementById('upload-button');

  uploadButton.addEventListener('click', function() {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const yaml = jsyaml.load(e.target.result);
          // プロンプトデータをストレージに保存
          chrome.storage.local.set({ prompts: yaml }, function() {
            alert('プロンプトの設定が保存されました。');
          });
        } catch (error) {
          alert('YAMLファイルの解析に失敗しました。');
          console.error(error);
        }
      };
      reader.readAsText(file);
    }
  });
}); 