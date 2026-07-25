import os
import requests
import logging

logger = logging.getLogger("supabase_storage")

def upload_logo_to_supabase(file_content: bytes, filename: str, content_type: str) -> str:
    """
    Uploads a company logo to the configured Supabase Storage bucket and returns the public URL.
    Returns None if Supabase environment variables are missing or if the upload fails.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    bucket_name = os.getenv("SUPABASE_BUCKET", "company-logos")

    if not supabase_url or not supabase_key:
        logger.warning("Supabase storage is not configured (SUPABASE_URL or SUPABASE_KEY missing).")
        return None

    # Normalize url (strip trailing slashes)
    supabase_url = supabase_url.rstrip("/")

    # Supabase storage REST API endpoint for uploading:
    # POST /storage/v1/object/{bucket}/{filename}
    upload_url = f"{supabase_url}/storage/v1/object/{bucket_name}/{filename}"

    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apikey": supabase_key,
        "Content-Type": content_type,
        "x-upsert": "true"  # Overwrites the file if it already exists
    }

    try:
        response = requests.post(upload_url, data=file_content, headers=headers)
        if response.status_code == 200:
            # Public access URL format:
            # https://[ref].supabase.co/storage/v1/object/public/[bucket]/[filename]
            public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{filename}"
            logger.info(f"Successfully uploaded logo to Supabase Storage: {public_url}")
            return public_url
        else:
            logger.error(f"Failed to upload to Supabase: Status {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Exception during Supabase logo upload: {str(e)}")
        return None
