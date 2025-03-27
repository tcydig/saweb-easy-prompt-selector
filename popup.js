document.addEventListener('DOMContentLoaded', function() {
  // プロンプトリストの表示処理を実装予定
  const promptList = document.getElementById('prompt-list');
  
  // ストレージからプロンプトを読み込む
  chrome.storage.local.get(['prompts'], function(result) {
    if (result.prompts) {
      // プロンプトの表示処理を実装予定
    }
  });
}); 