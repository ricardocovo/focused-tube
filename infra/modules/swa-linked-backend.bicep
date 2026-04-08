@description('Name of the existing Static Web App resource')
param swaName string

@description('Resource ID of the App Service to link as backend')
param appServiceId string

@description('Region of the linked backend')
param location string

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' existing = {
  name: swaName
}

resource linkedBackend 'Microsoft.Web/staticSites/linkedBackends@2023-12-01' = {
  parent: staticWebApp
  name: 'api-backend'
  properties: {
    backendResourceId: appServiceId
    region: location
  }
}
