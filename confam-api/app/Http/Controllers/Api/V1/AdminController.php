<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\EscrowStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DealResource;
use App\Models\Deal;
use App\Models\EscrowLedger;
use App\Models\User;
use App\Services\Admin\DatabaseBackupService;
use App\Services\Escrow\EscrowStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AdminController extends Controller
{
    public function __construct(private EscrowStateMachine $stateMachine) {}

    public function disputes(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $deals = Deal::query()
            ->where('status', EscrowStatus::DISPUTE_FROZEN)
            ->with(['proofArtifact', 'waybillManifest', 'ledgers'])
            ->latest('disputed_at')
            ->get();

        return response()->json(['data' => DealResource::collection($deals)]);
    }

    public function revenue(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json([
            'total' => EscrowLedger::where('event_type', 'COLLECTION_LOCKED')->sum('amount_kobo') / 100,
            'fees' => EscrowLedger::where('event_type', 'PLATFORM_FEE_RETAINED')->sum('amount_kobo') / 100,
            'settled' => EscrowLedger::where('event_type', 'FINAL_PAYOUT_SETTLED')->sum('amount_kobo') / 100,
        ]);
    }

    public function databaseResetStatus(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json([
            'enabled' => ! app()->isProduction() || (bool) config('admin.database_reset_enabled'),
            'driver' => DB::connection()->getDriverName(),
        ]);
    }

    public function resolveDispute(Request $request, string $short_code): JsonResponse
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate([
            'outcome' => ['required', 'in:release,refund'],
        ]);
        $deal = Deal::where('short_code', strtoupper($short_code))->firstOrFail();

        $resolvedDeal = $this->stateMachine->resolveDispute($deal, $validated['outcome']);

        return response()->json([
            'message' => $validated['outcome'] === 'refund'
                ? 'Buyer refund submitted.'
                : 'Dispute reviewed and vendor payout released.',
            'deal' => new DealResource($resolvedDeal),
        ]);
    }

    public function resetDatabase(Request $request, DatabaseBackupService $backupService): JsonResponse
    {
        $this->authorizeAdmin($request);
        abort_if(
            app()->isProduction() && ! config('admin.database_reset_enabled'),
            403,
            'Database reset is disabled in production.',
        );

        $validated = $request->validate([
            'password' => ['required', 'string'],
            'confirmation' => ['required', 'in:RESET DATABASE'],
        ]);
        if (! Hash::check($validated['password'], $request->user()->password)) {
            throw ValidationException::withMessages([
                'password' => ['The administrator password is incorrect.'],
            ]);
        }

        $backupFile = $backupService->create();
        $admin = $request->user();
        $currentToken = $admin->currentAccessToken();
        $currentTokenId = $currentToken instanceof PersonalAccessToken ? $currentToken->getKey() : null;

        $deleted = DB::transaction(function () use ($admin, $currentTokenId) {
            $dealCount = Deal::count();
            $accountCount = User::where('role', '!=', 'admin')->count();

            Deal::query()->delete();
            User::where('role', '!=', 'admin')->delete();
            DB::table('auth_otp_codes')->delete();
            DB::table('password_reset_tokens')->delete();

            $tokens = DB::table('personal_access_tokens');
            if ($currentTokenId !== null) {
                $tokens->where('id', '!=', $currentTokenId);
            }
            $tokens->delete();

            if (Schema::hasTable('sessions')) {
                DB::table('sessions')
                    ->where(function ($query) use ($admin) {
                        $query->whereNull('user_id')->orWhere('user_id', '!=', $admin->id);
                    })
                    ->delete();
            }
            foreach (['jobs', 'job_batches', 'failed_jobs'] as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->delete();
                }
            }

            return ['deals' => $dealCount, 'accounts' => $accountCount];
        });

        Log::warning('Administrator reset application data.', [
            'admin_user_id' => $admin->id,
            'backup_file' => $backupFile,
            'deleted_deals' => $deleted['deals'],
            'deleted_non_admin_accounts' => $deleted['accounts'],
        ]);

        return response()->json([
            'message' => 'Application data was reset. Administrator accounts and the database schema were preserved.',
            'backup_file' => $backupFile,
            'deleted' => $deleted,
        ]);
    }

    public function downloadDatabaseBackup(Request $request, string $fileName, DatabaseBackupService $backupService)
    {
        $this->authorizeAdmin($request);

        return $backupService->download($fileName);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->role === 'admin', 403);
    }
}
