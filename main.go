package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
)

// below comment tells go's compiler to copy the pages and assets folders into the compiled program
// "content" becomes a virtual file system holding those files

//go:embed pages assets
var content embed.FS

func main() {
	//go functions return errors as the second value rather than throwing exceptions
	//they return nil unless there is an error
	pagesFS, err := fs.Sub(content, "pages") //creates a sub file system with /pages as its root
	if err != nil {
		log.Fatal(err)
	}
	assetsFS, err := fs.Sub(content, "assets")
	if err != nil {
		log.Fatal(err)
	}

	//"multiplexer" - go's router that checks the request URL and decides which handler should respond
	mux := http.NewServeMux()
	//strip prefix removes /assets from the path, and just looks for
	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.FS(assetsFS))))
	mux.Handle("/", http.FileServer(http.FS(pagesFS)))

	port := os.Getenv("PORT") //read the port env variable that Vercel sets
	if port == "" {           //if running locally, this env variable wont exist
		port = "4000" //port used for local development
	}
	log.Println("Server running on port " + port)
	log.Fatal(http.ListenAndServe(":"+port, mux)) //listenAndServe only returns if theres an error, which will be printed by Log.Fatal
}
