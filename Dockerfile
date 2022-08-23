FROM semtech/mu-python-template:2.0.0-beta.1

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

RUN python3 -m pip install unoserver


ENV URE_BOOTSTRAP "vnd.sun.star.pathname:/usr/lib/libreoffice/program/fundamentalrc"
ENV PATH "/usr/lib/libreoffice/program:$PATH"
ENV UNO_PATH "/usr/lib/libreoffice/program"
# especially the /usr/lib/python3/dist-packages is of importance. uno.py (installed through libreoffice libs), required by the uniserver executable
# as well as the unoserver module used in this services' code,
# ends up in the global (/usr/lib) python install (which is 3.9?) while gunicorn etc runs on the local install (/usr/local/lib)
# (which is 3.8?)
ENV PYTHONPATH "/usr/lib/libreoffice/program:/usr/lib/python3/dist-packages:$PYTHONPATH"

CMD unoserver --daemon; /start.sh