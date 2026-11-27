<?php
// First-party session endpoint for the HTTPS portal. Bearer API calls stay on the API host.
declare(strict_types=1);

const PORTAL_ORIGIN = 'https://portal.brightwingstravel.com';
const API_ORIGIN = 'https://bp.nsiif.in';
const PORTAL_COOKIE = '__Secure-bw_refresh';
const API_COOKIE = 'refresh_token';
const MAX_BODY_BYTES = 32768;
const TOKEN_PATTERN = '[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}';

function fail_session(int $status, string $message): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['data' => null, 'msg' => $message, 'success' => false, 'statusCode' => $status]);
    exit;
}

function set_portal_cookie(string $token, int $maxAge): void
{
    // Keep the token scoped to this endpoint and host. The API signs in through this
    // endpoint so browsers can store and send the cookie in the portal's own context.
    header(
        'Set-Cookie: ' . PORTAL_COOKIE . '=' . $token
        . '; Max-Age=' . $maxAge . '; Path=/session.php; Secure; HttpOnly; SameSite=Lax',
        false
    );
}

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail_session(405, 'This endpoint accepts POST requests only.');
}
if (($_SERVER['HTTP_ORIGIN'] ?? '') !== PORTAL_ORIGIN) {
    fail_session(403, 'This request must come from the Bright Wings portal.');
}

$routes = [
    'login' => '/auth/login',
    'register' => '/auth/register',
    'reset' => '/auth/passcode/reset',
    'refresh' => '/auth/refresh',
    'logout' => '/auth/logout',
];
$action = $_GET['action'] ?? '';
if (!is_string($action) || !isset($routes[$action])) {
    fail_session(404, 'Unknown session action.');
}

$hasBody = in_array($action, ['login', 'register', 'reset'], true);
$body = '';
$headers = ['Accept: application/json'];
if ($hasBody) {
    $body = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
    if ($body === false) {
        fail_session(400, 'Could not read the request.');
    }
    if (strlen($body) > MAX_BODY_BYTES) {
        fail_session(413, 'This request is too large.');
    }
    $headers[] = 'Content-Type: application/json';
} else {
    $token = $_COOKIE[PORTAL_COOKIE] ?? '';
    if (is_string($token) && preg_match('/\A' . TOKEN_PATTERN . '\z/D', $token)) {
        $headers[] = 'Cookie: ' . API_COOKIE . '=' . $token;
    }
}

// Use the web server's peer address. Client-supplied forwarding headers are not trusted.
$clientAddress = $_SERVER['REMOTE_ADDR'] ?? '';
if (filter_var($clientAddress, FILTER_VALIDATE_IP)) {
    $headers[] = 'X-Forwarded-For: ' . $clientAddress;
}

// Delete the portal cookie even if the upstream logout is temporarily unavailable.
if ($action === 'logout') {
    set_portal_cookie('', 0);
}
if (!function_exists('curl_init')) {
    fail_session(503, 'The Bright Wings session service is temporarily unavailable.');
}

$upstreamCookie = null;
$client = curl_init(API_ORIGIN . $routes[$action]);
if ($client === false) {
    fail_session(503, 'The Bright Wings session service is temporarily unavailable.');
}
$configured = curl_setopt_array($client, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_HEADERFUNCTION => static function ($client, string $line) use (&$upstreamCookie): int {
        // Allow only the API's refresh cookie. Rebuild its attributes at the portal boundary.
        if (preg_match('/\ASet-Cookie:\s*' . API_COOKIE . '=(' . TOKEN_PATTERN . ')(?=;|\s|$)(.*)/i', $line, $cookie)
            && preg_match('/(?:^|;)\s*Max-Age=([0-9]{1,9})(?=;|\s|$)/i', $cookie[2], $age)
            && (int) $age[1] > 0) {
            $upstreamCookie = [$cookie[1], (int) $age[1]];
        }
        return strlen($line);
    },
]);
if (!$configured) {
    fail_session(502, 'The Bright Wings session service is temporarily unavailable.');
}
$result = curl_exec($client);
$status = (int) curl_getinfo($client, CURLINFO_HTTP_CODE);

if ($result === false || $status < 200 || ($status >= 300 && $status < 400) || $status > 599) {
    fail_session(502, 'The Bright Wings session service is temporarily unavailable.');
}
if ($action === 'logout' && $status === 204) {
    http_response_code(204);
    exit;
}

$envelope = json_decode($result, true);
if (!is_array($envelope) || !is_bool($envelope['success'] ?? null)) {
    fail_session(502, 'The Bright Wings session service is temporarily unavailable.');
}
if ($status === 200 && $envelope['success']) {
    if ($upstreamCookie !== null && $action !== 'logout') {
        set_portal_cookie($upstreamCookie[0], $upstreamCookie[1]);
    } elseif ($hasBody) {
        // Creating a session requires a refresh cookie. A duplicate refresh may omit it.
        fail_session(502, 'The Bright Wings session service could not create a session.');
    }
}

http_response_code($status);
header('Content-Type: application/json; charset=utf-8');
echo $result;
