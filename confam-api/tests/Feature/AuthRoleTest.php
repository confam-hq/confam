<?php

use App\Models\Deal;
use App\Models\User;
use App\Notifications\AuthOtpNotification;
use App\Services\Admin\DatabaseBackupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

test('new vendors verify their email before signing in', function () {
    Notification::fake();
    $credentials = [
        'name' => 'Confam Vendor',
        'email' => 'vendor@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
        'role' => 'vendor',
        'terms_accepted' => true,
        'privacy_accepted' => true,
    ];

    $this->postJson('/api/v1/auth/register', $credentials)
        ->assertCreated()
        ->assertJsonPath('email', $credentials['email']);

    $this->assertDatabaseHas('users', [
        'email' => $credentials['email'],
        'role' => 'vendor',
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => $credentials['email'],
        'password' => $credentials['password'],
    ])->assertUnprocessable();

    $code = null;
    Notification::assertSentOnDemand(AuthOtpNotification::class, function ($notification) use (&$code) {
        if ($notification->purpose === 'email_verification') {
            $code = $notification->code;
        }

        return true;
    });
    expect($code)->not->toBeNull();

    $this->postJson('/api/v1/auth/verification/verify', [
        'email' => $credentials['email'],
        'code' => $code,
    ])->assertOk();

    $this->postJson('/api/v1/auth/login', [
        'email' => $credentials['email'],
        'password' => $credentials['password'],
    ])
        ->assertOk()
        ->assertJsonPath('user.role', 'vendor');
});

test('buyers can register as buyers but admin registration is rejected', function () {
    $this->postJson('/api/v1/auth/register', [
        'name' => 'Confam Buyer',
        'email' => 'buyer@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
        'role' => 'buyer',
        'terms_accepted' => true,
        'privacy_accepted' => true,
    ])
        ->assertCreated()
        ->assertJsonPath('email', 'buyer@example.com');

    $this->postJson('/api/v1/auth/register', [
        'name' => 'Confam Admin',
        'email' => 'admin@example.com',
        'phone' => '08098765432',
        'password' => 'password123',
        'role' => 'admin',
        'terms_accepted' => true,
        'privacy_accepted' => true,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('role');
});

test('registration requires acceptance of both legal documents', function () {
    $this->postJson('/api/v1/auth/register', [
        'name' => 'Confam Buyer',
        'email' => 'buyer@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
        'role' => 'buyer',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['terms_accepted', 'privacy_accepted']);
});

test('registration stores an optional avatar and returns a usable media URL', function () {
    Notification::fake();
    Storage::fake('public');

    $this->post('/api/v1/auth/register', [
        'name' => 'Confam Buyer',
        'email' => 'buyer@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
        'role' => 'buyer',
        'terms_accepted' => 'true',
        'privacy_accepted' => 'true',
        'avatar' => UploadedFile::fake()->image('avatar.png'),
    ], ['Accept' => 'application/json'])
        ->assertCreated();

    $user = User::where('email', 'buyer@example.com')->firstOrFail();
    expect($user->avatar_url)->toContain('/storage/avatars/');
    Storage::disk('public')->assertExists($user->avatar_path);
});

test('password reset codes replace the password and revoke existing tokens', function () {
    Notification::fake();
    $user = User::create([
        'name' => 'Confam Buyer',
        'email' => 'buyer@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
    ]);
    $user->forceFill(['email_verified_at' => now()])->save();
    $user->createToken('existing-session');

    $this->postJson('/api/v1/auth/password/forgot', ['email' => $user->email])->assertOk();

    $code = null;
    Notification::assertSentOnDemand(AuthOtpNotification::class, function ($notification) use (&$code) {
        if ($notification->purpose === 'password_reset') {
            $code = $notification->code;
        }

        return true;
    });
    expect($code)->not->toBeNull();

    $this->postJson('/api/v1/auth/password/reset', [
        'email' => $user->email,
        'code' => $code,
        'password' => 'new-password-123',
        'password_confirmation' => 'new-password-123',
    ])->assertOk();

    expect(Hash::check('new-password-123', $user->fresh()->password))->toBeTrue();
    expect($user->tokens()->count())->toBe(0);
});

test('users can inspect and revoke their own sessions', function () {
    $user = User::create([
        'name' => 'Confam Vendor',
        'email' => 'vendor@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
    ]);
    $current = $user->createToken('current-device');
    $other = $user->createToken('another-device');

    $this->withToken($current->plainTextToken)
        ->getJson('/api/v1/auth/sessions')
        ->assertOk()
        ->assertJsonCount(2, 'sessions')
        ->assertJsonPath('current_token_id', $current->accessToken->id);

    $this->withToken($current->plainTextToken)
        ->deleteJson('/api/v1/auth/sessions/'.$other->accessToken->id)
        ->assertOk()
        ->assertJsonPath('current', false);

    $this->assertDatabaseMissing('personal_access_tokens', ['id' => $other->accessToken->id]);
});

test('a valid remembered session can be unlocked with its password', function () {
    $user = User::create([
        'name' => 'Confam Vendor',
        'email' => 'vendor@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
    ]);
    $token = $user->createToken('remembered-session');

    $this->withToken($token->plainTextToken)
        ->postJson('/api/v1/auth/unlock', ['password' => 'password123'])
        ->assertOk();

    $this->withToken($token->plainTextToken)
        ->postJson('/api/v1/auth/unlock', ['password' => 'wrong-password'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('password');
});

test('admin database reset requires admin access and preserves the active admin with a verified backup', function () {
    $admin = User::create([
        'name' => 'Confam Admin',
        'email' => 'admin@example.com',
        'phone' => '08012345678',
        'password' => 'administrator-password',
        'role' => 'admin',
    ]);
    $currentToken = $admin->createToken('admin-current-session');
    $otherAdminToken = $admin->createToken('admin-other-session');
    $member = User::create([
        'name' => 'Confam Vendor',
        'email' => 'vendor@example.com',
        'phone' => '08087654321',
        'password' => 'password123',
    ]);
    $member->createToken('member-session');
    Deal::create([
        'short_code' => 'CF-RESET',
        'vendor_name' => 'Confam Vendor',
        'vendor_phone' => '08087654321',
        'vendor_bank_code' => '044',
        'vendor_account_number' => '0123456789',
        'vendor_account_name' => 'Confam Vendor',
        'vendor_manage_token' => Str::random(48),
        'buyer_phone' => '08012345678',
        'buyer_email' => 'buyer@example.com',
        'item_title' => 'Reset test item',
        'item_amount_kobo' => 100000,
        'platform_fee_kobo' => 5000,
        'total_payable_kobo' => 100000,
        'delivery_mode' => 'INTERSTATE_WAYBILL',
        'status' => 'AWAITING_PAYMENT',
    ]);

    $backupService = Mockery::mock(DatabaseBackupService::class);
    $backupService->shouldReceive('create')->once()->andReturn('confam-db-20261121-123456-ab12cd34.sqlite');
    $this->instance(DatabaseBackupService::class, $backupService);

    $this->withToken($currentToken->plainTextToken)
        ->postJson('/api/v1/admin/database/reset', [
            'password' => 'administrator-password',
            'confirmation' => 'RESET DATABASE',
        ])
        ->assertOk()
        ->assertJsonPath('backup_file', 'confam-db-20261121-123456-ab12cd34.sqlite')
        ->assertJsonPath('deleted.deals', 1)
        ->assertJsonPath('deleted.accounts', 1);

    $this->assertDatabaseCount('deals', 0);
    $this->assertDatabaseCount('users', 1);
    $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => 'admin']);
    $this->assertDatabaseHas('personal_access_tokens', ['id' => $currentToken->accessToken->id]);
    $this->assertDatabaseMissing('personal_access_tokens', ['id' => $otherAdminToken->accessToken->id]);
    $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $member->id]);
});

test('admin database reset leaves data untouched when the backup fails', function () {
    $admin = User::create([
        'name' => 'Confam Admin',
        'email' => 'admin@example.com',
        'phone' => '08012345678',
        'password' => 'administrator-password',
        'role' => 'admin',
    ]);
    $token = $admin->createToken('admin-current-session');
    $member = User::create([
        'name' => 'Confam Vendor',
        'email' => 'vendor@example.com',
        'phone' => '08087654321',
        'password' => 'password123',
    ]);

    $backupService = Mockery::mock(DatabaseBackupService::class);
    $backupService->shouldReceive('create')->once()->andThrow(new RuntimeException('Backup failed.'));
    $this->instance(DatabaseBackupService::class, $backupService);

    $this->withToken($token->plainTextToken)
        ->postJson('/api/v1/admin/database/reset', [
            'password' => 'administrator-password',
            'confirmation' => 'RESET DATABASE',
        ])
        ->assertInternalServerError();

    $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => 'admin']);
    $this->assertDatabaseHas('users', ['id' => $member->id, 'role' => 'vendor']);
    $this->assertDatabaseHas('personal_access_tokens', ['id' => $token->accessToken->id]);
});

test('vendor dashboard includes owned deals and legacy deals matching the vendor email', function () {
    $vendor = User::create([
        'name' => 'Confam Vendor',
        'email' => 'vendor@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
    ]);

    $createDeal = function (array $attributes) {
        return Deal::create(array_merge([
            'short_code' => 'CF-'.Str::upper(Str::random(5)),
            'vendor_name' => 'Confam Vendor',
            'vendor_phone' => '08012345678',
            'vendor_bank_code' => '044',
            'vendor_account_number' => '0123456789',
            'vendor_account_name' => 'Confam Vendor',
            'vendor_manage_token' => Str::random(48),
            'buyer_phone' => '08098765432',
            'buyer_email' => 'buyer@example.com',
            'item_title' => 'Test item',
            'item_amount_kobo' => 100000,
            'platform_fee_kobo' => 1500,
            'total_payable_kobo' => 101500,
            'delivery_mode' => 'INTERSTATE_WAYBILL',
            'status' => 'AWAITING_PAYMENT',
        ], $attributes));
    };

    $createDeal([
        'short_code' => 'CF-OWNED',
        'vendor_user_id' => $vendor->id,
    ]);
    $createDeal([
        'short_code' => 'CF-LEGACY',
        'vendor_email' => 'Vendor@Example.com',
    ]);
    $createDeal([
        'short_code' => 'CF-OTHER',
        'vendor_email' => 'other@example.com',
    ]);

    $this->actingAs($vendor, 'sanctum')
        ->getJson('/api/v1/vendor/deals')
        ->assertOk()
        ->assertJsonCount(2, 'deals')
        ->assertJsonFragment(['short_code' => 'CF-OWNED'])
        ->assertJsonFragment(['short_code' => 'CF-LEGACY'])
        ->assertJsonMissing(['short_code' => 'CF-OTHER']);
});
