FROM docker.io/node:lts-alpine

ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

RUN addgroup --system formoatlas && \
  adduser --system -G formoatlas formoatlas

COPY dist/apps/api formoatlas/
COPY dist/apps/web/browser formoatlas/assets/
RUN chown -R formoatlas:formoatlas .

RUN npm --prefix formoatlas --omit=dev -f install

CMD [ "node", "formoatlas" ]
