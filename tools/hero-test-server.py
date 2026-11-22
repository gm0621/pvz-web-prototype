#!/usr/bin/env python3
"""Loopback-only Hero test server. Production files are never modified."""
import argparse
import http.server
import mimetypes
from pathlib import Path
import threading
import urllib.parse
import webbrowser

ROOT = Path(__file__).resolve().parent.parent
KEY = 'heroLegendLocalTest_v1'


def instrument_app(source):
    marker = 'SAVE_KEY,normalizeProgress'
    if source.count(marker) != 1 or source.count("const $=id=>") != 1:
        raise ValueError('app.mjs 結構已變動，請更新本機測試工具。')
    source = source.replace(marker, 'SAVE_KEY as PLAYER_SAVE_KEY,normalizeProgress', 1)
    source = source.replace('const $=id=>', "const SAVE_KEY='" + KEY + "';\nconst $=id=>", 1)
    source = source.replace('function show(id){', 'function show(id){queueMicrotask(positionLocalTestButton);', 1)
    return source + '\n' + (ROOT / 'tools/hero-test-hook.mjs').read_text()


class LocalServer(http.server.ThreadingHTTPServer):
    request_queue_size = 128


class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    def do_GET(self):
        expected = {'127.0.0.1:' + str(self.server.server_port), 'localhost:' + str(self.server.server_port)}
        if self.headers.get('Host') not in expected:
            self.send_error(403)
            return
        pathname = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        if pathname == '/':
            self.send_response(302)
            self.send_header('Location', '/hero/')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return
        if not pathname.startswith(('/hero/', '/assets/')):
            self.send_error(404)
            return
        if pathname.endswith('/'):
            pathname += 'index.html'
        file = (ROOT / pathname.lstrip('/')).resolve()
        if not file.is_relative_to(ROOT / 'hero') and not file.is_relative_to(ROOT / 'assets'):
            self.send_error(403)
            return
        try:
            body = instrument_app(file.read_text()).encode() if pathname == '/hero/app.mjs' else file.read_bytes()
        except FileNotFoundError:
            self.send_error(404)
            return
        except (ValueError, OSError) as error:
            self.send_error(500, 'Local test adapter needs an update')
            return
        self.send_response(200)
        self.send_header('Content-Type', 'text/javascript; charset=utf-8' if file.suffix == '.mjs' else mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        if args and str(args[1]) not in ('200', '302'):
            super().log_message(format, *args)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='英雄演義本機跳關測試')
    parser.add_argument('--port', type=int, default=4188)
    parser.add_argument('--open', action='store_true')
    args = parser.parse_args()
    server = LocalServer(('127.0.0.1', args.port), Handler)
    url = f'http://127.0.0.1:{server.server_port}/hero/'
    print(f'本機測試已啟動：{url}\n只供這台電腦使用。按 Ctrl+C 關閉。', flush=True)
    if args.open:
        threading.Timer(.3, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
