package main

import (
	"net/http"
	"log"
)

func main() {
    assetsFileServer := http.FileServer(http.Dir("./assets"))
	http.Handle("/assets/", http.StripPrefix("/assets/", assetsFileServer))
	
	http.Handle("/", http.FileServer(http.Dir("./pages")))
	log.Println("Server running at http://localhost:4000")
    http.ListenAndServe(":4000", nil)	
}
