<?php
require_once('vendor/audoload.php');

$stripe = array(
    "secret_key"        => "sk_test_BQokikJ0vBiI2HlWgH4olfQ2",
    "publishable_key"   => "pk_test_6pRNASCoB0KtIshFeQd4XMUh"
);

\Stripe\Stripe::setApiKey($stripe['secret_key']);
?>