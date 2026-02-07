from fastapi import UploadFile
from app.services.sinapi_service import extract_metadata, SinapiMetadata

def extract_metadata_from_file(file: UploadFile) -> SinapiMetadata:
    """
    Helper to read UploadFile and extract metadata.
    """
    content = file.file.read()
    return extract_metadata(content)
