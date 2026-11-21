<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AuthOtpNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $code,
        public readonly string $purpose,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $isVerification = $this->purpose === 'email_verification';

        return (new MailMessage)
            ->subject($isVerification ? 'Verify your Confam email' : 'Reset your Confam password')
            ->greeting($isVerification ? 'Verify your email address' : 'Reset your password')
            ->line($isVerification
                ? 'Enter this code in Confam to verify your email address.'
                : 'Enter this code in Confam to reset your password.')
            ->line($this->code)
            ->line('This code expires in 10 minutes. If you did not request it, you can ignore this email.');
    }
}
