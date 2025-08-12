# Modern PID Statistics Components

## Overview

Ce dossier contient les nouveaux composants UI optimisés pour l'affichage des statistiques critiques des PIDs dans l'interface de monitoring GPAC. Ces composants offrent une interface moderne, responsive et centrée sur les informations les plus importantes.

## Composants Principaux

### 🚨 CriticalPIDStats

Affiche les 5 états critiques prioritaires avec badges colorés et alertes :

- **Connection State** (disconnected) - Rouge si déconnecté
- **Blocking State** (would_block) - Rouge si bloqué
- **Queue Status** (nb_pck_queued) - Orange si congestion
- **Buffer Level** avec barre de progression - Rouge < 20%, Orange > 80%
- **Playback State** (playing/eos) - Vert si en lecture

### ⚡️ PerformanceMetrics

Affiche les métriques de performance avec badges d'efficacité :

- Taux de traitement (average/max process rate)
- Débit (average/max bitrate)
- Statistiques de traitement (nb_processed, total_process_time)
- Calculs d'efficacité automatiques

### 🎞️ MultimediaParams

Paramètres multimédia dans des accordéons collapsibles :

- **Video** : codec, résolution, pixelformat, fps, SAP count
- **Audio** : codec, samplerate, channels, format
- **Technical** : type, timescale, bitrate, duration
- Badges contextuels (résolution, nombre de canaux, codec)

### 📊 PIDStatsOverview (Composant Principal)

Combine tous les composants ci-dessus avec :

- En-tête avec nom du PID, type et statut global
- Statistiques rapides (buffer utilisé, usage %, paquets en queue)
- Informations du filtre parent
- Sections avancées conditionnelles

### 📋 CompactPIDStats

Version compacte pour les vues tableau de bord :

- Alertes critiques (max 2 visibles + compteur)
- Barre de progression du buffer
- Statistiques essentielles sur 2 colonnes
- Clickable pour accès aux détails

## Utilisation

### Import

```typescript
import {
  PIDStatsOverview,
  CriticalPIDStats,
  PerformanceMetrics,
  MultimediaParams,
  CompactPIDStats,
} from '@/components/views/stats-session/monitored_filters/cards';
```

### Exemple d'utilisation complète

```typescript
// Vue détaillée - affiche tous les composants
<PIDStatsOverview
  pidData={pidData}
  showAdvanced={true}
/>

// Vue compacte pour dashboard
<CompactPIDStats
  pidData={pidData}
  onClick={() => openDetailsView(pidData)}
/>

// Composants individuels pour layout custom
<CriticalPIDStats pidData={pidData} />
<PerformanceMetrics pidData={pidData} />
<MultimediaParams pidData={pidData} />
```

## Design System

### Couleurs d'alerte

- 🔴 **Rouge (destructive)** : États critiques (disconnected, would_block, buffer < 20%)
- 🟠 **Orange (secondary)** : Warnings (queue élevée, buffer > 80%)
- 🟢 **Vert (default)** : États normaux (connected, playing, buffer OK)

### Classes CSS utilisées

- `bg-stat` - Fond des cartes (cohérent avec l'existant)
- `border-transparent` - Bordures transparentes
- `text-muted-foreground` - Texte en gris pour les labels
- `stat-label` - Classe custom pour les labels de statistiques

### Icônes (react-icons/lu)

- `LuMonitor` : PIDs
- `LuWifi/LuWifiOff` : Connection état
- `LuTriangle` : Alertes/warnings
- `LuPlay/LuPause` : Playback état
- `LuActivity` : Performance
- `LuFilm/LuMusic` : Types multimédia
- `LuSettings` : Paramètres techniques

## Responsive Design

- Layout flexible avec grilles adaptatives
- Accordéons pour économiser l'espace vertical
- Badges qui s'adaptent au contenu
- ScrollArea pour les listes longues
- Progress bars avec couleurs contextuelles

## TypeScript

Tous les composants utilisent :

- `TabPIDData` interface pour les données PID
- Props typées avec interfaces spécifiques
- memo() pour optimiser les re-renders
- displayName pour le debugging

## Intégration

Les composants remplacent l'ancien `PIDDetails` dans :

- `/tabs/OutputsTab.tsx`
- `/tabs/InputsTab.tsx`

Ils peuvent aussi être utilisés dans de nouveaux contextes comme :

- Dashboards overview
- Alertes temps réel
- Rapports de monitoring
- Vues mobiles

## Performance

- Composants mémorisés avec `memo()`
- Calculs conditionnels (n'affiche que les données disponibles)
- Lazy loading des sections avancées
- Optimisation des re-renders via keys stables
