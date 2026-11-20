<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * A prescription saved before the clinical note stayed without its
 * consultation. Joins each one to the first note of its turn; a turn
 * without a note keeps its prescription as it is.
 */
return new class extends Migration
{
    public function up(): void
    {
        $firstNotes = DB::table('consultations')
            ->whereNotNull('turn_id')
            ->groupBy('turn_id')
            ->pluck(DB::raw('MIN(id)'), 'turn_id');

        DB::table('prescriptions')
            ->whereNull('consultation_id')
            ->whereIn('turn_id', $firstNotes->keys())
            ->orderBy('id')
            ->each(function (object $prescription) use ($firstNotes): void {
                DB::table('prescriptions')
                    ->where('id', $prescription->id)
                    ->update(['consultation_id' => $firstNotes[$prescription->turn_id]]);
            });
    }

    /**
     * Nothing to undo: the links are correct data, and the prescriptions
     * joined here cannot be told apart from the ones joined when saved.
     */
    public function down(): void
    {
        //
    }
};
