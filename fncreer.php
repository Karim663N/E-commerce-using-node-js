<?php

function isGmailAddressValid($email) {
    list($user, $domain) = explode('@', $email);

    // Check if domain is Gmail
    if (strtolower($domain) !== 'gmail.com') {
        return false;
    }

    // Connect to Gmail SMTP server
    $smtpConnection = @fsockopen('smtp.gmail.com', 587, $errno, $errstr, 30);

    if (!$smtpConnection) {
        return false; // Failed to connect
    }

    // Wait for SMTP greeting
    fgets($smtpConnection, 1024);

    // Send EHLO command
    fputs($smtpConnection, "EHLO example.com\r\n");
    fgets($smtpConnection, 1024);

    // Start TLS encryption
    fputs($smtpConnection, "STARTTLS\r\n");
    fgets($smtpConnection, 1024);

    // Perform encryption
    stream_socket_enable_crypto($smtpConnection, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

    // Send HELO command again
    fputs($smtpConnection, "EHLO example.com\r\n");
    fgets($smtpConnection, 1024);

    // Send MAIL FROM command
    fputs($smtpConnection, "MAIL FROM: <$email>\r\n");
    $fromResponse = fgets($smtpConnection, 1024);

    // Send QUIT command
    fputs($smtpConnection, "QUIT\r\n");

    // Close connection
    fclose($smtpConnection);

    // Check response from MAIL FROM command
    if (substr($fromResponse, 0, 3) === '250') {
        return true; // Email exists
    } else {
        return false; // Email does not exist or SMTP error
    }
}

// Check if email parameter is set in $_GET
if (isset($_GET['email'])) {
    $email = $_GET['email'];
    if (isGmailAddressValid($email)) {
        echo "Email '$email' is valid.";
    } else {
        echo "Email '$email' is not valid.";
    }
} else {
    echo "No email parameter provided.";
}

?>
