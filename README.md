# File conversion service

A service that can convert `docx` to `pdf` files through a HTTP call.

```
curl -X POST http://localhost:7789/files/6304c8357801f1000d000002/convert
```

### compose config for development

```yml
file-conversion:
  build: /path/to/file-conversion-service
  environment:
    MODE: "development"
    LOG_LEVEL: "DEBUG"
  volumes:
    - "/path/to/file-conversion-service:/app"
    - ./data/files:/share
  ports:
   - 127.0.0.1:7789:80
```

### Architecture decisions

One might ask themselves why the unoserver wasn't made to be a separate, mu-semtech independent
microservice in the stack. The reason for having the unoserver hosted within the same container as
the microservice is that both when using the `unoserver` module's *server* functionality, as well as the
*convert "client functionality"*, the `uno` module is required. The `uno` module is provided by a libreoffice install (or some dependency of it. To be researched.).
While it would be technically possible to install libreoffice in both containers, and to only use the install for the `uno` module it provides in the mu-semtech specific conversion ("client") service, we opted to keep it simple here for now.  