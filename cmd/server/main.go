package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/recurrence-scheduler/internal/server"
	"github.com/recurrence-scheduler/internal/storage"
	pb "github.com/recurrence-scheduler/proto/scheduler/v1"
)

var (
	grpcPort = flag.String("grpc-port", "50051", "gRPC server port")
	httpPort = flag.String("http-port", "8080", "HTTP server port")
	dbPath   = flag.String("db", "./data/scheduler.db", "Database file path")
)

func main() {
	flag.Parse()

	// データディレクトリを作成
	if err := os.MkdirAll("data", 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	// ストレージを初期化
	st, err := storage.NewSQLiteStorage(*dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}
	defer st.Close()

	// gRPCサーバーを作成
	grpcServer := grpc.NewServer()
	srv := server.NewServer(st)
	pb.RegisterSchedulerServiceServer(grpcServer, srv)

	// gRPCリスナーを作成
	grpcLis, err := net.Listen("tcp", fmt.Sprintf(":%s", *grpcPort))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	// gRPCサーバーを起動（goroutineで）
	go func() {
		log.Printf("gRPC server listening on port %s", *grpcPort)
		if err := grpcServer.Serve(grpcLis); err != nil {
			log.Fatalf("Failed to serve gRPC: %v", err)
		}
	}()

	// gRPC-Gatewayを作成
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	mux := runtime.NewServeMux()
	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	
	err = pb.RegisterSchedulerServiceHandlerFromEndpoint(ctx, mux, fmt.Sprintf("localhost:%s", *grpcPort), opts)
	if err != nil {
		log.Fatalf("Failed to register gateway: %v", err)
	}

	// CORS対応のラッパー
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		mux.ServeHTTP(w, r)
	})

	// 静的ファイル
	fs := http.FileServer(http.Dir("./web"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || r.URL.Path == "/index.html" {
			http.ServeFile(w, r, "./web/index.html")
		} else if strings.HasPrefix(r.URL.Path, "/api/") {
			handler.ServeHTTP(w, r)
		} else {
			fs.ServeHTTP(w, r)
		}
	})

	// HTTPサーバーを起動
	log.Printf("HTTP server listening on port %s", *httpPort)
	log.Printf("Frontend available at http://localhost:%s", *httpPort)
	log.Printf("gRPC-Gateway API available at http://localhost:%s/api/v1", *httpPort)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", *httpPort), nil); err != nil {
		log.Fatalf("Failed to serve HTTP: %v", err)
	}
}
