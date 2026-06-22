import re
import sys
import os
from pathlib import Path

FILE_BLOCK_RE = re.compile(
    r"^\s*//\s*@file\s+(.+?)\s*$\n(.*?)^\s*//\s*@endfile\s*$",
    re.MULTILINE | re.DOTALL,
)


def to_ts_import_path(path: str) -> str:
    path = path.replace(os.sep, "/")

    if not path.startswith("."):
        path = "./" + path

    return path


def rewrite_property_panel_imports(
    content: str,
    source_file: Path,
    output_root: Path,
) -> str:
    property_panel_dir = output_root / "property-panel"

    relative_path = os.path.relpath(
        property_panel_dir,
        start=source_file.parent,
    )

    import_prefix = to_ts_import_path(relative_path)

    return content.replace(
        '"./property-panel/',
        f'"{import_prefix}/',
    ).replace(
        "'./property-panel/",
        f"'{import_prefix}/",
    )


def split_marked_files(
    source_file: Path,
    output_root: Path,
    clean_source: bool = True,
) -> None:
    source_file = source_file.resolve()
    output_root = output_root.resolve()

    source = source_file.read_text(
        encoding="utf-8"
    )

    matches = list(
        FILE_BLOCK_RE.finditer(source)
    )

    if not matches:
        print("No @file blocks found.")
        return

    main_block_content = None

    for match in matches:
        relative_path = match.group(1).strip()
        content = match.group(2).strip() + "\n"

        target_file = (
            output_root / relative_path
        ).resolve()

        if not str(target_file).startswith(
            str(output_root)
        ):
            raise ValueError(
                f"Unsafe path: {relative_path}"
            )

        target_file.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        target_file.write_text(
            content,
            encoding="utf-8"
        )

        print(f"written: {target_file}")

        if Path(relative_path).name == source_file.name:
            main_block_content = content

    if clean_source:
        if main_block_content is None:
            print(
                "Source not cleaned: no @file block matching source filename."
            )
            return

        cleaned_content = rewrite_property_panel_imports(
            content=main_block_content,
            source_file=source_file,
            output_root=output_root,
        )

        source_file.write_text(
            cleaned_content,
            encoding="utf-8"
        )

        print(f"cleaned source: {source_file}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(
            "Usage: python split_marked_files.py <source-file> <output-root> [--no-clean]"
        )
        sys.exit(1)

    source_file = Path(sys.argv[1])
    output_root = Path(sys.argv[2])
    clean_source = "--no-clean" not in sys.argv

    split_marked_files(
        source_file=source_file,
        output_root=output_root,
        clean_source=clean_source,
    )