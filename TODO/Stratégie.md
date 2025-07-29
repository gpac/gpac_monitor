# Stratégie Subscribe/Unsubscribe pour Graph Monitor

## 📋 État Actuel du Système

### Architecture Existante
- **GpacService** : Service singleton gérant les connexions WebSocket
- **SubscriptionManager** : Gestionnaire d'abonnements aux filtres et stats de session
- **SessionStatsSlice** : Store Redux pour la gestion des statistiques de session
- **StatsTabs** : Système d'onglets pour basculer entre Dashboard et filtres individuels

### Problématiques Identifiées
1. **Manque de coordination** entre les onglets et les abonnements
2. **Pas de désabonnement automatique** lors du changement d'onglet
3. **Gestion d'état fragmentée** entre Redux et état local des composants
4. **Abonnements multiples** potentiels sans nettoyage
5. **⚡ Problème asynchrone critique** : Les composants s'abonnent immédiatement mais la réponse du serveur est asynchrone, créant des états intermédiaires non gérés

## 🎯 Stratégie Recommandée

### 1. Centralisation de la Gestion d'Abonnements

#### A. Extension du SubscriptionManager
```typescript
// Ajout de méthodes spécialisées dans subscriptionManager.ts
public subscribeToSessionDashboard(): void {
  this.unsubscribeFromAllFilters(); // Nettoyage préalable
  this.subscribeToSessionStats();
}

public subscribeToSpecificFilter(idx: string): void {
  this.unsubscribeFromSessionStats(); // Se désabonner des stats globales
  this.unsubscribeFromAllFilters(); // Nettoyer les autres filtres
  this.subscribeToFilter(idx);
}

public unsubscribeFromAllFilters(): void {
  this.activeSubscriptions.forEach(subscription => {
    if (subscription.startsWith('filter_')) {
      this.unsubscribeFromFilter(subscription.replace('filter_', ''));
    }
  });
}
```

#### B. État Centralisé des Abonnements avec Gestion Asynchrone
```typescript
// Nouveau slice Redux : subscriptionSlice.ts
interface SubscriptionState {
  currentTab: 'dashboard' | `filter-${number}`;
  activeSubscriptions: {
    sessionStats: {
      status: 'idle' | 'subscribing' | 'subscribed' | 'error';
      lastUpdate: number | null;
    };
    filters: Map<number, {
      status: 'idle' | 'subscribing' | 'subscribed' | 'error';
      lastUpdate: number | null;
    }>;
  };
  transitionInProgress: boolean;
  pendingSubscriptions: Set<string>; // Abonnements en attente de confirmation
}
```

### 2. Gestion Asynchrone des Abonnements

#### A. Extension du SubscriptionManager avec Promesses
```typescript
// Extension du SubscriptionManager pour gérer l'asynchrone
export class SubscriptionManager {
  private pendingSubscriptions: Map<string, Promise<void>> = new Map();
  private subscriptionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  public async subscribeToSessionStatsAsync(): Promise<void> {
    const subscriptionId = 'session_stats';
    
    // Éviter les abonnements multiples
    if (this.pendingSubscriptions.has(subscriptionId)) {
      return this.pendingSubscriptions.get(subscriptionId)!;
    }

    const subscriptionPromise = new Promise<void>((resolve, reject) => {
      // Marquer comme en cours
      this.dispatch(setSubscriptionStatus({ 
        type: 'sessionStats', 
        status: 'subscribing' 
      }));

      // Timeout de sécurité (5 secondes)
      const timeoutId = setTimeout(() => {
        this.pendingSubscriptions.delete(subscriptionId);
        this.dispatch(setSubscriptionStatus({ 
          type: 'sessionStats', 
          status: 'error' 
        }));
        reject(new Error('Subscription timeout'));
      }, 5000);

      this.subscriptionTimeouts.set(subscriptionId, timeoutId);

      // Handler pour la réponse du serveur
      const handleResponse = (message: any) => {
        if (message.type === 'session_stats_confirmation') {
          clearTimeout(timeoutId);
          this.subscriptionTimeouts.delete(subscriptionId);
          this.pendingSubscriptions.delete(subscriptionId);
          
          this.dispatch(setSubscriptionStatus({ 
            type: 'sessionStats', 
            status: 'subscribed',
            lastUpdate: Date.now()
          }));
          
          this.removeMessageHandler(handleResponse);
          resolve();
        }
      };

      this.addMessageHandler(handleResponse);
      this.sendMessage({
        type: 'subscribe_session',
        interval: GPAC_CONSTANTS.SUBSCRIPTION_INTERVAL,
        fields: GPAC_CONSTANTS.SESSION_FIELDS,
      });
    });

    this.pendingSubscriptions.set(subscriptionId, subscriptionPromise);
    return subscriptionPromise;
  }

  public async subscribeToFilterAsync(idx: string): Promise<void> {
    const subscriptionId = `filter_${idx}`;
    
    if (this.pendingSubscriptions.has(subscriptionId)) {
      return this.pendingSubscriptions.get(subscriptionId)!;
    }

    const subscriptionPromise = new Promise<void>((resolve, reject) => {
      this.dispatch(setFilterSubscriptionStatus({ 
        filterId: parseInt(idx), 
        status: 'subscribing' 
      }));

      const timeoutId = setTimeout(() => {
        this.pendingSubscriptions.delete(subscriptionId);
        this.dispatch(setFilterSubscriptionStatus({ 
          filterId: parseInt(idx), 
          status: 'error' 
        }));
        reject(new Error(`Filter ${idx} subscription timeout`));
      }, 5000);

      this.subscriptionTimeouts.set(subscriptionId, timeoutId);

      const handleResponse = (message: any) => {
        if (message.type === 'filter_stats_confirmation' && 
            message.idx === parseInt(idx)) {
          clearTimeout(timeoutId);
          this.subscriptionTimeouts.delete(subscriptionId);
          this.pendingSubscriptions.delete(subscriptionId);
          
          this.dispatch(setFilterSubscriptionStatus({ 
            filterId: parseInt(idx), 
            status: 'subscribed',
            lastUpdate: Date.now()
          }));
          
          this.removeMessageHandler(handleResponse);
          resolve();
        }
      };

      this.addMessageHandler(handleResponse);
      this.sendMessage({ 
        type: 'subscribe_filter', 
        idx: parseInt(idx),
        interval: GPAC_CONSTANTS.SUBSCRIPTION_INTERVAL
      });
    });

    this.pendingSubscriptions.set(subscriptionId, subscriptionPromise);
    return subscriptionPromise;
  }
}
```

#### B. Hook Asynchrone : useAsyncStatsSubscription
```typescript
const useAsyncStatsSubscription = (tabId: string) => {
  const dispatch = useAppDispatch();
  const gpacService = useGpacService();
  const subscriptionState = useAppSelector(selectSubscriptionState);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const subscribeToTab = useCallback(async (newTabId: string) => {
    setIsTransitioning(true);
    
    try {
      if (newTabId === 'main') {
        // Attendre que l'abonnement session soit confirmé
        await gpacService.subscribeToSessionStatsAsync();
        console.log('✅ Session stats subscription confirmed');
        
      } else if (newTabId.startsWith('filter-')) {
        const filterId = newTabId.replace('filter-', '');
        
        // S'assurer qu'on se désabonne d'abord des session stats
        if (subscriptionState.activeSubscriptions.sessionStats.status === 'subscribed') {
          await gpacService.unsubscribeFromSessionStatsAsync();
        }
        
        // Attendre que l'abonnement filtre soit confirmé
        await gpacService.subscribeToFilterAsync(filterId);
        console.log(`✅ Filter ${filterId} subscription confirmed`);
      }
    } catch (error) {
      console.error('❌ Subscription failed:', error);
      // Gérer l'erreur : afficher un toast, revenir à l'onglet précédent, etc.
      dispatch(showSubscriptionError(error.message));
    } finally {
      setIsTransitioning(false);
    }
  }, [gpacService, subscriptionState, dispatch]);

  useEffect(() => {
    subscribeToTab(tabId);
    
    return () => {
      // Cleanup : annuler les abonnements en cours si le composant se démonte
      if (isTransitioning) {
        gpacService.cancelPendingSubscriptions();
      }
    };
  }, [tabId, subscribeToTab]);

  return {
    isTransitioning,
    subscriptionStatus: tabId === 'main' 
      ? subscriptionState.activeSubscriptions.sessionStats.status
      : subscriptionState.activeSubscriptions.filters.get(
          parseInt(tabId.replace('filter-', ''))
        )?.status || 'idle'
  };
};
```

### 3. Refactoring des Composants Stats

#### A. Modification du Entry Component avec Gestion Asynchrone
```typescript
// Dans session-overview/entry.tsx
const MultiFilterMonitor: React.FC<WidgetProps> = ({ id, title }) => {
  const [activeTab, setActiveTab] = useState('main');
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  
  // Hook asynchrone pour gérer les abonnements
  const { isTransitioning, subscriptionStatus } = useAsyncStatsSubscription(activeTab);
  
  const handleTabChange = useCallback(async (newTab: string) => {
    if (newTab === activeTab || isTransitioning) return;
    
    // Marquer l'onglet comme en attente
    setPendingTab(newTab);
    
    try {
      // Changer l'onglet déclenche automatiquement l'abonnement via le hook
      setActiveTab(newTab);
      setPendingTab(null);
    } catch (error) {
      // En cas d'erreur, revenir à l'onglet précédent
      console.error('Failed to change tab:', error);
      setPendingTab(null);
    }
  }, [activeTab, isTransitioning]);

  // Rendu conditionnel basé sur l'état de l'abonnement
  const renderTabContent = () => {
    if (subscriptionStatus === 'subscribing' || isTransitioning) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <p className="text-sm text-gray-500">
              {isTransitioning ? 'Switching subscription...' : 'Loading stats...'}
            </p>
          </div>
        </div>
      );
    }

    if (subscriptionStatus === 'error') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-500">
            <p>Failed to load stats</p>
            <button 
              onClick={() => handleTabChange(activeTab)}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    // Rendu normal quand l'abonnement est actif
    return (
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <StatsTabs
          activeTab={activeTab}
          pendingTab={pendingTab}
          onValueChange={handleTabChange}
          monitoredFilters={monitoredFiltersState}
          onCloseTab={handleCloseTab}
          tabsRef={tabsRef}
          subscriptionStatuses={{
            sessionStats: subscriptionState.activeSubscriptions.sessionStats.status,
            filters: subscriptionState.activeSubscriptions.filters
          }}
        />
        
        {/* Tab Contents */}
        {/* ... */}
      </Tabs>
    );
  };

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="h-full">
        {renderTabContent()}
      </div>
    </WidgetWrapper>
  );
};
```

#### B. StatsTabs avec Indicateurs d'État Asynchrone
```typescript
// Dans StatsTabs.tsx
interface StatsTabsProps {
  activeTab: string;
  pendingTab: string | null;
  onValueChange: (value: string) => void;
  monitoredFilters: Map<number, GpacNodeData>;
  onCloseTab: (idx: number, e: React.MouseEvent) => void;
  tabsRef: React.RefObject<HTMLDivElement>;
  subscriptionStatuses: {
    sessionStats: 'idle' | 'subscribing' | 'subscribed' | 'error';
    filters: Map<number, { status: 'idle' | 'subscribing' | 'subscribed' | 'error' }>;
  };
}

export const StatsTabs: React.FC<StatsTabsProps> = ({ 
  activeTab,
  pendingTab,
  onValueChange, 
  monitoredFilters,
  onCloseTab,
  tabsRef,
  subscriptionStatuses
}) => {
  const handleTabClick = useCallback((tabValue: string) => {
    // Empêcher le changement si une transition est en cours
    if (pendingTab || tabValue === activeTab) return;
    onValueChange(tabValue);
  }, [activeTab, pendingTab, onValueChange]);

  // Obtenir l'état d'abonnement pour un onglet
  const getTabSubscriptionStatus = (tabValue: string) => {
    if (tabValue === 'main') {
      return subscriptionStatuses.sessionStats;
    } else if (tabValue.startsWith('filter-')) {
      const filterId = parseInt(tabValue.replace('filter-', ''));
      return subscriptionStatuses.filters.get(filterId)?.status || 'idle';
    }
    return 'idle';
  };

  // Indicateur visuel basé sur l'état
  const getStatusIndicator = (tabValue: string) => {
    const status = getTabSubscriptionStatus(tabValue);
    const isPending = pendingTab === tabValue;
    
    if (isPending || status === 'subscribing') {
      return (
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse ml-1" 
             title="Subscription in progress" />
      );
    }
    
    if (status === 'subscribed') {
      return (
        <div className="w-2 h-2 rounded-full bg-green-500 ml-1" 
             title="Subscribed and receiving data" />
      );
    }
    
    if (status === 'error') {
      return (
        <div className="w-2 h-2 rounded-full bg-red-500 ml-1" 
             title="Subscription failed" />
      );
    }
    
    return null; // idle state
  };

  // Styles conditionnels pour l'onglet
  const getTabClassName = (tabValue: string) => {
    const baseClass = "flex items-center gap-1 relative";
    const status = getTabSubscriptionStatus(tabValue);
    const isPending = pendingTab === tabValue;
    
    if (isPending || status === 'subscribing') {
      return `${baseClass} opacity-75 cursor-wait`;
    }
    
    if (status === 'error') {
      return `${baseClass} text-red-600`;
    }
    
    return baseClass;
  };

  return (
    <TabsList className="sticky top-0 z-10 mb-4 justify-start border-b border-border bg-background" ref={tabsRef}>
      {/* Dashboard Tab */}
      <TabsTrigger 
        value="main" 
        className={getTabClassName("main")}
        data-value="main"
        onClick={() => handleTabClick("main")}
        disabled={pendingTab !== null}
      >
        <LuMonitorCheck className="h-4 w-4" />
        <span>Dashboard</span>
        {getStatusIndicator("main")}
      </TabsTrigger>

      {/* Filter Tabs */}
      {Array.from(monitoredFilters.entries()).map(([idx, filter]) => {
        const tabValue = `filter-${idx}`;
        return (
          <TabsTrigger
            key={`tab-${idx}`}
            value={tabValue}
            className={getTabClassName(tabValue)}
            data-value={tabValue}
            onClick={() => handleTabClick(tabValue)}
            disabled={pendingTab !== null}
          >
            <span>{filter.name}</span>
            {getStatusIndicator(tabValue)}
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-4 w-4 rounded-full p-0 hover:bg-red-100"
              onClick={(e) => onCloseTab(idx, e)}
              disabled={activeTab === tabValue && getTabSubscriptionStatus(tabValue) === 'subscribing'}
            >
              ×
            </Button>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
};
```

### 4. Gestion des Erreurs et Reconnexions

#### A. Stratégie de Résilience
```typescript
// Dans useStatsSubscription
const handleSubscriptionError = useCallback((error: Error) => {
  console.error('Subscription error:', error);
  
  // Retry logic avec backoff exponentiel
  const retrySubscription = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
        
        // Réessayer l'abonnement
        if (activeTab === 'main') {
          gpacService.subscribeToSessionDashboard();
        } else {
          const filterId = activeTab.replace('filter-', '');
          gpacService.subscribeToSpecificFilter(filterId);
        }
        break;
      } catch (retryError) {
        if (i === retries - 1) throw retryError;
      }
    }
  };
  
  retrySubscription();
}, [activeTab, gpacService]);
```

### 5. Optimisations de Performance

#### A. Mise en Cache Intelligente
```typescript
// Cache des données avec TTL
const useStatsCache = () => {
  const cache = useRef(new Map());
  
  const getCachedStats = (key: string) => {
    const cached = cache.current.get(key);
    if (cached && Date.now() - cached.timestamp < 5000) { // 5s TTL
      return cached.data;
    }
    return null;
  };
  
  const setCachedStats = (key: string, data: any) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now()
    });
  };
  
  return { getCachedStats, setCachedStats };
};
```

#### B. Debouncing des Changements d'Onglets
```typescript
const useDebouncedTabChange = (delay = 300) => {
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedTabChange = useCallback((newTab: string) => {
    setPendingTab(newTab);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onValueChange(newTab);
      setPendingTab(null);
    }, delay);
  }, [onValueChange, delay]);
  
  return { debouncedTabChange, pendingTab };
};
```

## 🚀 Plan d'Implémentation

### Phase 1 : Fondations (1-2 jours)
1. Créer le nouveau `subscriptionSlice.ts`
2. Étendre le `SubscriptionManager` avec les nouvelles méthodes
3. Créer le hook `useStatsSubscription`

### Phase 2 : Refactoring Components (1 jour)
1. Modifier le composant `entry.tsx` pour utiliser le nouveau hook
2. Améliorer `StatsTabs` avec les indicateurs visuels
3. Intégrer la gestion d'erreurs

### Phase 3 : Optimisations (1 jour)
1. Implémenter le cache des statistiques
2. Ajouter le debouncing des changements d'onglets
3. Tests et validation

### Phase 4 : Tests et Documentation (0.5 jour)
1. Tests unitaires pour les nouveaux hooks
2. Tests d'intégration pour les transitions d'onglets
3. Documentation technique

## ✅ Avantages de Cette Stratégie

- **🎯 Cohérence** : Gestion centralisée des abonnements
- **⚡ Performance** : Évite les abonnements multiples inutiles
- **🔄 Fiabilité** : Nettoyage automatique et gestion d'erreurs
- **🎨 UX Améliorée** : Indicateurs visuels d'état d'abonnement
- **🧹 Maintenabilité** : Code organisé et testable
- **📊 Monitoring** : Traçabilité des abonnements actifs
- **⏱️ Gestion Asynchrone Robuste** : Timeout, retry et annulation des requêtes
- **🚦 États Visuels Clairs** : L'utilisateur sait toujours ce qui se passe
- **🛡️ Protection Contre les Race Conditions** : Empêche les états incohérents

## 🔧 Points d'Attention

1. **Transition Fluide** : S'assurer qu'il n'y ait pas de perte de données pendant les changements d'onglets
2. **Gestion Mémoire** : Nettoyage proper des abonnements et timers
3. **État Loading** : Feedback utilisateur pendant les transitions
4. **Reconnexion** : Restauration des abonnements après une déconnexion WebSocket
5. **⚡ Gestion Asynchrone** : 
   - Gérer les timeouts d'abonnement (5s max)
   - Annuler les abonnements en cours lors des changements d'onglet
   - Afficher des indicateurs visuels clairs (loading, success, error)
   - Implémenter une logique de retry en cas d'échec
6. **États de Course** : Empêcher les changements d'onglet multiples simultanés
7. **Feedback Utilisateur** : Messages d'erreur explicites et boutons de retry

Cette stratégie garantit une gestion robuste et efficace des abonnements tout en maintenant une expérience utilisateur fluide.