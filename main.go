package main

import (
	"embed"
	"net/http"
)

var HELP_HEADER = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LobeLabyrinth - A MindMaze Adventure</title>
    
    <!-- PWA Meta Tags -->
    <meta name="description" content="Navigate the castle of knowledge through wisdom and wit in this medieval-themed educational game">
    <meta name="theme-color" content="#D4AF37">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="LobeLabyrinth">
    <meta name="mobile-web-app-capable" content="yes">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="manifest.json">
    
    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiBmaWxsPSIjMkMxODEwIiByeD0iMjQiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRDRBRjM3Ij4KPHA+8J+PsD48L3A+Cjwvc3ZnPgo8L3N2Zz4K">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="css/game.css">
    <link rel="stylesheet" href="css/achievements.css">
    <link rel="stylesheet" href="css/victory.css">
    <link rel="stylesheet" href="css/accessibility.css">
</head>
<body>
`
var HELP_FOOTER = `
</body>
</html>
`
var HELP_CONTENT = HELP_HEADER + READMEHTML() + HELP_FOOTER

//go:embed README.md
var README string

func READMEHTML() string {
	// Convert README markdown to HTML (simple conversion for demo purposes)
	// In a real application, consider using a markdown library for better conversion
	html := "<pre>" + README + "</pre>"
	return html
}

//go:embed */*.css */*.json */*.js *.html *.ico manifest.json
var staticFS embed.FS

func main() {
	serve(HELP_CONTENT, staticFS)
}
func serve(helpContent string, staticFS embed.FS) {
	// serve the filesystem using an HTTP server
	// if a request is made to /help, serve the helpContent
	http.HandleFunc("/help", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(helpContent))
	})
	// serve static files (css, js, manifest.json)
	fileserver := http.FileServer(http.FS(staticFS))
	http.Handle("/", fileserver)
	http.ListenAndServe(":8080", nil)
}
