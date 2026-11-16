<?php

namespace App\Enums;

enum EscrowStatus: string
{
    case AWAITING_PAYMENT      = 'AWAITING_PAYMENT';
    case FUNDED_LOCKED         = 'FUNDED_LOCKED';
    case DISPATCHED_IN_TRANSIT = 'DISPATCHED_IN_TRANSIT';
    case COMPLETED_RELEASED    = 'COMPLETED_RELEASED';
    case DISPUTE_FROZEN        = 'DISPUTE_FROZEN';
    case REFUNDED              = 'REFUNDED';
}