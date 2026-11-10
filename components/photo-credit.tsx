// Crédito de la foto debajo de la imagen/galería en /evento y /actividad. Las fotos
// de Ediciones son propias y no lo usan.
export function PhotoCredit({ credit, className = '' }: { credit: string; className?: string }) {
    return (
        <p className={`text-right text-xs text-[#999999] ${className}`}>
            Foto: {credit}
        </p>
    );
}
