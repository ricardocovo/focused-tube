targetScope = 'resourceGroup'

@description('Environment name used for resource naming and uniqueness')
param environmentName string

@description('Azure region for resources')
param location string = resourceGroup().location

@secure()
@description('SQL Server administrator password')
param sqlAdminPassword string

@secure()
@description('Google OAuth client ID')
param googleClientId string

@secure()
@description('Google OAuth client secret')
param googleClientSecret string

@secure()
@description('JWT signing secret')
param jwtSecret string

@secure()
@description('JWT refresh token secret')
param jwtRefreshSecret string

@secure()
@description('Encryption key for stored tokens')
param encryptionKey string

module sql 'modules/sql.bicep' = {
  name: 'sql'
  params: {
    environmentName: environmentName
    location: location
    sqlAdminPassword: sqlAdminPassword
  }
}

module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'staticwebapp'
  params: {
    environmentName: environmentName
  }
}

module appService 'modules/appservice.bicep' = {
  name: 'appservice'
  params: {
    environmentName: environmentName
    location: location
    sqlServerFqdn: sql.outputs.sqlServerFqdn
    databaseName: sql.outputs.databaseName
    sqlServerName: sql.outputs.sqlServerName
    sqlAdminLogin: sql.outputs.sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
    googleClientId: googleClientId
    googleClientSecret: googleClientSecret
    jwtSecret: jwtSecret
    jwtRefreshSecret: jwtRefreshSecret
    encryptionKey: encryptionKey
    clientOrigin: 'https://${staticWebApp.outputs.swaHostname}'
  }
}

module swaLinkedBackend 'modules/swa-linked-backend.bicep' = {
  name: 'swa-linked-backend'
  params: {
    swaName: staticWebApp.outputs.swaName
    appServiceId: appService.outputs.appServiceId
    location: location
  }
}

output AZURE_STATIC_WEB_APP_HOSTNAME string = staticWebApp.outputs.swaHostname
output AZURE_APP_SERVICE_HOSTNAME string = appService.outputs.appServiceHostname
