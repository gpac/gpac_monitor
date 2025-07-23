# Filter Arguments Types

Ce dossier contient tous les types spécifiques aux arguments de filtres GPAC.

## Fichiers

- `types.ts` - Tous les types liés aux arguments de filtres
- `index.ts` - Export des types pour faciliter l'importation

## Types principaux

### GPACTypes
Interface définissant tous les types de données GPAC supportés (numerics, fractions, strings, vectors, etc.)

### FilterArgumentBase
Interface de base pour les arguments de filtres avec propriétés communes comme `name`, `desc`, `hint`, etc.

### InputValue<T>
Type générique pour les valeurs d'input selon le type GPAC

### GPACArgumentType
Union type de tous les types d'arguments GPAC supportés

### GpacArgument
Interface complète pour un argument GPAC avec toutes ses métadonnées

## Migration

Les types ont été déplacés depuis :
- `src/types/domain/gpac/arguments.ts`
- `src/types/domain/gpac/model.ts` (GpacArgument uniquement)

vers ce dossier pour une meilleure organisation et localisation des types.
