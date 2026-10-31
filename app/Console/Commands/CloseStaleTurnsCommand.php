<?php

namespace App\Console\Commands;

use App\Actions\Turns\MarkTurnNoShow;
use App\Models\Turn;
use Illuminate\Console\Command;

class CloseStaleTurnsCommand extends Command
{
    protected $signature = 'cemerog:close-stale-turns';

    protected $description = 'Mark turns from previous days still waiting as no_asistio (runs daily from the scheduler)';

    public function handle(MarkTurnNoShow $markNoShow): int
    {
        $count = 0;

        Turn::with('patient')
            ->where('status', 'espera')
            ->whereDate('arrived_at', '<', today())
            ->orderBy('id')
            ->each(function (Turn $turn) use ($markNoShow, &$count): void {
                $markNoShow->handle($turn);
                $count++;
            });

        $this->info("Turnos de días anteriores marcados como «No asistió»: {$count}.");

        return self::SUCCESS;
    }
}
