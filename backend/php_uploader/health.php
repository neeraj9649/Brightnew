<?php

declare(strict_types=1);

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'service' => 'php_uploader',
    'status' => 'ok',
]);
