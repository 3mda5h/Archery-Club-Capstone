package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	//"multiplexer" - go's router that checks the request URL and decides which handler should respond
	mux := http.NewServeMux()

	//for testing
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "ok")
	})

	port := os.Getenv("PORT") //read the port env variable that Vercel sets
	if port == "" {           //if running locally, this env variable wont exist
		port = "4000"                                          //port used for local development
		mux.Handle("/", http.FileServer(http.Dir("./public"))) //serve public folder on local machine
	}
	log.Fatal(http.ListenAndServe(":"+port, mux)) //listenAndServe only returns if theres an error, which will be printed by Log.Fatal
}
