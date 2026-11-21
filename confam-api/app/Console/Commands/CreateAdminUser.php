<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CreateAdminUser extends Command
{
    protected $signature = 'confam:create-admin';

    protected $description = 'Create or promote an administrator account';

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->ask('Admin email')));
        $existing = User::where('email', $email)->first();
        $name = trim((string) $this->ask('Full name', $existing?->name));
        $phone = trim((string) $this->ask('Phone number', $existing?->phone));
        $password = (string) $this->secret('Password (at least 12 characters)');
        $confirmation = (string) $this->secret('Confirm password');

        $emailRule = Rule::unique('users', 'email');
        $phoneRule = Rule::unique('users', 'phone');
        if ($existing) {
            $emailRule->ignore($existing->id);
            $phoneRule->ignore($existing->id);
        }

        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'password' => $password,
            'password_confirmation' => $confirmation,
        ], [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', $emailRule],
            'phone' => ['required', 'string', 'max:20', $phoneRule],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        DB::transaction(function () use ($email, $name, $phone, $password) {
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'phone' => $phone,
                    'password' => Hash::make($password),
                    'role' => 'admin',
                ],
            );
            $user->forceFill(['email_verified_at' => now()])->save();
        });

        $this->info("Administrator account ready for {$email}.");

        return self::SUCCESS;
    }
}
