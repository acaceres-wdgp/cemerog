import React from 'react';

interface PhotoCardProps {
    previewUrl: string | null;
    isDragging: boolean;
    setIsDragging: (v: boolean) => void;
    hasPhoto: boolean | string | null | undefined;
    isPdf: boolean;
    photoError: string | null;
    photoFormError: string | undefined;
    photoFileName: string | undefined;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileSelect: (file: File | null) => void;
    onRemovePhoto: () => void;
}

export function PhotoCard({
    previewUrl,
    isDragging,
    setIsDragging,
    hasPhoto,
    isPdf,
    photoError,
    photoFormError,
    photoFileName,
    fileInputRef,
    onFileSelect,
    onRemovePhoto,
}: PhotoCardProps) {
    return (
        <div className="overflow-hidden rounded-[14px] border border-card-border bg-card-bg">
            <div className="border-b border-divider px-5 py-4 font-serif text-[16px] font-semibold text-text-heading">
                Foto / Identificación
            </div>
            <div className="flex flex-col gap-2.5 px-5 py-4">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files[0] ?? null;
                        if (file) onFileSelect(file);
                    }}
                    className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[12px] border-2 border-dashed transition-[border-color,background] duration-150 ${
                        isDragging
                            ? 'border-primary bg-info-bg'
                            : 'border-neutral-border bg-done-row-bg'
                    }`}
                >
                    {hasPhoto && !isPdf && previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Foto del paciente"
                            className="h-[160px] w-full object-cover"
                        />
                    ) : hasPhoto && isPdf ? (
                        <div className="text-center text-[13px] text-text-secondary">
                            <div className="mb-1 text-[36px]">📄</div>
                            <div className="font-medium">
                                {photoFileName ?? 'Documento PDF'}
                            </div>
                        </div>
                    ) : (
                        <div className="px-3 text-center text-muted">
                            <div className="mb-2 text-[32px]">📷</div>
                            <div className="text-[13px] font-medium">
                                Haz clic o arrastra un archivo
                            </div>
                            <div className="mt-1 text-xs">
                                JPG, PNG, WEBP o PDF · máx. 20 MB
                            </div>
                        </div>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
                />
                {hasPhoto && (
                    <button
                        type="button"
                        onClick={onRemovePhoto}
                        className="h-8 cursor-pointer rounded-[8px] border border-error-border bg-error-bg px-3 font-[inherit] text-[13px] font-medium text-error"
                    >
                        Eliminar foto
                    </button>
                )}
                {(photoError ?? photoFormError) && (
                    <span className="text-xs text-error">
                        {photoError ?? photoFormError}
                    </span>
                )}
            </div>
        </div>
    );
}
