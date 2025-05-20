FROM oven/bun

COPY package.json ./
COPY tsconfig.json ./
COPY bun.lock ./
COPY src ./src

RUN bun install && ls && bun run client
CMD ["bun", "run", "server"]