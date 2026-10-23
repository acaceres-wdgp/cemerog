import PageHeader from '@/components/cemerog/PageHeader';
import EmptyState from '@/components/cemerog/EmptyState';

export default function CirugiaIndex() {
    return (
        <>
            <PageHeader title="Cirugía" />
            <EmptyState
                title="Módulo en construcción"
                description="Este módulo estará disponible próximamente."
            />
        </>
    );
}
