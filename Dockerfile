FROM oven/bun

COPY package.json ./
COPY tsconfig.json ./
COPY bun.lock ./
COPY src ./src

RUN apt update
RUN apt install -y protobuf-compiler
RUN bun install && bun run proto && bun run client
CMD ["bun", "run", "server"]