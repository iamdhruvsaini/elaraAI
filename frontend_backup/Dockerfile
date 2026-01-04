FROM node:20-alpine
WORKDIR /src

COPY package.json ./

ARG NODE_ENV

RUN if [ "$NODE_ENV" = "production" ]; then \
        npm ci --omit=dev; \
    else \
        npm install; \
    fi

# Only copy and build in production
RUN if [ "$NODE_ENV" = "production" ]; then \
        COPY . ./; \
        npm run build; \
    fi

EXPOSE 3000