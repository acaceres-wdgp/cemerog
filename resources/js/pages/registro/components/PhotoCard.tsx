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
        <div
            style={{
                background: '#fff',
                border: '1px solid #e3e9e3',
                borderRadius: 14,
            }}
        >
            <div
                style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #eef0ec',
                    fontFamily: 'Bitter,Georgia,serif',
                    fontWeight: 600,
                    fontSize: 16,
                    color: '#1f2d22',
                }}
            >
                Foto / Identificación
            </div>
            <div
                style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                }}
            >
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
                    style={{
                        border: `2px dashed ${isDragging ? '#2E8B3E' : '#d4d4d8'}`,
                        borderRadius: 12,
                        background: isDragging ? '#F3F9EC' : '#fafafa',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 160,
                        gap: 8,
                        overflow: 'hidden',
                        transition: 'border-color .15s, background .15s',
                    }}
                >
                    {hasPhoto && !isPdf && previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Foto del paciente"
                            style={{
                                width: '100%',
                                height: 160,
                                objectFit: 'cover',
                            }}
                        />
                    ) : hasPhoto && isPdf ? (
                        <div
                            style={{
                                textAlign: 'center',
                                color: '#5f6b64',
                                fontSize: 13,
                            }}
                        >
                            <div style={{ fontSize: 36, marginBottom: 4 }}>
                                📄
                            </div>
                            <div style={{ fontWeight: 500 }}>
                                {photoFileName ?? 'Documento PDF'}
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                textAlign: 'center',
                                color: '#71717a',
                                padding: '0 12px',
                            }}
                        >
                            <div style={{ fontSize: 32, marginBottom: 8 }}>
                                📷
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>
                                Haz clic o arrastra un archivo
                            </div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                JPG, PNG, WEBP o PDF · máx. 20 MB
                            </div>
                        </div>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
                />
                {hasPhoto && (
                    <button
                        type="button"
                        onClick={onRemovePhoto}
                        style={{
                            height: 32,
                            padding: '0 12px',
                            borderRadius: 8,
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 13,
                        }}
                    >
                        Eliminar foto
                    </button>
                )}
                {(photoError ?? photoFormError) && (
                    <span style={{ color: '#b91c1c', fontSize: 12 }}>
                        {photoError ?? photoFormError}
                    </span>
                )}
            </div>
        </div>
    );
}
