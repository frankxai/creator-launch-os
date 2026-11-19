"""Build the portable skill using stable names, permissions and timestamps."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

edition = Path(__file__).resolve().parents[1] / "public" / "delivery-proof"
name = "verify-creator-delivery"
with ZipFile(edition / "verification-skill.zip", "w") as archive:
    for filename, source in [
        ("SKILL.md", edition / "skill" / name / "SKILL.md"),
        ("verify.py", edition / "skill" / name / "verify.py"),
        ("LICENSE.txt", edition / "LICENSE.txt"),
    ]:
        info = ZipInfo(f"{name}/{filename}", date_time=(2026, 11, 19, 0, 0, 0))
        info.create_system = 3
        info.external_attr = 0o100644 << 16
        archive.writestr(info, source.read_bytes(), compress_type=ZIP_DEFLATED)
