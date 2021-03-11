# GitHub action for configuring Azure App services from environment variables

This action is heavily influenced by Microsoft's App Service Settings action [here](https://github.com/Azure/appservice-settings).  

This action will read a json file that will then be used to inform configuration of an Azure App Service using available environment variables to update values as matches occur.

## Note
Currently only app settings are supported. Connection strings and general configuration settings aren't yet supported though some support is stubbed in for future development.

# Requirements
## Template file
A template file must be provided to the action for environment variables to reflect up on for patching values. If the template file contains a value for a setting and no corresponding environment variable matches the name (case-insensitive) of the setting then the templated setting and its value is used.

The format is generally copied from [here](https://docs.microsoft.com/en-us/azure/app-service/configure-common#configure-app-settings).

### Format
```
{
    appSettings: [
        {
            "name": "SettingName",
            "slotSetting": false,
            "value": "SettingValue"
        },
        {
            "name": "SettingName2",
            "slotSetting": false,
            "value": "SettingValue2"
        }
    ]
}
```
# Usage
## Dependencies on other GitHub Actions
* Authentication must be performed ahead of time using [Azure Login](https://github.com/marketplace/actions/azure-login).

## Inputs
Action configuration settings to be used within the `with` block.

* file - The configuration template file path
    * Required
    * Example
      ```
      with:
        file: './configuration.template.json'
        appname: 'web-app'
      ```
* appname - The name of the app service in Azure
  * Required
  * Example 
    ```
    with:
      file: './configuration.template.json'
      appname: 'web-app'
    ```
* slotname - The name of the slot to apply settings to.  App settings with `slotSetting` set to `true` will only be applied to this slot but all other settings will be applied to the App Service.
  * Default = 'production'
  * Example
    ```
    with:
      file: './configuration.template.json'
      appname: 'web-app'
      slotname: 'staging'
    ```
* prefix - The prefix applied to the environment variables to allow filtering of only relevant environment variables and/or to avoid collision.  If no prefix is provided all environment variables are considered for value substitution.
  * Example
    ```
    env:
      APP_APPLICATIONINSIGHTS_INSTRUMENTATIONKEY = "ffffffff-ffff-ffff-ffff-fffffffffffff"
    with:
      file: './configuration.template.json'
      appname: 'web-app'
      prefix: 'app'
    ```

## Features

### Removals
When you are wanting to remove a setting from an App Service you may apply the `REMOVE` prefix to an environment variable matching the name of the appsetting and it will be removed.

* Example
  ```
  env:
      REMOVE_APPLICATIONINSIGHTS_INSTRUMENTATIONKEY = "ffffffff-ffff-ffff-ffff-fffffffffffff"
  with:
      file: './configuration.template.json'
      appname: 'web-app'      
  ```


### Slot settings
When you are wanting to set a slot setting appsetting you may apply the `SLOT_{SLOTNAME}` prefix to an environment variable matching the naem of the appsetting and it will be applied as a slot setting only regardless of what the configuration template setting is as long as the slot name matches that of the workflow.
* Example
  ```
  env:
      SLOT_STAGING_APPLICATIONINSIGHTS_INSTRUMENTATIONKEY = "ffffffff-ffff-ffff-ffff-fffffffffffff"
  with:
      file: './configuration.template.json'
      appname: 'web-app'
      slotname: 'staging'
  ```
* Ignored app setting example
  ```
  env:
      SLOT_PRODUCTION_APPLICATIONINSIGHTS_INSTRUMENTATIONKEY = "ffffffff-ffff-ffff-ffff-fffffffffffff"
  with:
      file: './configuration.template.json'
      appname: 'web-app'
      slotname: 'staging'
  ```

## Sample
```
on:
    workflow-dispatch:

jobs:
    build:
        runs-on: ubuntu-latest
        steps:
            - uses: azure/login@v1
              with:
                creds: '${{ secrets.AZURE_CREDENTIALS }}

            - uses: catchco/azure-appservice-settings-env@latest
              with:
                file: 'configuration.template.json'
                appname: 'web-app'
            
            - run: az logout
```