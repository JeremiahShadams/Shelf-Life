"""Direct reproduction of the scan 500 without HTTP layer."""
import asyncio
import struct
import zlib
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, ".")

from app.database import async_session
from app.services.scan_service import process_scan


def make_png(w=64, h=64) -> bytes:
    def chunk(typ, data):
        c = struct.pack(">I", len(data)) + typ + data
        return c + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    raw = b"".join(b"\x00" + b"\xff\x00\x00" * w for _ in range(h))
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) +
            chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))


async def main():
    png = make_png()
    try:
        async with async_session() as db:
            result = await process_scan(png, "test.png", db)
            print("OK ->", str(result)[:600])
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
