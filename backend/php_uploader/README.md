# PHP Uploader

Small Hostinger-friendly upload service for the Rust API.

The Rust API sends multipart files to `upload.php` with a UUID `file_id`.
Only that id is stored in the main database. Files and metadata live on the
Hostinger server.

## Deploy

Upload this `php_uploader` folder to Hostinger, for example:

```txt
public_html/php_uploader
```

Create writable directories:

```txt
php_uploader/uploads
php_uploader/storage
php_uploader/storage/meta
```

Set permissions so PHP can write to them.

## Configure

Copy `config.example.php` to `config.local.php` and set a strong token:

```php
<?php
return [
    'upload_token' => 'change-this-secret',
];
```

Configure the VPS Rust app:

```txt
PHP_UPLOADER_BASE_URL=https://your-domain.com/php_uploader
PHP_UPLOADER_TOKEN=change-this-secret
```

Alternatively set `PHP_UPLOADER_UPLOAD_URL` directly:

```txt
PHP_UPLOADER_UPLOAD_URL=https://your-domain.com/php_uploader/upload.php
```

## API

Upload:

```bash
curl -X POST "https://your-domain.com/php_uploader/upload.php" \
  -H "X-Upload-Token: change-this-secret" \
  -F "file_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "namespace=sales/profile-photo" \
  -F "owner_id=user-id" \
  -F "file=@profile.jpg"
```

Response:

```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
  "path": "sales/profile-photo/user-id/550e8400-e29b-41d4-a716-446655440000.jpg",
  "url": "https://your-domain.com/php_uploader/file.php?id=550e8400-e29b-41d4-a716-446655440000"
}
```

Fetch:

```txt
GET /php_uploader/file.php?id=<file-id>
```
