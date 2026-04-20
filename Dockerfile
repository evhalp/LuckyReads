# check=skip=UndefinedVar
FROM python:3.13.7-alpine3.22

LABEL maintainer="jhooth@ufl.edu"

ENV PYTHONUNBUFFERED=1

WORKDIR /app

ARG DEV=false

RUN python -m venv /py && \
    /py/bin/pip install --upgrade pip && \
    apk add --update --no-cache postgresql-client jpeg-dev && \
    apk add --update --no-cache xmlsec-dev curl && \
    apk add --update --no-cache findutils && \
    apk add --update --no-cache --virtual .tmp-build-deps \
    build-base gcc musl-dev zlib zlib-dev linux-headers \
    libressl libffi-dev libxslt-dev libxml2-dev \
    postgresql-dev

COPY ./requirements.txt /app/requirements.txt
COPY ./scripts /scripts

RUN /py/bin/pip install --no-cache-dir -r requirements.txt && \
    apk del .tmp-build-deps && \
    adduser \
        --disabled-password \
        --no-create-home \
        django-user && \
    mkdir -p /vol/web/media && \
    mkdir -p /vol/web/static && \
    chown -R django-user:django-user /vol && \
    chown -R django-user:django-user /app && \
    chown -R django-user:django-user /scripts && \
    chmod -R 755 /vol && \
    chmod -R +x /scripts

COPY ./app /app/app

WORKDIR /app/app

ENV PATH="/scripts:/py/bin:/usr/bin:$PATH"
ENV PYTHONPATH="/app/app"

USER django-user

CMD ["entrypoint.sh"]