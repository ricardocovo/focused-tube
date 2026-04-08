@description('Environment name used for resource naming')
param environmentName string

@description('Azure region for resources')
param location string

@description('SQL Server administrator login')
param sqlAdminLogin string = 'ftadmin'

@secure()
@description('SQL Server administrator password')
param sqlAdminPassword string

var namePrefix = '${environmentName}-ft'
var sqlServerName = '${namePrefix}-sql'
var databaseName = '${namePrefix}-db'

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    publicNetworkAccess: 'Enabled'
  }
}

resource firewallRule 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource database 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: {
    name: 'GP_S_Gen5_1'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 1
  }
  properties: {
    autoPauseDelay: 60
    minCapacity: json('0.5')
    useFreeLimit: true
    freeLimitExhaustionBehavior: 'AutoPause'
  }
}

@description('Fully qualified domain name of the SQL Server')
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName

@description('Name of the database')
output databaseName string = databaseName

@description('Name of the SQL Server resource')
output sqlServerName string = sqlServerName

@description('SQL admin login')
output sqlAdminLogin string = sqlAdminLogin
