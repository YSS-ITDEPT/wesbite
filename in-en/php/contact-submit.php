<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

/*
 * cPanel database settings.
 * Replace these 4 values with the exact values shown in cPanel -> MySQL Databases.
 * The database and user usually include your cPanel username as a prefix.
 * Example: cpaneluser_web_contact_form, cpaneluser_anikauser
 */
$dbHost = 'localhost';
$dbUser = 'Anika12345';
$dbPass = 'Anika12345';
$dbName = 'web-contact-form';
$tableName = 'contact_enquiries';

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function value(string $key): string
{
    return trim((string)($_POST[$key] ?? ''));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'success' => false,
        'message' => 'Method not allowed.',
    ]);
}

$firstName = value('first_name');
$lastName = value('last_name');
$organization = value('organization');
$email = value('email');
$enquiryType = value('enquiry_type');
$message = value('message');
$consent = isset($_POST['consent']) ? trim((string)$_POST['consent']) : '';

$errors = [];

if ($firstName === '' || strlen($firstName) > 80) {
    $errors['first_name'] = 'Enter a valid first name.';
}

if ($lastName === '' || strlen($lastName) > 80) {
    $errors['last_name'] = 'Enter a valid last name.';
}

if ($organization === '' || strlen($organization) > 180) {
    $errors['organization'] = 'Enter a valid organisation name.';
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 160) {
    $errors['email'] = 'Enter a valid official email address.';
}

if ($enquiryType === '' || strlen($enquiryType) > 120) {
    $errors['enquiry_type'] = 'Select an enquiry type.';
}

if ($message === '' || strlen($message) < 20 || strlen($message) > 3000) {
    $errors['message'] = 'Message must be between 20 and 3000 characters.';
}

if ($consent !== '1') {
    $errors['consent'] = 'Consent is required before submitting.';
}

if ($errors !== []) {
    respond(422, [
        'success' => false,
        'message' => 'Please correct the highlighted fields.',
        'errors' => $errors,
    ]);
}

$con = @mysqli_connect($dbHost, $dbUser, $dbPass, $dbName);

if (!$con) {
    error_log('Contact form DB connection failed: ' . mysqli_connect_error());
    respond(500, [
        'success' => false,
        'message' => 'Database connection failed.',
    ]);
}

mysqli_set_charset($con, 'utf8mb4');

$createTableSql = "CREATE TABLE IF NOT EXISTS `{$tableName}` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(80) NOT NULL,
    `last_name` VARCHAR(80) NOT NULL,
    `organization` VARCHAR(180) NOT NULL,
    `email` VARCHAR(160) NOT NULL,
    `enquiry_type` VARCHAR(120) NOT NULL,
    `message` TEXT NOT NULL,
    `consent` TINYINT(1) NOT NULL DEFAULT 0,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_email` (`email`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if (!mysqli_query($con, $createTableSql)) {
    error_log('Contact form table create failed: ' . mysqli_error($con));
    mysqli_close($con);
    respond(500, [
        'success' => false,
        'message' => 'Unable to prepare the contact table.',
    ]);
}

$stmt = mysqli_prepare(
    $con,
    "INSERT INTO `{$tableName}` (`first_name`, `last_name`, `organization`, `email`, `enquiry_type`, `message`, `consent`, `ip_address`, `user_agent`)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

if (!$stmt) {
    error_log('Contact form statement prepare failed: ' . mysqli_error($con));
    mysqli_close($con);
    respond(500, [
        'success' => false,
        'message' => 'Unable to prepare the contact form statement.',
    ]);
}

$ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
$userAgent = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);
$consentValue = 1;

mysqli_stmt_bind_param(
    $stmt,
    'ssssssiss',
    $firstName,
    $lastName,
    $organization,
    $email,
    $enquiryType,
    $message,
    $consentValue,
    $ipAddress,
    $userAgent
);

if (!mysqli_stmt_execute($stmt)) {
    error_log('Contact form insert failed: ' . mysqli_stmt_error($stmt));
    mysqli_stmt_close($stmt);
    mysqli_close($con);
    respond(500, [
        'success' => false,
        'message' => 'The enquiry could not be saved right now. Please try again shortly.',
    ]);
}

mysqli_stmt_close($stmt);
mysqli_close($con);

respond(200, [
    'success' => true,
    'message' => 'Your enquiry has been submitted successfully.',
]);
