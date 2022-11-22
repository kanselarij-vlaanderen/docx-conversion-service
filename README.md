# DOCX conversion service

A microservice that converts `docx` files to `pdf` files and stores the converted file as a `derived-file` in the database.


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
The following environment variables can be optionally configured:
 - `FILE_RESOURCE_BASE_URI` [string]: The base of the URI for new file resources (default `http://themis.vlaanderen.be/id/bestand/`)

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

##### 400 Bad Request
- If the provided file is not a DOCX file
- If the service failed to convert the provided file to PDF

#### 404 Not Found
- If the provided file ID does not match a known file in the system

### Architecture decisions

One might ask themselves why the unoserver wasn't made to be a separate, mu-semtech independent
microservice in the stack. The reason for having the unoserver hosted within the same container as
the microservice is that both when using the `unoserver` module's *server* functionality, as well as the
*convert "client functionality"*, the `uno` module is required. The `uno` module is provided by a libreoffice install (or some dependency of it. To be researched.).
While it would be technically possible to install libreoffice in both containers, and to only use the install for the `uno` module it provides in the mu-semtech specific conversion ("client") service, we opted to keep it simple here for now.  
