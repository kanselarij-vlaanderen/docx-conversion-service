FROM semtech/mu-python-template:2.0.0-beta.1

# Libreoffice install including UNO libraries
RUN apt-get update \
    && apt-get install -y \
        libreoffice \
        libreoffice-writer \
        ure \
        libreoffice-java-common \
        libreoffice-core \
        libreoffice-common \
    && apt-get remove -y libreoffice-gnome \
    && apt-get autoremove -y


# Libreoffice language packs (not sure if required for pdf conversion)
RUN apt-get install -y \
    libreoffice-l10n-en-gb \
    libreoffice-l10n-nl \
    libreoffice-l10n-fr \
    libreoffice-l10n-de 


# Flanders fonts
RUN mkdir /usr/share/fonts/truetype/flanders

ADD https://d1l6j3bn1os9t0.cloudfront.net/3.latest/fonts/flanders/flanders-sans-bold.ttf /usr/share/fonts/truetype/flanders
ADD https://d1l6j3bn1os9t0.cloudfront.net/3.latest/fonts/flanders/flanders-sans-light.ttf /usr/share/fonts/truetype/flanders
ADD https://d1l6j3bn1os9t0.cloudfront.net/3.latest/fonts/flanders/flanders-sans-medium.ttf /usr/share/fonts/truetype/flanders
ADD https://d1l6j3bn1os9t0.cloudfront.net/3.latest/fonts/flanders/flanders-sans-regular.ttf /usr/share/fonts/truetype/flanders
ADD https://d1l6j3bn1os9t0.cloudfront.net/3.latest/fonts/flanders/flanders-serif-bold.ttf /usr/share/fonts/truetype/flanders
ADD https://d1l6j3bn1os9t0.cloudfront.net/3.latest/fonts/flanders/flanders-serif-light.ttf /usr/share/fonts/truetype/flanders
ADD https://d1l6j3bn1os9t0.cloudfront.net/3.latest/fonts/flanders/flanders-serif-medium.ttf /usr/share/fonts/truetype/flanders
ADD https://d1l6j3bn1os9t0.cloudfront.net/3.latest/fonts/flanders/flanders-serif-regular.ttf /usr/share/fonts/truetype/flanders

RUN fc-cache -fv


# Unoserver
# - Hosting Libreoffice UNO server through Python bindings
# - Python UNO client libraries for conversion (to pdf)
RUN python3 -m pip install unoserver


ENV URE_BOOTSTRAP "vnd.sun.star.pathname:/usr/lib/libreoffice/program/fundamentalrc"
ENV PATH "/usr/lib/libreoffice/program:$PATH"
ENV UNO_PATH "/usr/lib/libreoffice/program"
# especially the /usr/lib/python3/dist-packages is of importance. uno.py (installed through libreoffice libs), required by the unoserver executable
# as well as the unoserver module used in this services' code,
# ends up in the global (/usr/lib) python install (which is 3.9?) while gunicorn etc runs on the local install (/usr/local/lib)
# (which is 3.8?)
ENV PYTHONPATH "/usr/lib/libreoffice/program:/usr/lib/python3/dist-packages:$PYTHONPATH"

CMD unoserver --daemon; sleep 10; /start.sh