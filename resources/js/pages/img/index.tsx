import PageHeader from '@/components/cemerog/PageHeader';
import EmptyState from '@/components/cemerog/EmptyState';
import AppLayout from '@/layouts/app/app-layout';

export default function ImgIndex() {
    return (
        <AppLayout>
            <PageHeader
                title="Imágenes"
            />
            <EmptyState
                title="Módulo en construcción"
                description="Este módulo estará disponible próximamente."
            />
        </AppLayout>
    );
}
