@description('プロジェクトのベース名')
param projectName string = 'rcb'

@description('デプロイ環境 (dev, prd)')
@allowed(['dev', 'prd'])
param env string

@description('リソースの配備場所')
param location string = 'japaneast'
var locationCode = 'jpe'

var uniqueId = uniqueString(resourceGroup().id)
var shortUniqueId = take(uniqueId, 5)

// --- 名称の定義 (リージョン名入り) ---
var logName = 'log-${projectName}-${env}-${locationCode}'
var insName = 'ins-${projectName}-${env}-${locationCode}'

// ストレージは最大24文字。記号不可。
var stSysName = take('st${projectName}sys${env}${locationCode}${shortUniqueId}', 24)
var stDataName = take('st${projectName}data${env}${locationCode}${shortUniqueId}', 24)

var apiPlanName = 'plan-${projectName}-api-${env}-${locationCode}'
var apiAppName = 'func-${projectName}-api-${env}-${locationCode}'

// --- [監視] ログ基盤 ---
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logName
  location: location
  properties: { sku: { name: 'PerGB2018' } }
}

resource appInsights 'Microsoft.insights/components@2020-02-02' = {
  name: insName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// --- [ストレージ] システム用 ---
resource storageSys 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: stSysName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
}

// --- [ストレージ] データ用 ---
resource storageData 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: stDataName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
}

// --- [計算資源] Flex Consumption プラン ---
resource hostingPlan 'Microsoft.Web/serverfarms@2024-11-01' = {
  name: apiPlanName
  location: location
  kind: 'functionapp'
  sku: { name: 'FC1', tier: 'FlexConsumption' }
  properties: { reserved: true }
}

// --- [本体] Function App (API) ---
resource apiApp 'Microsoft.Web/sites@2024-11-01' = {
  name: apiAppName
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: hostingPlan.id
    functionAppConfig: {
      runtime: { name: 'node', version: '22' }
      scaleAndConcurrency: {
        instanceMemoryMB: 512
        maximumInstanceCount: 40
      }
      deployment: {
        storage: {
          type: 'blobcontainer'
          value: '${storageSys.properties.primaryEndpoints.blob}api-package'
          authentication: { 
            type: 'StorageAccountConnectionString' 
            storageAccountConnectionStringName: 'DEPLOYMENT_STORAGE_CONNECTION_STRING' 
          }
        }
      }
    }
    siteConfig: {
      appSettings: [
        { name: 'AzureWebJobsStorage', value: 'DefaultEndpointsProtocol=https;AccountName=${storageSys.name};AccountKey=${storageSys.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}' }
        { name: 'DEPLOYMENT_STORAGE_CONNECTION_STRING', value: 'DefaultEndpointsProtocol=https;AccountName=${storageSys.name};AccountKey=${storageSys.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'DATA_STORAGE_CONNECTION_STRING', value: 'DefaultEndpointsProtocol=https;AccountName=${storageData.name};AccountKey=${storageData.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}' }
      ]
    }
  }
}

// --- コンテナ作成 ---
resource containerSys 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  name: '${storageSys.name}/default/api-package'
}
resource containerData 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  name: '${storageData.name}/default/documents'
}
