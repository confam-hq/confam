<?php

namespace App\Enums;

enum DeliveryMode: string
{
    case LOCAL_DISPATCH     = 'LOCAL_DISPATCH';
    case INTERSTATE_WAYBILL = 'INTERSTATE_WAYBILL';
}