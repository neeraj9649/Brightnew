<?php

declare(strict_types=1);

$config = require __DIR__ . '/config.php';

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

function clean_segment(string $value, string $fallback): string
{
    $value = trim($value);
    $value = preg_replace('/[^A-Za-z0-9._\/-]+/', '-', $value);
    $value = trim((string) $value, './-');
    return $value !== '' ? $value : $fallback;
}

function is_uuid(string $value): bool
{
    return (bool) preg_match(
        '/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/',
        $value
    );
}

function request_token(): string
{
    return $_SERVER['HTTP_X_UPLOAD_TOKEN']
        ?? $_POST['token']
        ?? '';
}

function public_base_url(): string
{
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        ? 'https'
        : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $dir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
    return $scheme . '://' . $host . ($dir === '' ? '' : $dir);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed'], 405);
}

$expectedToken = (string) ($config['upload_token'] ?? '');
if ($expectedToken === '') {
    json_response(['success' => false, 'message' => 'Upload token is not configured'], 500);
}
if ($expectedToken !== '' && !hash_equals($expectedToken, request_token())) {
    json_response(['success' => false, 'message' => 'Invalid upload token'], 401);
}

if (!isset($_FILES['file'])) {
    json_response(['success' => false, 'message' => 'Missing file field'], 400);
}

$file = $_FILES['file'];
if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    json_response(['success' => false, 'message' => 'Upload failed'], 400);
}

$maxFileSize = (int) ($config['max_file_size'] ?? (10 * 1024 * 1024));
if (($file['size'] ?? 0) <= 0 || ($file['size'] ?? 0) > $maxFileSize) {
    json_response(['success' => false, 'message' => 'Invalid file size'], 400);
}

$fileId = trim((string) ($_POST['file_id'] ?? ''));
if (!is_uuid($fileId)) {
    json_response(['success' => false, 'message' => 'Invalid file_id'], 400);
}

$originalName = basename((string) ($file['name'] ?? 'file.bin'));
$extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
if ($extension === '') {
    $extension = 'bin';
}

$allowedExtensions = $config['allowed_extensions'] ?? [];
if (is_array($allowedExtensions) && !in_array($extension, $allowedExtensions, true)) {
    json_response(['success' => false, 'message' => 'File extension not allowed'], 400);
}

$namespace = clean_segment((string) ($_POST['namespace'] ?? 'files'), 'files');
$ownerId = clean_segment((string) ($_POST['owner_id'] ?? 'general'), 'general');
$filename = $fileId . '.' . $extension;
$relativePath = $namespace . '/' . $ownerId . '/' . $filename;

$uploadRoot = __DIR__ . '/uploads';
$storageRoot = __DIR__ . '/storage';
$metaRoot = $storageRoot . '/meta';
$targetDir = $uploadRoot . '/' . $namespace . '/' . $ownerId;

if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true)) {
    json_response(['success' => false, 'message' => 'Unable to create upload directory'], 500);
}
if (!is_dir($metaRoot) && !mkdir($metaRoot, 0755, true)) {
    json_response(['success' => false, 'message' => 'Unable to create metadata directory'], 500);
}

$targetPath = $targetDir . '/' . $filename;
if (!move_uploaded_file((string) $file['tmp_name'], $targetPath)) {
    json_response(['success' => false, 'message' => 'Unable to store uploaded file'], 500);
}

$mimeType = mime_content_type($targetPath) ?: ($file['type'] ?? 'application/octet-stream');
$metadata = [
    'id' => $fileId,
    'namespace' => $namespace,
    'owner_id' => $ownerId,
    'filename' => $filename,
    'original_name' => $originalName,
    'relative_path' => $relativePath,
    'mime_type' => $mimeType,
    'size' => (int) $file['size'],
    'created_at' => gmdate('c'),
];

file_put_contents(
    $metaRoot . '/' . $fileId . '.json',
    json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
);

json_response([
    'success' => true,
    'id' => $fileId,
    'filename' => $filename,
    'path' => $relativePath,
    'url' => public_base_url() . '/file.php?id=' . rawurlencode($fileId),
]);
