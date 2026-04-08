@description('Environment name used for resource naming')
param environmentName string

@description('Azure region for resources')
param location string

@description('SQL Server fully qualified domain name')
param sqlServerFqdn string

@description('Database name')
param databaseName string

@description('SQL Server resource name')
param sqlServerName string

@description('SQL admin login')
param sqlAdminLogin string

@secure()
@description('SQL admin password')
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

@description('SWA hostname for CLIENT_ORIGIN')
param clientOrigin string

var namePrefix = '${environmentName}-ft'
var appServicePlanName = '${namePrefix}-plan'
var appServiceName = '${namePrefix}-api'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
}

resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: appServiceName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: true
      appCommandLine: 'npm run build && npx prisma migrate deploy && npm start'
      appSettings: [
        {
          name: 'DATABASE_URL'
          value: 'sqlserver://${sqlServerFqdn}:1433;database=${databaseName};user=${sqlAdminLogin}@${sqlServerName};password=${sqlAdminPassword};encrypt=true;trustServerCertificate=false'
        }
        {
          name: 'GOOGLE_CLIENT_ID'
          value: googleClientId
        }
        {
          name: 'GOOGLE_CLIENT_SECRET'
          value: googleClientSecret
        }
        {
          name: 'JWT_SECRET'
          value: jwtSecret
        }
        {
          name: 'JWT_REFRESH_SECRET'
          value: jwtRefreshSecret
        }
        {
          name: 'ENCRYPTION_KEY'
          value: encryptionKey
        }
        {
          name: 'GOOGLE_CALLBACK_URL'
          value: 'https://${appServiceName}.azurewebsites.net/api/auth/google/callback'
        }
        {
          name: 'CLIENT_ORIGIN'
          value: clientOrigin
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'PORT'
          value: '3001'
        }
      ]
    }
  }
}

@description('Default hostname of the App Service')
output appServiceHostname string = appService.properties.defaultHostName

@description('Resource ID of the App Service')
output appServiceId string = appService.id
