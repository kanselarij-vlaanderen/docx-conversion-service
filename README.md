# DOCX conversion service

A microservice that converts `docx` files to `pdf` files and stores the converted file as a `derived-file` in the database. This microservice uses Microsoft's Graph API to convert the DOCX files by uploading the DOCX files to OneDrive and afterwards downloading them as a PDF. Because of this, **an Azure application is required to run this service**.


## Tutorials
### Add the docx-conversion-service to a stack
Add the following snippet to your `docker-compose.yml` file to include the DOCX conversion service in your project.

```yml
docx-conversion:
  image: kanselarij/docx-conversion-service
  volumes:
    - ./data/files:/share
```

Add rules to the `dispatcher.ex` to dispatch requests to the DOCX conversion service.

```ex
match "/files/:id/convert" do
  Proxy.forward conn, [], "http://docx-conversion/files/" <> id <> "/convert"
end
```

## Reference
### Configuration
The following environment variables are required for this service to work:
 - `TENANT_ID` [string]: The tenant ID of the Azure Active Directory where the application exists
 - `CLIENT_ID` [string]: The client ID of the Azure application
 - `CLIENT_SECRET` [string]: The client secret of the Azure application
 - `USER_ID` [string]: The id of the user that OneDrive will be used
The following environment variables can be optionally configured:
 - `MU_APPLICATION_FILE_STORAGE_PATH` [string]: The path where you want to store the converted PDF files. It will but a subpath from `/share/` (default `converted-docx`)
 - `FILE_RESOURCE_BASE_URI` [string]: The base of the URI for new file resources (default `http://themis.vlaanderen.be/id/bestand/`)
 - `FILE_JSONAPI_TYPE` [string]: The JSON:API type of file resources which is used when generating a JSON:API response (default `files`)
 
### API

#### POST `/files/:id/convert`

Request the conversion of the DOCX file to PDF.

#### Response
##### 201 Created

On successful conversion of the provided file, with the following body containing the ID of the newly created converted file:

```json
{
	"data": [
		{
			"attributes": {
				"uri": "http://themis.vlaanderen.be/id/bestand/$ID"
			},
			"id": "$ID",
			"type": "files"
		}
	]
}
```

### Usage of Graph API

For development on this service, it's useful to know about the Microsoft Graph API. The following should help with that:
- [Microsoft Graph API Reference](https://learn.microsoft.com/en-us/graph/api/overview?view=graph-rest-1.0)
- [Uploading a file using an upload session](https://learn.microsoft.com/en-us/graph/api/driveitem-createuploadsession?view=graph-rest-1.0)
- [Download a file in another format](https://learn.microsoft.com/en-us/graph/api/driveitem-get-content-format?view=graph-rest-1.0&tabs=javascript)
- [Delete a file](https://learn.microsoft.com/en-us/graph/api/driveitem-delete?view=graph-rest-1.0&tabs=javascript)

Your Azure application requires the following **application permissions**:
- `Files.ReadWrite.All`

If you don't have access to an existing Azure application, Microsoft has a Developer Program that gives you access to a free Azure Active Directory and an Office administrator account, so that you can create the necessary application and user. For a detailed explanation check [this tutorial](docs/setting-up-microsoft-developer-program.md).
