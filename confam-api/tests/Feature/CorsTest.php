<?php

test('preflight requests from the configured frontend receive an allow-origin header', function () {
    $response = $this->options('/api/v1/health', [], [
        'Origin' => 'http://localhost:5173',
        'Access-Control-Request-Method' => 'GET',
    ]);

    $response->assertNoContent();
    $response->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
});
