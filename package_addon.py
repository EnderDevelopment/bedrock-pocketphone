from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "PocketPhone.mcaddon"
PACK_NAME = "PocketPhone.mcpack"


def add_pack_files(archive: ZipFile) -> None:
    paths = [ROOT / "manifest.json", *sorted((ROOT / "scripts").glob("*.js"))]
    for path in paths:
        if path.is_file():
            archive.write(path, path.relative_to(ROOT).as_posix())


def build() -> None:
    pack_bytes_path = ROOT / PACK_NAME
    try:
        with ZipFile(pack_bytes_path, "w", ZIP_DEFLATED) as pack:
            add_pack_files(pack)

        with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as addon:
            addon.write(pack_bytes_path, PACK_NAME)
    finally:
        pack_bytes_path.unlink(missing_ok=True)

    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    build()
