<?php

namespace App\Events;

use App\Models\ImagingOrder;
use App\Models\LabOrder;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * A lab order was validated or an imaging report signed: its results are now
 * visible in the results portal.
 *
 * TODO(whatsapp): send «tus resultados están listos» to the patient. No
 * provider is integrated yet; a listener will do it.
 */
class ResultPublished
{
    use Dispatchable;

    public function __construct(public LabOrder|ImagingOrder $study) {}
}
