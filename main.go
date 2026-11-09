package main

import (
	"log"
	"net/http"
	"os"
	
	"time"
	"errors"
	"io/fs"
	"github.com/joho/godotenv"
	"github.com/3mda5h/Archery-Club-Capstone/internal/auth"
)

func main() {
	// Load variables from .env 
	if err := godotenv.Load(); err != nil && !errors.Is(err, fs.ErrNotExist) {
		log.Printf("could not read .env: %v", err)
	}

	//"multiplexer" - go's router that checks the request URL and decides which handler should respond
	mux := http.NewServeMux()

	port := os.Getenv("PORT") //read the port env variable that Vercel sets
	onVercel := port != ""
	if !onVercel { //if running locally, this env variable wont exist
		port = "4000"                                          //port used for local development
		mux.Handle("/", http.FileServer(http.Dir("./public"))) //serve public folder on local machine
	}

	// TODO: Replace with database backed store
	authService := auth.New(auth.Config{
		Store:             auth.NewMemoryStore(),
		AdminPasswordHash: adminPasswordHash(),
		TrustProxyHeaders: onVercel, 
		SecureCookies:     onVercel, 
	})
	authService.Routes(mux)

	srv := &http.Server{
		Addr: ":" + port,
		// Rejects cross-site form posts and fetches (CSRF) on POST endpoints.
		Handler:           http.NewCrossOriginProtection().Handler(mux),
		ReadHeaderTimeout: 10 * time.Second, // don't let slow clients hold connections open
	}
	if !onVercel {
		log.Printf("listening on http://localhost:%s", port)
	}
	log.Fatal(srv.ListenAndServe()) //listenAndServe only returns if theres an error, which will be printed by Log.Fatal
}

// adminPasswordHash reads ADMIN_PASSWORD and hashes it right away so the
// plain text isn't kept around. It returns nil, disabling admin login, if
// the variable isn't set.
func adminPasswordHash() []byte {
	pw := os.Getenv("ADMIN_PASSWORD")
	if pw == "" {
		log.Println("ADMIN_PASSWORD is not set, so admin login is disabled")
		return nil
	}
	h, err := auth.HashPassword(pw)
	if err != nil {
		log.Fatalf("ADMIN_PASSWORD: %v", err)
	}
	return h
}
