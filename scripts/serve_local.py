#!/usr/bin/env python3
"""Local-only development server with explicit no-cache responses."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os


HERE = Path(__file__).resolve().parent
ROOT = HERE / "dist" if (HERE / "dist").exists() else HERE.parent / "dist"
HOST = "127.0.0.1"
PORT = int(os.environ.get("GARMENT_QUALITY_PORT", "8765"))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/health":
            body = json.dumps({"ok": True, "service": "factorysphere-local"}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"FactorySphere: http://{HOST}:{PORT}/", flush=True)
    server.serve_forever()
