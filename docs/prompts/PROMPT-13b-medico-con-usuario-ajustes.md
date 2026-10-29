# Prompt 13b — Ajustes al PR #23 (médico con usuario)

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la misma rama del PR #23 (`git checkout feat/medico-con-usuario && git pull`). Sube los commits al mismo PR y **no lo mezcles**. Sigue `CLAUDE.md`. Un commit por punto, empezando por el test que falla.

## 1. El diálogo de credenciales nunca se muestra (bloqueante)

El backend envía las credenciales con `Inertia::flash('credentials', …)`. En Inertia 3 los datos flash **no llegan en `page.props`**: llegan en **`page.flash`** y en el evento `flash` del router (así los lee `resources/js/hooks/use-flash-toast.ts`). `resources/js/pages/doctores/index.tsx` los busca en `usePage().props.credentials`, que siempre es `undefined`. En la app real la contraseña temporal **no se ve nunca**, y «Restablecer contraseña» tiene el mismo problema.

Los tests de Vitest pasan porque meten `credentials` en `page.props`, que no es lo que envía el servidor.

- Lee las credenciales de `usePage().flash` o del evento `flash` del router, siguiendo el patrón de `use-flash-toast.ts`. Quita `credentials` de `Props`.
- Corrige `doctores-credentials.test.tsx`: el mock tiene que poner las credenciales en `page.flash`. Agrega un test que confirme que si vienen en `page.props` **no** se muestran, para que no vuelva a pasar.
- Agrega el test de Pest que pedía el prompt 13: después de crear el médico, una **segunda** petición GET a `/admin/doctores` ya no contiene las credenciales en la sesión ni en la respuesta.
- Pruébalo en el navegador con Herd: crea un médico con «Crear usuario nuevo» y confirma que el diálogo aparece. Luego recarga la página y confirma que ya no aparece.

## 2. El lint no está en verde

`npm run lint` avisa: `'cn' is imported but never used` en `resources/js/pages/doctores/index.tsx:7`. La descripción del PR dice que es «código legado», pero **no es cierto**: ese import lo agregó este PR. En este proyecto los avisos del lint cuentan como fallo.

- Quita el import y confirma que `npm run lint; echo $?` imprime `0`.
- Corrige la descripción del PR.

## 3. Desactivar al médico no debe dejar fuera al administrador

`toggleDoctor` desactiva el usuario vinculado sin importar sus otros roles. El dueño es `administrador` + `medico`: si se desactiva su registro de médico, pierde el acceso a todo el sistema. Y si lo hace él mismo, se queda fuera.

- **No** se puede desactivar el médico vinculado al usuario autenticado. Responde con `Toast::error('No puedes desactivar tu propio registro de médico.')`.
- Al desactivar, el usuario vinculado se desactiva **solo si su único rol es `medico`**. Si tiene otros roles, el usuario sigue activo y solo queda inactivo el médico; el prompt 14 impedirá que un médico inactivo atienda.
- Al reactivar, se reactiva el usuario solo si su único rol es `medico`.
- **Tests (Pest):** los tres casos de arriba.

## 4. «Restablecer contraseña» pide confirmación

Hoy un clic invalida la contraseña actual sin preguntar.

- Antes de enviar, muestra un `ConfirmDialog` (o `FormDialog`) con el texto: «Se generará una contraseña temporal nueva. La actual dejará de funcionar. ¿Continuar?».
- Usa la ruta de Wayfinder (`doctores.reset-password`) en lugar de la URL escrita a mano.
- **Test (Vitest):** el `POST` no se envía hasta confirmar.

## 5. Nombre de usuario: apellidos con partícula y caracteres raros

En República Dominicana son comunes apellidos como «de los Santos», «De la Rosa» o «Del Orbe». Hoy, «María de la Cruz» genera `mde`. Además, un guion o un apóstrofo («Pérez-Gómez», «D'Oleo») acaba dentro del usuario.

- Al elegir el apellido, ignora las partículas `de`, `del`, `la`, `las`, `los`, `y`. Así, «María de la Cruz» → `mcruz` y «Juan de los Santos» → `jsantos`.
- El usuario final contiene solo `[a-z0-9]`: «Ana Pérez-Gómez» → `aperezgomez` y «Luis D'Oleo» → `ldoleo`.
- **Tests unitarios:** cada caso de arriba.

## 6. Mismo nombre al crear y al editar

Al crear, el `name` del usuario se guarda sin «Dr.»/«Dra.». Al editar el médico se copia tal cual, con el prefijo. Usa la misma normalización en los dos casos y agrega un test.

## Antes de subir

Los 7 comandos deben terminar con **código 0**. Pega en la descripción del PR la salida **real**, con el código de salida de `npm run lint`. No lo mezcles.
