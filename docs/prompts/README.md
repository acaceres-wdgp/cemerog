# Prompts de desarrollo

Historial de los prompts entregados a Claude Code para desarrollar CEMEROG. Cada prompt se ejecutó (o se ejecutará) en su propia rama y se integró por PR, con revisión antes de mezclar.

Los archivos se guardan **tal como se entregaron**: el formateador los ignora (`fmt.ignorePatterns` en `vite.config.ts`) para no alterarlos. Los PR se citan como `acaceres-wdgp/cemerog#N`.

## Cómo se trabaja

1. Se define el cambio y se revisa el código actual.
2. Se escribe un prompt por tarea: rama propia, TDD, reglas y entregable.
3. El agente abre un PR **sin mezclarlo**.
4. Revisión: checks, tests de caracterización y comparación visual.
5. Si hay ajustes, se entrega un prompt de corrección con sufijo `b`/`c` sobre la misma rama.
6. Se mezcla por PR en GitHub.

## Índice

### Saneamiento inicial

| Prompt | Tema | PR | Estado |
|---|---|---|---|
| [PROMPT-arreglos-cemerog](PROMPT-arreglos-cemerog.md) | Saneamiento en 6 fases: `/pacientes` en blanco, checks, PII, soft deletes, documentación y piloto de tokens | Commits `2c3032d`…`79d02a9` (sin PR) | ✅ Ejecutado |
| [PROMPT-pendientes-cemerog](PROMPT-pendientes-cemerog.md) | Lint, PHP 8.4, `create.tsx` muerto, `open_turn`, test de reversión | #7 | ✅ Mezclado |

### Refactor a tokens y componentes

| Prompt | Tema | PR | Estado |
|---|---|---|---|
| [PROMPT-01](PROMPT-01-citas-tokens.md) | Citas: tokens y componentes | #8 | ✅ Mezclado |
| [PROMPT-01b](PROMPT-01b-citas-correcciones.md) | Citas: correcciones | #8 | ✅ Mezclado |
| [PROMPT-01c](PROMPT-01c-citas-ajustes-finales.md) | Citas: ajustes finales (lint, `FormDialog`) | #8 | ✅ Mezclado |
| [PROMPT-02](PROMPT-02-tablero-tokens.md) | Tablero: tokens y `PatientSearch` compartido | #9 | ✅ Mezclado |
| [PROMPT-02-fix](PROMPT-02-fix-tablero-conflictos.md) | Tablero: conflictos con `main` | #9 | ✅ Mezclado |
| [PROMPT-03](PROMPT-03-registro-edit-tokens.md) | `registro/edit`: tokens | #10 | ✅ Mezclado |
| [PROMPT-04](PROMPT-04-libreria-componentes-tokens.md) | Librería `components/cemerog/`: tokens | #11 | ✅ Mezclado |
| [PROMPT-12a](PROMPT-12a-consulta-partir.md) | Consulta: tests de caracterización y partir el archivo | #20 | ✅ Mezclado |
| [PROMPT-12b](PROMPT-12b-consulta-tokens.md) | Consulta: tokens | #21 | ✅ Mezclado |
| [PROMPT-12c](PROMPT-12c-consulta-ajustes.md) | Consulta: estilos falsamente «dinámicos» e IMC | #21 | ✅ Mezclado |

### Funcionalidad y correcciones

| Prompt | Tema | PR | Estado |
|---|---|---|---|
| [PROMPT-05](PROMPT-05-turno-por-medico.md) | Turnos con varios médicos el mismo día; quitar «Eliminar paciente» | #12 | ✅ Mezclado |
| [PROMPT-05b](PROMPT-05b-turno-por-medico-ajustes.md) | Ajustes de turnos por médico | #12 | ✅ Mezclado |
| [PROMPT-06](PROMPT-06-medico-usuario.md) | Vincular médico ↔ usuario y consultorio | #13 | ✅ Mezclado |
| [PROMPT-06b](PROMPT-06b-medico-usuario-ajustes.md) | Ajustes médico ↔ usuario | #13 | ✅ Mezclado |
| [PROMPT-07](PROMPT-07-layout-topbar-sidebar.md) | Barra superior y tarjeta «Turno actual» | #14 | ✅ Mezclado |
| [PROMPT-07b](PROMPT-07b-layout-ajustes.md) | Ajustes del layout | #14 | ✅ Mezclado |
| [PROMPT-08](PROMPT-08-registro-sin-buscador.md) | Registro directo, sin buscador; aviso de duplicados | #15 | ✅ Mezclado |
| [PROMPT-08b](PROMPT-08b-registro-ajustes.md) | Ajustes de Registro directo | #15 | ✅ Mezclado |
| [PROMPT-09](PROMPT-09-documento-y-registro-sin-atencion.md) | Documento normalizado por tipo; «Solo registrar paciente» | #17 | ✅ Mezclado |
| [PROMPT-09b](PROMPT-09b-ajustes.md) | Ajustes del 09 | #17 | ✅ Mezclado |
| [PROMPT-10](PROMPT-10-flash-toasts.md) | Mensajes de éxito (`Toast`) en toda la app | #18 | ✅ Mezclado |
| [PROMPT-11](PROMPT-11-citas-hora.md) | Citas de días futuros que no aparecían (hora de MySQL) | #19 | ✅ Mezclado |

### Módulo de Consulta (pendientes, en orden)

| Prompt | Tema | Depende de | Estado |
|---|---|---|---|
| [PROMPT-13](PROMPT-13-medico-con-usuario.md) | Al crear un médico se crea su usuario y sus credenciales | — | ✅ Mezclado (#23) |
| [PROMPT-13b](PROMPT-13b-medico-con-usuario-ajustes.md) | Ajustes del 13: diálogo de credenciales, lint, desactivar al dueño, confirmación, partículas | 13 | ✅ Mezclado (#23) |
| [PROMPT-14](PROMPT-14-consulta-acceso-y-autoria.md) | Solo el médico del turno atiende y firma; el administrador no médico no ve Consulta | 13 | ✅ Mezclado (#25) |
| [PROMPT-14b](PROMPT-14b-consulta-acceso-ajustes.md) | Ajustes del 14: estado vacío, menú y alta solo de turnos abiertos | 14 | ✅ Mezclado (#25) |
| [PROMPT-15](PROMPT-15-signos-vitales.md) | Signos vitales en libras y pies/pulgadas; IMC; «Plan» | 12c, 14 | 🔄 En revisión (#27) |
| [PROMPT-15b](PROMPT-15b-signos-vitales-ajustes.md) | Ajustes del 15: ida y vuelta de talla y peso, errores del backend, test de rangos | 15 | 🔄 En revisión (#27) |
| [PROMPT-16](PROMPT-16-acciones-y-alta.md) | Botones de acción y alta médica con tipo | 15 | ⏳ Pendiente |
| [PROMPT-17](PROMPT-17-receta.md) | Receta: guardar, imprimir y ver en el historial | 16 | ⏳ Pendiente |
| [PROMPT-18](PROMPT-18-cuenta-cargos-honorarios.md) | Cuenta del día, cargos y honorarios del médico | 17 | ⏳ Pendiente |

### Sin prompt (hechos directamente en la revisión)

| Tema | PR |
|---|---|
| Deshabilitar GitHub Actions (el despliegue es por Forge) | #6 |
| Botón de cerrar duplicado en el panel del paciente | #16 |

### Descartados

En [`descartados/`](descartados/) está la versión dividida del refactor de Tablero (02a, 02b, 02c). No se ejecutó: se optó por el PROMPT-02 completo.

## Convenciones

- Numeración por tarea (`PROMPT-NN-tema.md`); los ajustes sobre el mismo PR usan sufijo `b`, `c`.
- Al agregar un prompt nuevo, actualiza este índice (tema, PR y estado).
