@description('Organization name')
param organizationName string = 'yosh'

@description('Project name')
param projectName string = 'rcb'

@description('Deployment environment (dev, prd)')
@allowed(['dev', 'prd'])
param env string

@description('Resource deployment location')
param location string = 'japaneast'
var locationCode = 'jpe'

var uniqueId = uniqueString(resourceGroup().id)
var shortUniqueId = take(uniqueId, 5)

// common naming
var lawName = 'law-${organizationName}-${projectName}-${env}-${locationCode}'
var docsStName = take('st${organizationName}${projectName}docs${env}${locationCode}${shortUniqueId}', 24)

// chat-api naming
var chatApiAppiName = 'appi-${organizationName}-${projectName}-chat-api-${env}-${locationCode}'
var chatApiStName = take('st${organizationName}${projectName}capi${env}${locationCode}${shortUniqueId}', 24)
var chatApiAspName = 'asp-${organizationName}-${projectName}-chat-api-${env}-${locationCode}'
var chatApiFuncName = 'func-${organizationName}-${projectName}-chat-api-${env}-${locationCode}'

// search naming
var searchName = 'srch-${organizationName}-${projectName}-${env}-${locationCode}'

// openai naming
var openaiName = 'oai-${organizationName}-${projectName}-${env}-${locationCode}'

// common resources
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: lawName
  location: location
  properties: { sku: { name: 'PerGB2018' } }
}

resource docsSt 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: docsStName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
}

// AI Search
resource search 'Microsoft.Search/searchServices@2023-11-01' = {
  name: searchName
  location: location
  sku: {
    name: 'free'
  }
}

// Azure OpenAI Service 本体
resource openai 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: openaiName
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: openaiName
  }
}

// モデルデプロイ: GPT-4.1
resource gpt41 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openai
  name: 'gpt-4.1'
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4.1'
      version: '2025-04-14'
    }
  }
  sku: {
    name: 'GlobalStandard'
  }
}

// モデルデプロイ: text-embedding-3-small
resource embedding 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openai
  name: 'text-embedding-3-small'
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-3-small'
      version: '1'
    }
  }
  sku: {
    name: 'GlobalStandard'
    capacity: 10
  }
}

// chat-api resources
resource chatApiAppi 'Microsoft.insights/components@2020-02-02' = {
  name: chatApiAppiName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

resource chatApiSt 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: chatApiStName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
}

resource chatApiAsp 'Microsoft.Web/serverfarms@2024-11-01' = {
  name: chatApiAspName
  location: location
  kind: 'functionapp'
  sku: { name: 'FC1', tier: 'FlexConsumption' }
  properties: { reserved: true }
}

resource chatApi 'Microsoft.Web/sites@2024-11-01' = {
  name: chatApiFuncName
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: chatApiAsp.id
    functionAppConfig: {
      runtime: { name: 'node', version: '22' }
      scaleAndConcurrency: {
        instanceMemoryMB: 512
        maximumInstanceCount: 40
      }
      deployment: {
        storage: {
          type: 'blobcontainer'
          value: '${chatApiSt.properties.primaryEndpoints.blob}api-package'
          authentication: { 
            type: 'StorageAccountConnectionString' 
            storageAccountConnectionStringName: 'DEPLOYMENT_STORAGE_CONNECTION_STRING' 
          }
        }
      }
    }
    siteConfig: {
      cors: {
        allowedOrigins: [
          'https://portal.azure.com'
        ]
      }
      appSettings: [
        { name: 'AzureWebJobsStorage', value: 'DefaultEndpointsProtocol=https;AccountName=${chatApiSt.name};AccountKey=${chatApiSt.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}' }
        { name: 'DEPLOYMENT_STORAGE_CONNECTION_STRING', value: 'DefaultEndpointsProtocol=https;AccountName=${chatApiSt.name};AccountKey=${chatApiSt.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: chatApiAppi.properties.ConnectionString }
        { name: 'DATA_STORAGE_CONNECTION_STRING', value: 'DefaultEndpointsProtocol=https;AccountName=${docsSt.name};AccountKey=${docsSt.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}' }
        { name: 'AZURE_SEARCH_SERVICE_ENDPOINT', value: 'https://${search.name}.search.windows.net' }
        { name: 'AZURE_SEARCH_ADMIN_KEY', value: search.listAdminKeys().primaryKey }
        { name: 'AZURE_OPENAI_ENDPOINT', value: openai.properties.endpoint }
        { name: 'AZURE_OPENAI_API_KEY', value: openai.listKeys().key1 }
        { name: 'AZURE_OPENAI_CHAT_DEPLOYMENT', value: gpt41.name }
        { name: 'AZURE_OPENAI_EMBEDDING_DEPLOYMENT', value: embedding.name }
      ]
    }
  }
}

resource containerSys 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  name: '${chatApiSt.name}/default/api-package'
}
resource containerData 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  name: '${docsSt.name}/default/documents'
}

output chatApiFuncName string = chatApi.name
