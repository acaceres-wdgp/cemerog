/**
 * ClinicHeader – clinic block at the top of every printable document:
 * name, doctors, RNC, phone and address (each optional field only if set).
 */

export type ClinicInfo = {
    name: string | null;
    rnc: string | null;
    phone: string | null;
    address: string | null;
};

export default function ClinicHeader({ clinic }: { clinic: ClinicInfo }) {
    return (
        <div>
            <div className="font-serif text-[22px] font-bold text-primary">
                {clinic.name ?? 'CEMEROG'}
            </div>
            <div className="mt-[2px] text-[12.5px] text-text-dim">
                Dres. Rodríguez &amp; Guzmán
            </div>
            {clinic.rnc && (
                <div className="text-[12px] text-muted">RNC: {clinic.rnc}</div>
            )}
            {clinic.phone && (
                <div className="text-[12px] text-muted">
                    Tel: {clinic.phone}
                </div>
            )}
            {clinic.address && (
                <div className="text-[12px] text-muted">{clinic.address}</div>
            )}
        </div>
    );
}
