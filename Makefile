.PHONY: proto build run docker-build docker-up docker-down clean

# protoファイルのコンパイル
proto:
	@echo "Generating gRPC code..."
	@which protoc > /dev/null || (echo "protoc not found. Install: https://grpc.io/docs/protoc-installation/" && exit 1)
	@protoc --go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		proto/scheduler/v1/scheduler.proto
	@echo "Proto files generated successfully"

# ビルド
build:
	@echo "Building..."
	@go build -o bin/scheduler ./cmd/server

# 実行
run: build
	@./bin/scheduler

# Dockerビルド
docker-build:
	@docker build -t recurrence-scheduler .

# Docker起動
docker-up:
	@docker-compose up -d

# Docker停止
docker-down:
	@docker-compose down

# クリーンアップ
clean:
	@rm -rf bin/ data/*.db

# 依存関係のダウンロード
deps:
	@go mod download
	@go mod tidy
