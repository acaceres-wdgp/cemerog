# Prompt 08b — Ajustes al PR #15 (Registro directo)

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la misma rama del PR #15 (`git checkout feat/registro-directo && git pull`). Sube los commits al mismo PR y **no lo mezcles**. Sigue `CLAUDE.md`.

## 1. El lint no está en verde

`npm run lint` termina con **código 1** por un aviso:
`eslint(no-unused-vars): 'waitFor' is imported but never used` en `resources/js/__tests__/registro-duplicate-check.test.tsx:9`.

La descripción del PR dice que ese import «es preexistente», pero **no es cierto**: ese archivo es nuevo en este PR. En este proyecto los avisos del lint cuentan como fallo.

- Quita el import que no se usa.
- Confirma que `npm run lint; echo $?` imprime `0`.
- Corrige la descripción del PR.

## 2. Aviso de duplicados: respuesta vieja que pisa a la nueva

Si el usuario escribe un documento completo, lo cambia y en ese momento la primera consulta todavía no ha respondido, su respuesta puede llegar tarde y mostrar el aviso de un paciente que no corresponde al documento actual.

- Usa un `AbortController`: aborta la petición anterior cuando cambie el documento o cuando se desmonte el componente.
- Antes de guardar el resultado, compara el documento consultado con el actual.
- **Test (Vitest):** dos documentos completos seguidos, donde la primera respuesta llega después de la segunda. Solo debe quedar el aviso de la segunda.

## 3. Aviso de duplicados con pasaporte o cédula extranjera

El aviso consulta `/registro/pacientes/buscar?q=…`, que usa `SearchPatients`. Esa acción trata como **búsqueda por nombre** (`LIKE`) cualquier texto que tenga letras. Un pasaporte como `AB123456` nunca se busca por hash de documento, así que el aviso no detecta duplicados de pasaporte o de cédula extranjera con letras. El backend sí los rechaza al guardar, porque `UniqueDocumentNumber` usa el hash.

Agrega un endpoint específico de verificación exacta:
- **Ruta:** `GET /registro/pacientes/existe?documento=…`, dentro del grupo `permission:module.registro.access`, con el nombre `registro.pacientes.exists`.
- **Comportamiento:**
  - Calcula el hash **exactamente igual** que `UniqueDocumentNumber`. Mejor aún, extrae esa normalización a un solo lugar, como `Pii::hash` o un método compartido, y que tanto la regla como el endpoint lo usen.
  - Devuelve `{ id, full_name, age }` si el paciente existe, o `null` si no.
- **Frontend:** el aviso usa este endpoint en lugar de `/registro/pacientes/buscar`.
- **Tests (Pest):**
  - Encuentra por cédula con guiones y sin guiones.
  - Encuentra por pasaporte con letras.
  - Devuelve `null` si no existe.
  - Devuelve 403 sin permiso.
  - **No** usa `LIKE`: un documento parcial no devuelve coincidencias.

## Antes de subir

Los 7 comandos deben terminar con **código 0**. Pega en la descripción del PR la salida **real**, con el código de salida de `npm run lint`. No lo mezcles.
