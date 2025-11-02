#!/bin/bash
# gRPCサーバーテスト用スクリプト

echo "=== Testing gRPC Server ==="
echo "Server: localhost:50051"
echo ""

# grpcurlがインストールされているか確認
if command -v grpcurl &> /dev/null; then
    echo "📋 Available RPC methods:"
    grpcurl -plaintext localhost:50051 list
    echo ""
    
    echo "📋 SchedulerService methods:"
    grpcurl -plaintext localhost:50051 list scheduler.v1.SchedulerService
    echo ""
    
    echo "✅ Server is accessible!"
else
    echo "⚠️  grpcurl is not installed"
    echo "Install: https://github.com/fullstorydev/grpcurl"
    echo ""
    echo "Or use the Go client: go run cmd/client/main.go"
fi
