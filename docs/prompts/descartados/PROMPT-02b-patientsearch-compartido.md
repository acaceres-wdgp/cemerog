# Prompt 02b — `PatientSearch` compartido entre Citas y Tablero

> Pégalo cuando el PR de 02a esté mezclado (`git checkout main && git pull`).

---

`resources/js/pages/citas/components/PatientSearch.tsx` y `resources/js/pages/tablero/components/PatientSearch.tsx` son prácticamente iguales: ambos buscan en `/citas/pacientes/buscar`. Unifícalos. Lee `CLAUDE.md`.

## Reglas

- Trabaja en la rama `refactor/patient-search-compartido`, creada desde `main`. Abre un PR. **No lo mezcles.**
- Solo puedes tocar:
  - `resources/js/components/cemerog/`
  - `resources/js/pages/citas/components/`
  - `resources/js/pages/tablero/components/`
  - los tests
- **Prohibido:** cambiar el aspecto o el comportamiento de ninguno de los dos buscadores, tocar el backend, instalar dependencias y usar `as any`, `@ts-ignore` o `eslint-disable`.

## Qué hacer

1. Compara las dos versiones. Si difieren en algo, como textos, mínimo de caracteres o estilos, **detente y dime las diferencias** antes de unificar.
2. Crea `resources/js/components/cemerog/PatientSearch.tsx`, partiendo de la versión de Citas, que ya usa tokens. El endpoint debe ser una prop, idealmente con la ruta de Wayfinder.
3. Agrega `resources/js/components/cemerog/__tests__/PatientSearch.test.tsx` con estos casos:
   - con menos de 2 caracteres no consulta;
   - con 2 o más consulta el endpoint recibido por prop;
   - muestra los resultados;
   - muestra "No se encontraron pacientes.";
   - al elegir un paciente llama al callback;
   - se cierra al hacer clic fuera.
4. Haz que Citas y Tablero usen el componente compartido y elimina las dos copias.
5. Los tests de caracterización `citas-index.test.tsx` y `tablero-index.test.tsx` deben pasar **sin modificarse**.

## Antes de abrir el PR

Los 7 comandos deben terminar con **código 0**; verifica el lint con `npm run lint; echo $?`:
```bash
vendor/bin/pint --test
vendor/bin/phpstan analyse --level=6
vendor/bin/pest
npm run types:check
npm run lint
npm run test
npm run build
```

Pega su salida real en la descripción del PR. No lo mezcles.
