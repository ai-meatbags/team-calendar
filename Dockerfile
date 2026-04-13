ARG APP_HOME
ARG PORT

FROM node:22-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
ARG APP_HOME
WORKDIR ${APP_HOME}

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build

COPY . .
RUN ./node_modules/.bin/next build

FROM node:22-bookworm-slim AS runtime

ARG APP_HOME
ARG PORT

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV APP_HOME=${APP_HOME}
ENV PORT=${PORT}
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
WORKDIR ${APP_HOME}

RUN apt-get update \
  && apt-get install -y --no-install-recommends gosu locales \
  && sed -i '/^# *en_US.UTF-8 UTF-8/s/^# *//' /etc/locale.gen \
  && locale-gen \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 teamcal \
  && useradd --system --uid 1001 --gid 1001 --create-home --home-dir /home/teamcal teamcal \
  && mkdir -p "${APP_HOME}" \
  && chown -R teamcal:teamcal "${APP_HOME}"

COPY --from=deps ${APP_HOME}/package.json ${APP_HOME}/package-lock.json ./
COPY --from=deps ${APP_HOME}/node_modules ./node_modules
COPY --from=build ${APP_HOME}/.next ./.next
COPY --from=build ${APP_HOME}/public ./public
COPY --from=build ${APP_HOME}/drizzle ./drizzle
COPY --from=build ${APP_HOME}/drizzle.config.ts ./drizzle.config.ts
COPY --from=build ${APP_HOME}/next.config.mjs ./next.config.mjs
COPY --from=build ${APP_HOME}/tsconfig.json ./tsconfig.json
COPY --from=build ${APP_HOME}/scripts ./scripts
COPY --from=build ${APP_HOME}/src ./src
COPY --chmod=755 scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

EXPOSE ${PORT}

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["sh", "-lc", "npm run db:migrate && npm run start"]
