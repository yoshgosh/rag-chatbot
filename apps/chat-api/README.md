# chat-api

Azure Functions で構築されたチャット API サービスです。
Azure OpenAI と Azure AI Search を利用して、チャットボットの応答を生成します。

## ローカル開発

（`cd apps/chat-api` でサービスディレクトリに移動して作業する。）

- 環境変数の設定
     - `local.settings.example.json` を基に `local.settings.json` を作成する。
        - 各変数は Azure ポータルから取得できる。

- 必要ツールのインストール
    - Azure Functions Core Tools
        ```bash
        npm install -g azure-functions-core-tools@4 --unsafe-perm true
        ```
        ```bash
        func --version
        ```
    - Azurite
        ```bash
        npm install -g azurite
        ```
        ```bash
        azurite --version
        ```

- 依存パッケージのインストール
    ```bash
    npm install
    ```

- エミュレーターの起動
    - Azurite を起動する。
        ```bash
        azurite
        ```
    - Functions を起動する。
        ```bash
        npm run start
        ```

- 動作確認
    ```bash
    curl http://localhost:7071/api/health
    ```
    ```bash
    curl -X POST "http://localhost:7071/api/answer" \
     -H "Content-Type: application/json" \
     -d '{"query":"無過失責任とは何ですか？"}'
    ```

- リント・フォーマット
    ```bash
    npm run lint
    npm run format
    ```