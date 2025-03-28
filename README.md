# Seaart 版 Easy Prompt Selector（Google 拡張機能）

## ① アプリ概要

この拡張機能は、Stable Diffusion で広く使われている「[Easy Prompt Selector](https://github.com/blue-pen5805/sdweb-easy-prompt-selector)」の Seaart 対応版として開発された Google Chrome 拡張機能です。

Stable Diffusion では、プロンプト選択を簡略化できる便利なプラグインが多数用意されていますが、Seaart には同等のものが存在しませんでした。そのため、本拡張機能を個人開発として制作しました。

Yaml 構造や UI 設計は、基本的に本家 Easy Prompt Selector の仕組みに準拠していますが、一部未実装の機能（例：ワイルドカード機能など）もございます。

使用された方のフィードバックは大歓迎です。  
なお、個人開発のため、意図した通りに動作しない場合や、不具合への対応が遅れる可能性があることをご了承ください。

---

## ② 機能

本拡張機能の主な機能は以下の通りです。

- YAML ファイルからプロンプトを読み込み、カテゴリ構造で自動表示
- ボタン一つでプロンプト入力欄に挿入可能
- オプション画面から YAML をアップロードしてカスタマイズ可能

![Image](https://github.com/user-attachments/assets/55cc8e68-b757-4a0f-83d1-9a092523e1a6)

---

## ③ インストール方法

1. Google 拡張機能ストアからインストール（※公開され次第リンクを記載）
2. [Seaart](https://seaart.ai/) にアクセス
3. 「Generate」ページを選択
4. 右上に表示される 🧠 ボタンをクリック
   ![button](/media/button.png)

---

## ④ 使い方

- オプション画面から YAML ファイルを読み込むと、カテゴリ構造に沿って UI が自動生成されます。
- 表示された各プロンプトボタンをクリックすると、入力欄に自動でプロンプトが挿入されます。

![Image](https://github.com/user-attachments/assets/c01a9152-55fa-4db9-906a-f36a19a9b0e4)

---

## ⑤ カスタマイゼーション

オプション画面から、YAML ファイルをアップロードすることでカスタマイズが可能です。
![Image](/media/option-button.png)
![Image](/media/option.png)
※Option 画面は驚くほど簡素ですが、偽物ではなく本物です

登録できた Yaml ファイルは画面上に表示されます \
削除したい場合は Delete ボタンを押してください

YAML の構文は以下のような階層構造を想定しています：

```yaml
朝: "soft morning light, sunrise, misty"
```

![Image](/media/sy_1.png)

```yaml
自然風景プロンプト:
  朝: "soft morning light, sunrise, misty"
```

![Image](/media/sy_2.png)

```yaml
自然風景プロンプト:
  時間帯:
    朝: "soft morning light, sunrise, misty"
```

![Image](/media/sy_3.png)

```yaml
- 1girl
```

![Image](/media/sy_4.png)

> [!WARNING]\
> この構文はボタン名とプロンプトが同じ場合のショートハンドです。\
> この構文と XXX:CCC という構文は同一階層に設定することはできません

上記の構文について test フォルダにいくつかのサンプルを格納しております\
ご参考までにご確認いただけると幸いです

## ⑥ 注意事項

- 本拡張機能は **Seaart の Legacy UI モデル** のみに対応しています。New UI では動作しません。
- プロンプトデータはブラウザのローカルストレージに保存されるため、異なるブラウザや端末で使用する際は、再度 YAML ファイルのアップロードが必要です。
- YAML を更新した場合は、Seaart 側の画面で「Sync」ボタンを押して内容を反映してください。

---

## ⑦ 最後に

あなたの画像生成体験が、よりスムーズで、より楽しいものになることを願っています。  
ご利用ありがとうございます！
