/**
 * CEMEROG navigation configuration.
 * Groups, keys, labels, icons, and route names.
 */

export interface NavItem {
    key: string;
    label: string;
    icon: string;
    href: string;
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
            { key: 'inicio', label: 'Inicio', icon: 'House', href: '/inicio', permission: 'module.inicio.access' },
        ],
    },
    {
        section: 'Recepción',
        items: [
            { key: 'tablero', label: 'Tablero', icon: 'LayoutDashboard', href: '/tablero', permission: 'module.tablero.access' },
            { key: 'registro', label: 'Registro de pacientes', icon: 'UserPlus', href: '/registro', permission: 'module.registro.access' },
            { key: 'citas', label: 'Citas', icon: 'CalendarDays', href: '/citas', permission: 'module.citas.access' },
        ],
    },
    {
        section: 'Atención clínica',
        items: [
            { key: 'consulta', label: 'Consulta', icon: 'Stethoscope', href: '/consulta', permission: 'module.consulta.access' },
            { key: 'emergencia', label: 'Emergencia', icon: 'Siren', href: '/emergencia', permission: 'module.emergencia.access' },
            { key: 'internamiento', label: 'Internamiento', icon: 'BedDouble', href: '/internamiento', permission: 'module.internamiento.access' },
            { key: 'cirugia', label: 'Cirugía', icon: 'Scissors', href: '/cirugia', permission: 'module.cirugia.access' },
        ],
    },
    {
        section: 'Servicios',
        items: [
            { key: 'lab', label: 'Laboratorio', icon: 'FlaskConical', href: '/laboratorio', permission: 'module.lab.access' },
            { key: 'img', label: 'Imágenes', icon: 'ScanLine', href: '/imagenes', permission: 'module.img.access' },
            { key: 'impresos', label: 'Documentos imprimibles', icon: 'Printer', href: '/impresos', permission: 'module.impresos.access' },
        ],
    },
    {
        section: 'Caja',
        items: [
            { key: 'caja', label: 'Facturación', icon: 'Wallet', href: '/facturacion', permission: 'module.caja.access' },
            { key: 'cxc', label: 'Cuentas por cobrar', icon: 'Receipt', href: '/cuentas-por-cobrar', permission: 'module.cxc.access' },
            { key: 'cuadre', label: 'Cuadre de caja', icon: 'Coins', href: '/cuadre-de-caja', permission: 'module.cuadre.access' },
        ],
    },
    {
        section: 'Inventario',
        items: [
            { key: 'almacen', label: 'Catálogo', icon: 'Package', href: '/almacen', permission: 'module.almacen.access' },
            { key: 'entrada', label: 'Entrada de mercancía', icon: 'PackagePlus', href: '/entrada-mercancia', permission: 'module.entrada.access' },
        ],
    },
    {
        section: 'Administración',
        items: [
            { key: 'admin', label: 'Usuarios y roles', icon: 'Users', href: '/admin/usuarios', permission: 'module.admin.access' },
            { key: 'doctores', label: 'Doctores y especialidades', icon: 'Stethoscope', href: '/admin/doctores', permission: 'module.doctores.access' },
            { key: 'analisis', label: 'Catálogo de análisis', icon: 'FlaskConical', href: '/admin/analisis', permission: 'module.analisis.access' },
            { key: 'imgcat', label: 'Catálogo de imágenes', icon: 'ScanLine', href: '/admin/imagenes-catalogo', permission: 'module.imgcat.access' },
            { key: 'precios', label: 'Catálogos de precios', icon: 'Tag', href: '/admin/precios', permission: 'module.precios.access' },
            { key: 'habs', label: 'Habitaciones y camas', icon: 'BedDouble', href: '/admin/habitaciones', permission: 'module.habs.access' },
            { key: 'tema', label: 'Tema y estados', icon: 'Palette', href: '/admin/tema', permission: 'module.tema.access' },
        ],
    },
];
