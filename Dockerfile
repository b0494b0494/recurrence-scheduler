# マルチステージビルドで軽量化
FROM golang:1.23-alpine AS builder

# protocとprotoc-gen-go-grpcをインストール
RUN apk add --no-cache protobuf protoc protobuf-dev

WORKDIR /app

# 依存関係をコピー
COPY go.mod ./
RUN go mod download

# protocプラグインをインストール
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
RUN go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@v2.19.1

# googleapisをダウンロード（protoファイルで使用）
RUN apk add --no-cache git && \
    mkdir -p /tmp && \
    git clone --depth 1 https://github.com/googleapis/googleapis.git /tmp/googleapis || \
    (curl -sSL https://github.com/googleapis/googleapis/archive/refs/heads/master.zip -o /tmp/googleapis.zip && \
     unzip -q /tmp/googleapis.zip -d /tmp && \
     mv /tmp/googleapis-master /tmp/googleapis) || true

# protoファイルをコピーしてコンパイル
COPY proto/ ./proto/
RUN protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    --grpc-gateway_out=. --grpc-gateway_opt=paths=source_relative \
    -I/tmp/googleapis -I. \
    proto/scheduler/v1/scheduler.proto

# ソースコードをコピー
COPY . .

# go.sumを更新
RUN go mod tidy

# バイナリをビルド
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o scheduler ./cmd/server

# フロントエンドビルドステージ
FROM node:20-alpine AS frontend-builder

WORKDIR /app/web

# フロントエンドの依存関係をコピーしてインストール
COPY web/package.json ./
RUN npm install

# フロントエンドソースをコピーしてビルド
COPY web/ ./
RUN npm run build

# 軽量なランタイムイメージ
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# ビルドしたバイナリとビルド済みwebディレクトリをコピー
COPY --from=builder /app/scheduler .
COPY --from=frontend-builder /app/web/dist ./web

EXPOSE 50051 8080

CMD ["./scheduler"]
