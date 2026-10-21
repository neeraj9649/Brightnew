<?php

$defaults = [
    'upload_token' => getenv('PHP_UPLOADER_TOKEN') ?: '',
    'max_file_size' => 10 * 1024 * 1024,
    'allowed_extensions' => [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'pdf',
        'doc',
        'docx',
    ],
];

$local = __DIR__ . '/config.local.php';
if (is_file($local)) {
    $override = require $local;
    if (is_array($override)) {
        $defaults = array_replace($defaults, $override);
    }
}

return $defaults;
