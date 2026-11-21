<?php

namespace App\Services\Admin;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\Process\Process;

class DatabaseBackupService
{
    public function create(): string
    {
        $directory = storage_path('app/private/admin-database-backups');
        if (! is_dir($directory) && ! mkdir($directory, 0700, true) && ! is_dir($directory)) {
            throw new RuntimeException('The private database backup directory could not be created.');
        }

        $baseName = 'confam-db-'.now()->utc()->format('Ymd-His').'-'.Str::lower(Str::random(8));
        $driver = DB::connection()->getDriverName();

        return match ($driver) {
            'sqlite' => $this->backupSqlite($directory, $baseName),
            'mysql' => $this->backupWithClient('mysql', $directory, $baseName),
            'pgsql' => $this->backupWithClient('pgsql', $directory, $baseName),
            default => throw new RuntimeException("Database backups are not configured for the {$driver} driver."),
        };
    }

    public function download(string $fileName)
    {
        abort_unless(
            preg_match('/\Aconfam-db-\d{8}-\d{6}-[a-z0-9]{8}\.(?:sqlite|sql)\z/', $fileName) === 1,
            404,
        );

        $path = storage_path('app/private/admin-database-backups/'.$fileName);
        abort_unless(is_file($path), 404);

        return response()->download($path);
    }

    private function backupSqlite(string $directory, string $baseName): string
    {
        $fileName = $baseName.'.sqlite';
        $path = $directory.DIRECTORY_SEPARATOR.$fileName;
        $quotedPath = DB::connection()->getPdo()->quote($path);
        DB::statement("VACUUM INTO {$quotedPath}");

        $this->verifyBackupFile($path);

        return $fileName;
    }

    private function backupWithClient(string $driver, string $directory, string $baseName): string
    {
        $fileName = $baseName.'.sql';
        $path = $directory.DIRECTORY_SEPARATOR.$fileName;
        $connection = config("database.connections.{$driver}");
        $environment = [];

        if ($driver === 'mysql') {
            $command = [
                'mysqldump',
                '--single-transaction',
                '--quick',
                '--result-file='.$path,
                '--host='.$connection['host'],
                '--port='.$connection['port'],
                '--user='.$connection['username'],
                $connection['database'],
            ];
            if ($connection['password']) {
                $environment['MYSQL_PWD'] = $connection['password'];
            }
        } else {
            $command = [
                'pg_dump',
                '--no-password',
                '--file='.$path,
                '--host='.$connection['host'],
                '--port='.$connection['port'],
                '--username='.$connection['username'],
                $connection['database'],
            ];
            if ($connection['password']) {
                $environment['PGPASSWORD'] = $connection['password'];
            }
        }

        $process = new Process($command, base_path(), $environment ?: null);
        $process->setTimeout(300);
        $process->run();
        if (! $process->isSuccessful()) {
            throw new RuntimeException('The database backup command failed. No data was reset.');
        }

        $this->verifyBackupFile($path);

        return $fileName;
    }

    private function verifyBackupFile(string $path): void
    {
        if (! is_file($path) || filesize($path) === false || filesize($path) < 1) {
            throw new RuntimeException('The database backup could not be verified. No data was reset.');
        }
    }
}
