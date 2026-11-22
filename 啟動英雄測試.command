#!/bin/zsh
cd -- "${0:A:h}"
if ! command -v python3 >/dev/null 2>&1; then
  print '需要 Python 3.9 或以上版本才能啟動本機測試。'
  read '?按 Enter 關閉'
  exit 1
fi
python3 tools/hero-test-server.py --open
read '?測試服務已結束。按 Enter 關閉'
