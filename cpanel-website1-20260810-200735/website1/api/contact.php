<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $status, bool $success, string $message): never
{
    http_response_code($status);
    echo json_encode(
        ['success' => $success, 'message' => $message],
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Only POST requests are accepted.');
}

$payload = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($payload)) {
    respond(400, false, 'Invalid request data.');
}

function clean(array $payload, string $key, int $maxLength): string
{
    $value = trim((string) ($payload[$key] ?? ''));
    return mb_substr($value, 0, $maxLength);
}

$firstName = clean($payload, 'firstName', 80);
$lastName = clean($payload, 'lastName', 80);
$email = clean($payload, 'email', 190);
$phone = clean($payload, 'phone', 40);
$company = clean($payload, 'company', 150);
$jobTitle = clean($payload, 'jobTitle', 120);
$country = clean($payload, 'country', 100);
$message = clean($payload, 'message', 5000);

if (
    $firstName === '' ||
    $lastName === '' ||
    $phone === '' ||
    $company === '' ||
    $jobTitle === '' ||
    $country === '' ||
    mb_strlen($firstName) < 2 ||
    mb_strlen($lastName) < 2 ||
    mb_strlen($company) < 2 ||
    mb_strlen($jobTitle) < 2 ||
    mb_strlen($message) < 10 ||
    !preg_match('/^[0-9+().\-\s]{7,25}$/', $phone) ||
    !filter_var($email, FILTER_VALIDATE_EMAIL)
) {
    respond(422, false, 'Please complete all required fields with valid information.');
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $con = new mysqli('localhost', 'Anika12', 'Anika12', 'web-contact-form');
    $con->set_charset('utf8mb4');

    $con->query(
        "CREATE TABLE IF NOT EXISTS contact_submissions (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            first_name VARCHAR(80) NOT NULL,
            last_name VARCHAR(80) NOT NULL,
            email VARCHAR(190) NOT NULL,
            phone VARCHAR(40) NOT NULL,
            company VARCHAR(150) NULL,
            job_title VARCHAR(120) NULL,
            country VARCHAR(100) NOT NULL,
            message TEXT NOT NULL,
            ip_address VARCHAR(45) NULL,
            user_agent VARCHAR(500) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_created_at (created_at),
            INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $ipAddress = mb_substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
    $userAgent = mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500);

    $statement = $con->prepare(
        'INSERT INTO contact_submissions
        (first_name, last_name, email, phone, company, job_title, country, message, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $statement->bind_param(
        'ssssssssss',
        $firstName,
        $lastName,
        $email,
        $phone,
        $company,
        $jobTitle,
        $country,
        $message,
        $ipAddress,
        $userAgent
    );
    $statement->execute();
    if ($statement->affected_rows !== 1) {
        throw new RuntimeException('The contact submission was not inserted.');
    }

    $statement->close();
    $con->close();
    respond(201, true, 'Submitted successfully.');
} catch (Throwable $error) {
    error_log('Contact form submission failed: ' . $error->getMessage());
    respond(500, false, 'Your message could not be submitted right now. Please try again later.');
}
