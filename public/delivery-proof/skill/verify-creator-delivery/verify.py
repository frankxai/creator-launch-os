"""Compare an explicit local file with a Creator Launch OS package receipt."""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path


def compare(receipt, artifact, member):
    if receipt.stat().st_size > 2 * 1024 ** 2:
        raise ValueError("Receipt exceeds 2 MiB")
    data = json.loads(receipt.read_bytes())
    if not isinstance(data, dict):
        raise ValueError("Expected a receipt object")
    source = data.get("source")
    if not isinstance(source, dict):
        raise ValueError("Missing release source")
    core = (data.get("name") == "creator-launch-os"
            and source.get("repository") == "https://github.com/frankxai/creator-launch-os")
    version = data.get("version")
    revision = source.get("revision")
    artifact_info = data.get("artifact")
    kit = (data.get("sku_id") == "sku_creator_launch_os_v1" and isinstance(version, str)
           and re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version) and isinstance(revision, str)
           and isinstance(artifact_info, dict)
           and artifact_info.get("filename") == f"creator-launch-os-commercial-kit-{version}-{revision[:12]}.zip")
    if (data.get("schema_version") != "1.0.0" or not (core or kit)
            or not isinstance(source.get("revision"), str)
            or not re.fullmatch("[0-9a-f]{40}", source["revision"])
            or not isinstance(data.get("files"), list)):
        raise ValueError("Choose a Creator Launch OS package receipt")
    entries = ([row for row in data["files"] if isinstance(row, dict) and row.get("path") == member]
               if member else [data.get("artifact")])
    if len(entries) != 1 or not isinstance(entries[0], dict):
        raise ValueError("Expected exactly one receipt entry")
    entry = entries[0]
    if (type(entry.get("bytes")) is not int or entry["bytes"] < 0
            or not isinstance(entry.get("sha256"), str)
            or not re.fullmatch("[a-f0-9]{64}", entry["sha256"])):
        raise ValueError("Invalid size or fingerprint")
    digest = hashlib.sha256()
    size = 0
    with artifact.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
            size += len(block)
    return {"kind": "local_file_comparison", "revision": source["revision"], "member": member,
            "expected_sha256": entry["sha256"], "actual_sha256": digest.hexdigest(),
            "expected_bytes": entry["bytes"], "actual_bytes": size,
            "matches": entry["bytes"] == size and entry["sha256"] == digest.hexdigest()}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("receipt", type=Path)
    parser.add_argument("artifact", type=Path)
    parser.add_argument("--member", help="Exact path in the receipt (omit to compare the archive)")
    args = parser.parse_args()
    try:
        result = compare(args.receipt, args.artifact, args.member)
        print(json.dumps(result, indent=2))
        sys.exit(0 if result["matches"] else 1)
    except (OSError, ValueError) as error:
        sys.exit(str(error))
