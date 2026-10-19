import PageHeader from '@/components/cemerog/PageHeader';
import EmptyState from '@/components/cemerog/EmptyState';
import AppLayout from '@/layouts/app/app-layout';

export default function DoctoresIndex() {
    return (
        <AppLayout>
            <PageHeader
                title="Doctores y Especialidades"
            />
            <EmptyState
                title="Módulo en construcción"
                description="Este módulo estará disponible próximamente."
            />
        </AppLayout>
    );
}
