# Open Interest Screener - DDD Architecture

## 1. Загальна архітектура системи

```mermaid
graph TB
    subgraph "External Systems"
        Redis[Redis Pub/Sub]
        PG[(PostgreSQL)]
    end

    subgraph "Application Layer"
        Main[main.js<br/>Application Bootstrap]
    end

    subgraph "Domain Layer"
        subgraph "Entities"
            PR[PriceRecord]
            OIR[OpenInterestRecord]
            SYM[Symbol]
        end
        
        subgraph "Value Objects"
            PROV[Provider]
            TS[Timestamp]
            PC[PercentageChange]
            AC[AnalysisConfig]
        end
        
        subgraph "Domain Services"
            OIA[OpenInterestAnalyzer]
            PA[PriceAnalyzer]
        end
        
        subgraph "Domain Events"
            OITE[OpenInterestThresholdExceeded]
            PCD[PriceChangeDetected]
        end
        
        subgraph "Repository Interfaces"
            IMDR[IMarketDataRepository]
            IEP[IEventPublisher]
        end
    end

    subgraph "Infrastructure Layer"
        subgraph "Repository Implementations"
            IMMDR[InMemoryMarketDataRepository]
            REP[RedisEventPublisher]
            SR[SymbolsRepository]
        end
        
        subgraph "Cache Services"
            RedisService[Redis Service]
        end
    end

    Redis --> Main
    PG --> SR
    Main --> OIA
    Main --> PA
    OIA --> IMDR
    PA --> IMDR
    OIA --> IEP
    PA --> IEP
    IMDR -.-> IMMDR
    IEP -.-> REP
    REP --> RedisService
    IMMDR --> PR
    IMMDR --> OIR
    OIA --> OITE
    PA --> PCD
    OIA --> AC
    PA --> AC
    
    classDef domain fill:#e1f5fe
    classDef infrastructure fill:#f3e5f5
    classDef application fill:#e8f5e8
    
    class PR,OIR,SYM,PROV,TS,PC,AC,OIA,PA,OITE,PCD,IMDR,IEP domain
    class IMMDR,REP,SR,RedisService infrastructure
    class Main application
```

## 2. Детальна доменна модель

```mermaid
classDiagram
    %% Entities
    class PriceRecord {
        -symbol: string
        -provider: string
        -price: number
        -timestamp: number
        +calculatePercentageChange(other: PriceRecord): number
        +isOlderThan(timestamp: number): boolean
        +equals(other: PriceRecord): boolean
    }
    
    class OpenInterestRecord {
        -symbol: string
        -provider: string
        -openInterest: number
        -timestamp: number
        +calculatePercentageChange(other: OpenInterestRecord): number
        +isOlderThan(timestamp: number): boolean
        +equals(other: OpenInterestRecord): boolean
    }
    
    class Symbol {
        -symbol: string
        -provider: string
        +equals(other: Symbol): boolean
        +toString(): string
    }

    %% Value Objects
    class Provider {
        <<value object>>
        -value: string
        +VALID_PROVIDERS: string[]
        +equals(other: Provider): boolean
        +toString(): string
        +isValid(value: string): boolean
    }
    
    class Timestamp {
        <<value object>>
        -value: number
        +isOlderThan(other: Timestamp): boolean
        +isNewerThan(other: Timestamp): boolean
        +subtract(ms: number): Timestamp
        +add(ms: number): Timestamp
        +toDate(): Date
    }
    
    class PercentageChange {
        <<value object>>
        -value: number
        +exceedsThreshold(threshold: number): boolean
        +isPositive(): boolean
        +isNegative(): boolean
        +toFixed(decimals: number): string
    }
    
    class AnalysisConfig {
        <<value object>>
        -oiThreshold: number
        -priceThreshold: number
        -timeWindow: number
        -cooldownPeriod: number
        -dataRetentionPeriod: number
        +validate(): void
    }

    %% Domain Services
    class OpenInterestAnalyzer {
        <<domain service>>
        -marketDataRepository: IMarketDataRepository
        -eventPublisher: IEventPublisher
        -config: AnalysisConfig
        -notificationTracker: Map
        +addOpenInterestRecord(provider, symbol, value, timestamp): Promise~void~
        +analyze(): Promise~void~
        -analyzeSymbolForProvider(symbol, provider, currentTime): Promise~void~
        -calculatePriceChangeForPeriod(symbol, provider, cutoffTime): Promise~PercentageChange~
        -canNotifyAgain(provider, symbol, currentTime): boolean
        -recordNotification(provider, symbol, currentTime): void
    }
    
    class PriceAnalyzer {
        <<domain service>>
        -marketDataRepository: IMarketDataRepository
        -eventPublisher: IEventPublisher
        -config: AnalysisConfig
        -notificationTracker: Map
        +addPriceRecord(provider, symbol, value, timestamp): Promise~void~
        +analyze(): Promise~void~
        -analyzeSymbolForProvider(symbol, provider, currentTime): Promise~void~
        -canNotifyAgain(provider, symbol, currentTime): boolean
        -recordNotification(provider, symbol, currentTime): void
    }

    %% Domain Events
    class OpenInterestThresholdExceeded {
        <<domain event>>
        -symbol: string
        -provider: string
        -oiPercentageChange: number
        -pricePercentageChange: number
        -timestamp: number
        -eventType: string
        +toPublishableData(): object
    }
    
    class PriceChangeDetected {
        <<domain event>>
        -symbol: string
        -provider: string
        -percentageChange: number
        -timestamp: number
        -eventType: string
        +toPublishableData(): object
    }

    %% Repository Interfaces
    class IMarketDataRepository {
        <<interface>>
        +addPriceRecord(priceRecord: PriceRecord): Promise~void~
        +addOpenInterestRecord(oiRecord: OpenInterestRecord): Promise~void~
        +getPriceHistory(symbol, provider, fromTimestamp): Promise~PriceRecord[]~
        +getOpenInterestHistory(symbol, provider, fromTimestamp): Promise~OpenInterestRecord[]~
        +cleanupOldData(cutoffTimestamp): Promise~void~
        +getSymbols(): Promise~Symbol[]~
    }
    
    class IEventPublisher {
        <<interface>>
        +publish(event): Promise~void~
    }

    %% Relationships
    OpenInterestAnalyzer --> IMarketDataRepository
    OpenInterestAnalyzer --> IEventPublisher
    OpenInterestAnalyzer --> AnalysisConfig
    OpenInterestAnalyzer --> OpenInterestRecord
    OpenInterestAnalyzer --> OpenInterestThresholdExceeded
    OpenInterestAnalyzer --> PercentageChange
    OpenInterestAnalyzer --> Timestamp
    OpenInterestAnalyzer --> Provider
    
    PriceAnalyzer --> IMarketDataRepository
    PriceAnalyzer --> IEventPublisher
    PriceAnalyzer --> AnalysisConfig
    PriceAnalyzer --> PriceRecord
    PriceAnalyzer --> PriceChangeDetected
    PriceAnalyzer --> PercentageChange
    PriceAnalyzer --> Timestamp
    PriceAnalyzer --> Provider
    
    IMarketDataRepository --> PriceRecord
    IMarketDataRepository --> OpenInterestRecord
    IMarketDataRepository --> Symbol
    
    PriceRecord --> Provider
    OpenInterestRecord --> Provider
    Symbol --> Provider
```

## 3. Архітектура згідно DDD шарів

```mermaid
graph TD
    subgraph "Infrastructure Layer"
        subgraph "Persistence"
            IMMDR[InMemoryMarketDataRepository]
            SR[SymbolsRepository - PostgreSQL]
        end
        
        subgraph "Messaging"
            REP[RedisEventPublisher]
            RS[RedisService]
        end
        
        subgraph "External Services"
            Redis[(Redis)]
            PG[(PostgreSQL)]
        end
    end
    
    subgraph "Domain Layer"
        subgraph "Domain Services"
            OIA[OpenInterestAnalyzer]
            PA[PriceAnalyzer]
        end
        
        subgraph "Entities"
            PR[PriceRecord]
            OIR[OpenInterestRecord] 
            SYM[Symbol]
        end
        
        subgraph "Value Objects"
            PROV[Provider]
            TS[Timestamp]
            PC[PercentageChange]
            AC[AnalysisConfig]
        end
        
        subgraph "Domain Events"
            OITE[OpenInterestThresholdExceeded]
            PCD[PriceChangeDetected]
        end
        
        subgraph "Repository Interfaces"
            IMDR[IMarketDataRepository]
            IEP[IEventPublisher]
        end
    end
    
    subgraph "Application Layer"
        Main[main.js - Application Service]
    end
    
    subgraph "Presentation Layer"
        subgraph "Input"
            RedisMessages[Redis Messages<br/>OI_UPDATE / PRICE_UPDATE]
        end
        
        subgraph "Output"
            Events[Published Events<br/>OI_EVENT / PUMP_EVENT]
            Logs[Console Logs]
        end
    end
    
    %% Dependencies (from top to bottom)
    Main --> OIA
    Main --> PA
    Main --> IMMDR
    Main --> REP
    Main --> SR
    
    OIA --> IMDR
    OIA --> IEP
    PA --> IMDR
    PA --> IEP
    
    IMDR -.-> IMMDR
    IEP -.-> REP
    
    REP --> RS
    SR --> PG
    RS --> Redis
    
    %% Data Flow
    RedisMessages --> Main
    Main --> Events
    Main --> Logs
    
    classDef infrastructure fill:#ffeb3b,color:#000
    classDef domain fill:#4caf50,color:#fff
    classDef application fill:#2196f3,color:#fff
    classDef presentation fill:#ff9800,color:#fff
    
    class IMMDR,SR,REP,RS,Redis,PG infrastructure
    class OIA,PA,PR,OIR,SYM,PROV,TS,PC,AC,OITE,PCD,IMDR,IEP domain
    class Main application
    class RedisMessages,Events,Logs presentation
```

## 4. Потік обробки даних

```mermaid
sequenceDiagram
    participant Redis
    participant Main as main.js
    participant OIA as OpenInterestAnalyzer
    participant PA as PriceAnalyzer
    participant MDR as MarketDataRepository
    participant EP as EventPublisher
    participant RedisOut as Redis (Output)

    %% Initialization
    Note over Main: System Initialization
    Main->>MDR: Initialize repository
    Main->>OIA: Create analyzer with config
    Main->>PA: Create analyzer with config

    %% Data Processing Flow
    Redis->>Main: OI_UPDATE message
    Main->>OIA: addOpenInterestRecord(data)
    OIA->>MDR: addOpenInterestRecord(record)
    
    Redis->>Main: PRICE_UPDATE message  
    Main->>PA: addPriceRecord(data)
    PA->>MDR: addPriceRecord(record)
    
    %% Analysis Flow (every 1 second)
    Note over Main: Timer triggers analysis
    Main->>OIA: analyze()
    OIA->>MDR: getSymbols()
    OIA->>MDR: getOpenInterestHistory()
    OIA->>OIA: Calculate percentage change
    OIA->>OIA: Check thresholds
    OIA->>EP: publish(OpenInterestThresholdExceeded)
    EP->>RedisOut: Publish OI_EVENT
    
    Main->>PA: analyze()
    PA->>MDR: getSymbols()
    PA->>MDR: getPriceHistory()
    PA->>PA: Calculate percentage change
    PA->>PA: Check thresholds
    PA->>EP: publish(PriceChangeDetected)
    EP->>RedisOut: Publish PUMP_EVENT
```

## 5. Основні переваги DDD архітектури

### ✅ Досягнуті цілі:
- **Чіста доменна логіка** - бізнес-правила ізольовані від інфраструктури
- **Dependency Inversion** - домен не залежить від конкретних реалізацій
- **Single Responsibility** - кожен клас має одну відповідальність
- **Testability** - легко тестувати через dependency injection
- **Extensibility** - легко додавати нові провайдери, аналізатори
- **Type Safety** - валідація через Value Objects і Entities
- **Event-Driven** - слабка зв'язність через domain events

### 🔄 Можливі розширення:
- Додати нові типи аналізу (волатильність, об'єм)
- Інтегрувати з іншими провайдерами даних
- Додати персистентне зберігання історії
- Реалізувати складні бізнес-правила
- Додати метрики та моніторинг