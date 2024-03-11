# Setting up Microsoft Developer Program

To use and develop this service you will need an Azure application and a user. If you don't have them, this tutorial will guide you through the setup of your Microsoft Developer Program account and the rest of the requirements needed for this service to function.

## Setting up your Microsoft Account

Navigate to the [Microsoft 365 Developer Program](https://developer.microsoft.com/en-us/microsoft-365/dev-program). If you already have a Microsoft account, log in, otherwise create one. Afterwards click the "Join now" button and go through the form to enter the developer program.

![Microsoft Developer Program website](./images/microsoft-developer-program-website.png)

![Microsoft Developer Program form first part](./images/microsoft-developer-program-form-1.png)

![Microsoft Developer Program form second part](./images/microsoft-developer-program-form-2.png)

![Microsoft Developer Program form third part](./images/microsoft-developer-program-form-3.png)

![Microsoft Developer Program form fourth part](./images/microsoft-developer-program-form-4.png)
*Make sure to select the Instant sandbox, as it will contain useful default configuration!*

![Microsoft Developer Program form fifth part](./images/microsoft-developer-program-form-5.png)
*Make sure to remember the password you provide here, as you will need it later to log into the Azure portal.*

![Microsoft Developer Program form sixth part](./images/microsoft-developer-program-form-6.png)
*You will need to provide a valid phone number to finish this process.*

After going through the form you should have created a sandbox that allows you to create all the resources needed for this service. Make note of the administrator email address, you will need it to log into the Azure portal.

![Microsoft Developer Program with created sandbox](./images/microsoft-developer-program-admin-username.png)

## Setting up the Azure application

Navigate to the [Azure portal](http://portal.azure.com) and log in with the admin account you just created.
![Azure portal login page](./images/azure-portal-login.png)

Use the search bar to look for "App registrations" and click it.
![Azure portal search for app registration](./images/azure-app-registrations.png)

You will now create a new app registration that will be used for this service.

![Empty Azure app registration overview](./images/azure-new-registration-1.png)
![The form to create an app registration in Azure](./images/azure-new-registration-2.png)
![The overview page of the newly created app registration](./images/azure-new-registration-3.png)

Write down the **Application (client) ID** and the **Directory (tenant) ID**, they're the values of the environment variables `CLIENT_ID` and `TENANT_ID`.

You still need a way for your service to authenticate with Microsoft's infrastructure, for that you will need a "client secret". Go to the **Certificates & secrets** tab and create a new client secret (the name you give it doesn't really matter).

![Client secrets overview with the "New client secret" button hovered](./images/new-client-secret.png)

Make sure to store the secret's value, as soon as you leave this page the value gets hidden and you need it for the `CLIENT_SECRET` environment variable.

![The form to create a new client secret](./images/creating-new-secret.png)

![The newly created client secret](./images/client-secret-value.png)

Your application still needs the correct permissions for uploading files. Go to the **API permissions** tab and add a new permission.
![Empty API permissions overview with the "Add a permission" button hovered](./images/add-a-permission.png)

The permission type must be **Microsoft Graph Application permission**.

![The form to add an app permission with the "Microsoft Graph" option hovered](./images/microsoft-graph-permission.png)

![The form to add an app permission with the "Application permission" option hovered](./images/application-permission.png)

The permission itself is **Files.ReadWrite.All**.

![The form to add an app permission with the "Files.ReadWrite.All" permission selected](./images/files-readwrite-permission.png)

After adding the permission you still need to **Grant admin consent** for the permission.

![The API permissions overview with the "Grand admin consent to MSFT" button hovered](./images/permission-grant-consent.png)

You still need to get a user ID. You can use your admin user for this, as the service just needs to be able to upload files to the user's OneDrive root.

To get the ID go to **Users** in the Azure portal.

![The Azure portal search bar with the "Users" result hovered](./images/users.png)

Get the ID of the user you want to use by clicking on their name.

![The overview of users with the admin user hovered](./images/users-overview.png)

Assign the value of the **Object ID** field to the `USER_ID` environment variable.

![The detail page of the admin user with its object ID ready to be copied](./images/users-detail.png)
