# chat-web

React と Vite で構築されたチャット Web クライアントです。

## ローカル開発

（`cd apps/chat-web` でサービスディレクトリに移動して作業する。）

- 環境変数の設定
     - `.env.example` を基に `.env.local` を作成する。

- 依存パッケージのインストール
    ```bash
    npm install
    ```

- 開発サーバーの起動
    ```bash
    npm run dev
    ```
    - ブラウザで `http://localhost:5173` にアクセスする。

- リント・フォーマット
    ```bash
    npm run lint
    npm run format
    ```