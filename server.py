#!/usr/bin/env python3
"""
간단한 HTTP 서버를 실행합니다.
Python이 설치되어 있어야 합니다.

사용법:
    python server.py

그 다음 브라우저에서 http://localhost:8000 접속
"""

import http.server
import socketserver
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS 헤더 추가
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 서버가 http://localhost:{PORT} 에서 실행 중입니다.")
        print(f"📂 브라우저에서 http://localhost:{PORT}/index.html 을 열어주세요.")
        print("   종료하려면 Ctrl+C를 누르세요.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n서버를 종료합니다.")

if __name__ == "__main__":
    main()
