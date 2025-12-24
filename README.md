# RAGチャットボット
Azure で構築するRAGチャットボット
## 手動デプロイ
### ツールのインストール
- [Azure CLI](https://learn.microsoft.com/ja-jp/cli/azure/install-azure-cli)
- [Azure Functions Core Tools (v4)](https://learn.microsoft.com/ja-jp/azure/azure-functions/functions-run-local)
- [Node.js v22+](https://nodejs.org/)

### インフラのデプロイ
- Azure へのログイン
```bash
az login
```
- リソースグループの作成
    - 環境・リージョンに応じて変更
```bash
az group create --name rg-yosh-rcb-dev-jpe --location japaneast
```
- デプロイ
    - 環境に応じて変更
```bash
az deployment group create \
  --resource-group rg-yosh-rcb-dev-jpe \
  --template-file infra/main.bicep \
  --parameters infra/params/dev.bicepparam
```

### アプリケーションのデプロイ
- アプリケーションディレクトリへ移動
```bash
cd apps/chat-api
```
- 依存関係のインストール
```bash
npm install
```
- デプロイ
    - 環境に応じて変更
```bash
func azure functionapp publish func-rcb-api-dev-jpe
```
- 疎通確認
    - https://func-yosh-rcb-chat-api-dev-jpe.azurewebsites.net/api/health
    - want:
        ```json
        {"status":"ok","timestamp":"2025-12-23T11:19:25.023Z"}
        ```