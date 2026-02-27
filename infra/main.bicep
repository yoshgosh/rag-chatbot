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

// ----- naming -----
// logging
var lawName = 'law-${organizationName}-${projectName}-${env}-${locationCode}'

// storage
var docsStName = take('st${organizationName}${projectName}docs${env}${locationCode}${shortUniqueId}', 24)
var docsContainerName = 'documents'

// search
var searchName = 'srch-${organizationName}-${projectName}-${env}-${locationCode}'

// openai
var openaiName = 'oai-${organizationName}-${projectName}-${env}-${locationCode}'

// chat-api
var chatApiAppiName = 'appi-${organizationName}-${projectName}-chat-api-${env}-${locationCode}'
var chatApiStName = take('st${organizationName}${projectName}capi${env}${locationCode}${shortUniqueId}', 24)
var chatApiContainerName = 'api-package'
var chatApiAspName = 'asp-${organizationName}-${projectName}-chat-api-${env}-${locationCode}'
var chatApiFuncName = 'func-${organizationName}-${projectName}-chat-api-${env}-${locationCode}'

// chat-web
var chatWebName = 'stapp-${organizationName}-${projectName}-chat-web-${env}-${locationCode}'

// ----- resources -----
// logging
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: lawName
  location: location
  properties: { sku: { name: 'PerGB2018' } }
}

// storage
resource docsSt 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: docsStName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  resource blobServices 'blobServices' existing = {
    name: 'default'
  }
}

resource docsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: docsSt::blobServices
  name: docsContainerName
}

// search
resource search 'Microsoft.Search/searchServices@2023-11-01' = {
  name: searchName
  location: location
  sku: {
    name: 'free'
  }
}

// openai
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

resource gpt41Mini 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openai
  name: 'gpt-4.1-mini'
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4.1-mini'
      version: '2025-04-14'
    }
  }
  sku: {
    name: 'GlobalStandard'
    capacity: 50
  }
}

resource textEmbedding3Small 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openai
  name: 'text-embedding-3-small'
  dependsOn: [
    gpt41Mini
  ]
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-3-small'
      version: '1'
    }
  }
  sku: {
    name: 'Standard'
    capacity: 10
  }
}

// chat-api
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
  resource blobServices 'blobServices' existing = {
    name: 'default'
  }
}

resource chatApiContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: chatApiSt::blobServices
  name: chatApiContainerName
}

resource chatApiAsp 'Microsoft.Web/serverfarms@2024-11-01' = {
  name: chatApiAspName
  location: location
  kind: 'functionapp'
  sku: { name: 'FC1', tier: 'FlexConsumption' }
  properties: { reserved: true }
}

resource chatApiFunc 'Microsoft.Web/sites@2024-11-01' = {
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
          value: '${chatApiSt.properties.primaryEndpoints.blob}${chatApiContainerName}'
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
          'http://localhost:5173'
          'https://${chatWebStapp.properties.defaultHostname}'
        ]
      }
      appSettings: [
        { name: 'AzureWebJobsStorage', value: 'DefaultEndpointsProtocol=https;AccountName=${chatApiSt.name};AccountKey=${chatApiSt.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}' }
        { name: 'DEPLOYMENT_STORAGE_CONNECTION_STRING', value: 'DefaultEndpointsProtocol=https;AccountName=${chatApiSt.name};AccountKey=${chatApiSt.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: chatApiAppi.properties.ConnectionString }
        { name: 'AZURE_DOCS_STORAGE_CONNECTION_STRING', value: 'DefaultEndpointsProtocol=https;AccountName=${docsSt.name};AccountKey=${docsSt.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}' }
        { name: 'AZURE_SEARCH_ENDPOINT', value: 'https://${search.name}.search.windows.net' }
        { name: 'AZURE_SEARCH_ADMIN_KEY', value: search.listAdminKeys().primaryKey }
        { name: 'AZURE_OPENAI_ENDPOINT', value: openai.properties.endpoint }
        { name: 'AZURE_OPENAI_API_KEY', value: openai.listKeys().key1 }
        { name: 'AZURE_OPENAI_GPT_4_1_MINI_NAME', value: gpt41Mini.name }
      ]
    }
  }
}

// chat-web
resource chatWebStapp 'Microsoft.Web/staticSites@2024-11-01' = {
  name: chatWebName
  location: 'eastasia'
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

// ----- outputs -----
output chatApiFuncName string = chatApiFunc.name
output searchName string = search.name
output openaiName string = openai.name
output textEmbedding3SmallName string = textEmbedding3Small.name
output docsStName string = docsSt.name
output chatWebStappName string = chatWebStapp.name
output chatApiDefaultHostName string = chatApiFunc.properties.defaultHostName
