@description('Environment name used for resource naming')
param environmentName string

@description('Azure region for the Static Web App (SWA has limited region support)')
param location string = 'eastus2'

var namePrefix = '${environmentName}-ft'
var swaName = '${namePrefix}-swa'

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: swaName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

@description('Default hostname of the Static Web App')
output swaHostname string = staticWebApp.properties.defaultHostname

@description('Resource ID of the Static Web App')
output swaId string = staticWebApp.id

@description('Name of the Static Web App resource')
output swaName string = staticWebApp.name
