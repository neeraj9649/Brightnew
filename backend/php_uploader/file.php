<?php

declare(strict_types=1);

function not_found(): void
{
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'File not found']);
    exit;
}

$id = trim((string) ($_GET['id'] ?? ''));
if (!preg_match('/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/', $id)) {
    not_found();
}

$metaPath = __DIR__ . '/storage/meta/' . $id . '.json';
if (!is_file($metaPath)) {
    not_found();
}

$metadata = json_decode((string) file_get_contents($metaPath), true);
if (!is_array($metadata) || empty($metadata['relative_path'])) {
    not_found();
}

$relativePath = str_replace(['..', '\\'], ['', '/'], (string) $metadata['relative_path']);
$filePath = __DIR__ . '/uploads/' . ltrim($relativePath, '/');
if (!is_file($filePath)) {
    not_found();
}

$mimeType = $metadata['mime_type'] ?? mime_content_type($filePath) ?: 'application/octet-stream';
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: public, max-age=31536000');
readfile($filePath);
