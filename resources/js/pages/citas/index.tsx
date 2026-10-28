import { useState } from 'react';
import { router } from '@inertiajs/react';
import { AppointmentRow, DoctorOption } from './types';
import { CitasToolbar } from './components/CitasToolbar';
import { CitasTable } from './components/CitasTable';
import { NuevaCitaModal } from './components/NuevaCitaModal';

type Props = {
    appointments: AppointmentRow[];
    doctors: DoctorOption[];
    date: string;
    is_today: boolean;
};

export default function CitasIndex({
    appointments,
    doctors,
    date,
    is_today,
}: Props) {
    const [showModal, setShowModal] = useState(false);
    const [selDoc, setSelDoc] = useState<number | null>(null);

    const filtered = selDoc
        ? appointments.filter((a) => a.doctor_id === selDoc)
        : appointments;

    function navigate(targetDate: string) {
        router.get('/citas', { date: targetDate }, { preserveState: false });
    }

    function cancelCita(id: number) {
        if (!confirm('¿Cancelar esta cita?')) return;
        router.delete(`/citas/${id}`, { preserveScroll: true });
    }

    // Slot-based view (future dates): group by HH:MM (defensive slice in case of HH:MM:SS)
    const bySlot: Record<string, AppointmentRow[]> = {};
    for (const a of filtered) {
        if (!a.appointment_time) continue;
        const key = a.appointment_time.slice(0, 5);
        if (!bySlot[key]) bySlot[key] = [];
        bySlot[key].push(a);
    }
    const noSlot = filtered.filter((a) => !a.appointment_time);

    // Today: exclude cancelled, sort by turn_order then time
    const todayRows = filtered.filter((a) => a.status !== 'cancelada');

    const pendingCount = filtered.filter(
        (a) => a.status === 'pendiente' || a.status === 'confirmada',
    ).length;

    return (
        <div className="flex flex-col gap-5">
            <CitasToolbar
                doctors={doctors}
                selDoc={selDoc}
                setSelDoc={setSelDoc}
                date={date}
                is_today={is_today}
                onNavigate={navigate}
                onNewCita={() => setShowModal(true)}
            />

            <CitasTable
                filtered={filtered}
                doctors={doctors}
                date={date}
                is_today={is_today}
                pendingCount={pendingCount}
                bySlot={bySlot}
                noSlot={noSlot}
                todayRows={todayRows}
                onNewCita={() => setShowModal(true)}
                onCancel={cancelCita}
            />

            {showModal && (
                <NuevaCitaModal
                    onClose={() => setShowModal(false)}
                    doctors={doctors}
                    defaultDate={date}
                />
            )}
        </div>
    );
}
