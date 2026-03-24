# Puntos de Restauración — LIFEFYT

## v1.0-stable
**Fecha:** 2026-03-24
**Estado:** Sistema de rutinas y programa funcionando. Race condition de guardado corregida.

### Qué incluye este punto
- Exercise bank (~180 ejercicios, 6 grupos musculares)
- Esquema Supabase completo (exercises, user_programs, program_blocks, routines, user_goals)
- Program Engine con periodización multi-bloque (1–6 meses)
- Fix: rutina no aparecía después del onboarding (race condition en saveRoutine)
- Dashboard carga rutina y programa activo desde Supabase
- RoutinePage con auto-fetch y spinner de carga

### Cómo volver a este punto

```bash
# Solo ver el código en este estado (sin modificar nada)
git checkout v1.0-stable

# Volver al desarrollo normal
git checkout main

# Restaurar main a este punto exacto (elimina commits posteriores)
git checkout main
git reset --hard v1.0-stable
```

---

> Agrega nuevas entradas aquí cada vez que etiquetes un punto estable con `git tag`.
