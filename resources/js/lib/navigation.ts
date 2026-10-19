/**
 * CEMEROG navigation configuration.
 * Groups, keys, labels, icons, and route names.
 */

export interface NavItem {
    key: string;
    label: string;
    icon: string;
    route: string;
    permission: string;
}

export interface NavGroup {
    section: string;
    items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
    {
        section: 'General',
        items: [
            { key: 'inicio', label: 'Inicio', icon: 'House', route: 'inicio', permission: 'module.inicio.access' },
        ],
    },
    {
        section: 'Recepción',
        items: [
            { key: 'tablero', label: 'Tablero', icon: 'LayoutDashboard', route: 'tablero', permission: 'module.tablero.access' },
            { key: 'registro', label: 'Registro de pacientes', icon: 'UserPlus', route: 'registro', permission: 'module.registro.access' },
            { key: 'citas', label: 'Citas', icon: 'CalendarDays', route: 'citas', permission: 'module.citas.access' },
        ],
    },
    {
        section: 'Atención clínica',
        items: [
            { key: 'consulta', label: 'Consulta', icon: 'Stethoscope', route: 'consulta', permission: 'module.consulta.access' },
            { key: 'emergencia', label: 'Emergencia', icon: 'Siren', route: 'emergencia', permission: 'module.emergencia.access' },
            { key: 'internamiento', label: 'Internamiento', icon: 'BedDouble', route: 'internamiento', permission: 'module.internamiento.access' },
            { key: 'cirugia', label: 'Cirugía', icon: 'Scissors', route: 'cirugia', permission: 'module.cirugia.access' },
        ],
    },
    {
        section: 'Servicios',
        items: [
            { key: 'lab', label: 'Laboratorio', icon: 'FlaskConical', route: 'lab', permission: 'module.lab.access' },
            { key: 'img', label: 'Imágenes', icon: 'ScanLine', route: 'img', permission: 'module.img.access' },
            { key: 'impresos', label: 'Documentos imprimibles', icon: 'Printer', route: 'impresos', permission: 'module.impresos.access' },
        ],
    },
    {
        section: 'Caja',
        items: [
            { key: 'caja', label: 'Facturación', icon: 'Wallet', route: 'caja', permission: 'module.caja.access' },
            { key: 'cxc', label: 'Cuentas por cobrar', icon: 'Receipt', route: 'cxc', permission: 'module.cxc.access' },
            { key: 'cuadre', label: 'Cuadre de caja', icon: 'Coins', route: 'cuadre', permission: 'module.cuadre.access' },
        ],
    },
    {
        section: 'Inventario',
        items: [
            { key: 'almacen', label: 'Catálogo', icon: 'Package', route: 'almacen', permission: 'module.almacen.access' },
            { key: 'entrada', label: 'Entrada de mercancía', icon: 'PackagePlus', route: 'entrada', permission: 'module.entrada.access' },
        ],
    },
    {
        section: 'Administración',
        items: [
            { key: 'admin', label: 'Usuarios y roles', icon: 'Users', route: 'admin', permission: 'module.admin.access' },
            { key: 'doctores', label: 'Doctores y especialidades', icon: 'Stethoscope', route: 'doctores', permission: 'module.doctores.access' },
            { key: 'analisis', label: 'Catálogo de análisis', icon: 'FlaskConical', route: 'analisis', permission: 'module.analisis.access' },
            { key: 'imgcat', label: 'Catálogo de imágenes', icon: 'ScanLine', route: 'imgcat', permission: 'module.imgcat.access' },
            { key: 'precios', label: 'Catálogos de precios', icon: 'Tag', route: 'precios', permission: 'module.precios.access' },
            { key: 'habs', label: 'Habitaciones y camas', icon: 'BedDouble', route: 'habs', permission: 'module.habs.access' },
            { key: 'tema', label: 'Tema y estados', icon: 'Palette', route: 'tema', permission: 'module.tema.access' },
        ],
    },
];
