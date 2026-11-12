"""Copy the shared files into lite/ so it can be deployed on its own (Vercel Root Directory = lite).
Run from the project root after changing shared code:  python scripts/sync_lite.py"""
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[1]
for name in ("meta.py", "heuristics.py", "schemas.py", "tracing.py"):
    shutil.copy(root / "backend" / "app" / name, root / "lite" / "app" / name)
dst = root / "lite" / "frontend"
shutil.rmtree(dst, ignore_errors=True)
shutil.copytree(root / "frontend", dst)
print("lite/ synced")
