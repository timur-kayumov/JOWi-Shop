# JOWi Shop Mobile POS - Architecture Document

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Pattern](#architecture-pattern)
4. [Project Structure](#project-structure)
5. [Data Layer](#data-layer)
6. [State Management](#state-management)
7. [Offline-First Architecture](#offline-first-architecture)
8. [Hardware Integration](#hardware-integration)
9. [Performance Optimization](#performance-optimization)
10. [Security](#security)
11. [Testing Strategy](#testing-strategy)

---

## Overview

The JOWi Shop Mobile POS is a Flutter-based Android tablet application designed for offline-first point-of-sale operations. The app supports large product catalogs (50,000-200,000 items) while maintaining high performance on budget hardware (Samsung Tab A8, 4GB RAM).

### Key Requirements

- **Platform:** Android 11+ (API 30), tablets 10"+
- **Offline-First:** All POS operations work without internet
- **Performance:** Fast search and rendering for 50k-200k products
- **Hardware:** Bluetooth/USB thermal printers, barcode scanners, fiscal devices
- **Languages:** Russian and Uzbek
- **Sync:** Background synchronization with backend API

---

## Technology Stack

### Core Framework
- **Flutter SDK:** 3.16+
- **Dart:** 3.0+
- **Platform:** Android (iOS out of scope for MVP)

### State Management
- **Riverpod:** flutter_riverpod ^2.4.9
  - Type-safe provider-based state management
  - Code generation via riverpod_generator
  - Family providers for parametrized state
  - AsyncValue for loading/error states

### Local Database
- **Primary:** Isar ^3.1.0 (high-performance NoSQL)
  - 10x faster than sqflite for large datasets
  - Native support for indexes and queries
  - Reactive queries with Stream support
  - Compact binary format
  - Schema versioning and migrations
- **Alternative:** drift (if complex SQL needed)

### HTTP Client
- **dio:** ^5.4.0 (HTTP client)
- **retrofit:** ^4.0.0 (type-safe REST client)
  - Automatic JSON serialization
  - Interceptors for auth tokens
  - Error handling middleware
  - Request/response logging

### Background Tasks
- **WorkManager:** ^0.5.1
  - Reliable background sync
  - Battery-aware scheduling
  - Periodic and one-time tasks
  - Constraints (network, battery, storage)

### UI Components
- **Material Design 3**
- **flutter_form_builder:** Forms with validation
- **gap:** Responsive spacing
- **go_router:** Declarative routing

### Hardware Integration
- **mobile_scanner:** ^3.5.0 (camera barcode)
- **esc_pos_bluetooth:** ^0.4.1 (Bluetooth printers)
- **esc_pos_printer:** ^4.1.0 (network printers)
- **Platform Channels:** Native Kotlin/Java for fiscal devices

### Utilities
- **easy_localization:** ^3.0.3 (i18n RU/UZ)
- **connectivity_plus:** Network state monitoring
- **permission_handler:** Runtime permissions
- **logger:** Structured logging

---

## Architecture Pattern

### Clean Architecture + Feature-First Structure

```
lib/
├── main.dart                 # App entry point
├── app.dart                  # MaterialApp configuration
├── core/                     # Core infrastructure
│   ├── api/                  # HTTP client setup
│   ├── database/             # Isar database setup
│   ├── models/               # Shared data models
│   ├── router/               # Navigation configuration
│   ├── services/             # Cross-feature services
│   └── utils/                # Utilities & constants
├── features/                 # Feature modules
│   └── {feature_name}/
│       ├── data/             # Data layer
│       │   ├── models/       # DTOs & Isar schemas
│       │   ├── repositories/ # Repository implementations
│       │   └── datasources/  # Remote & local data sources
│       ├── domain/           # Business logic (optional)
│       │   ├── entities/     # Domain models
│       │   └── usecases/     # Business rules
│       └── presentation/     # UI layer
│           ├── screens/      # Full-screen pages
│           ├── widgets/      # Feature-specific widgets
│           └── providers/    # Riverpod providers
├── shared/                   # Shared UI components
│   ├── themes/               # Material 3 themes
│   └── widgets/              # Reusable widgets
└── l10n/                     # Translations
```

### Layers

**1. Data Layer**
- **Remote Data Source:** REST API via Retrofit
- **Local Data Source:** Isar database
- **Repository:** Abstracts data source selection (remote vs local)
- **Models:** Freezed data classes with JSON serialization

**2. Domain Layer (Optional for Simple Features)**
- **Entities:** Core business objects
- **Use Cases:** Encapsulate business logic
- **Repository Interfaces:** Abstract contracts

**3. Presentation Layer**
- **Providers:** Riverpod state holders
- **Screens:** Stateless widgets consuming providers
- **Widgets:** Reusable UI components

---

## Project Structure

### Feature Example: POS

```
features/pos/
├── data/
│   ├── models/
│   │   ├── receipt.dart           # Receipt data model
│   │   ├── receipt.g.dart         # Isar generated code
│   │   └── receipt.freezed.dart   # Freezed generated code
│   ├── repositories/
│   │   └── receipt_repository.dart
│   └── datasources/
│       ├── receipt_remote_ds.dart
│       └── receipt_local_ds.dart
├── presentation/
│   ├── screens/
│   │   ├── pos_screen.dart        # Main POS UI
│   │   ├── payment_screen.dart
│   │   └── receipt_list_screen.dart
│   ├── widgets/
│   │   ├── receipt_items_list.dart
│   │   ├── payment_buttons.dart
│   │   └── product_search.dart
│   └── providers/
│       ├── current_receipt_provider.dart
│       ├── receipts_provider.dart
│       └── pos_state_provider.dart
└── README.md                      # Feature documentation
```

### Core Modules

**core/api/**
- `api_client.dart` - Dio instance with interceptors
- `endpoints.dart` - API endpoint constants
- `api_exception.dart` - Custom exceptions

**core/database/**
- `isar_service.dart` - Isar instance singleton
- `migration.dart` - Schema migrations

**core/services/**
- `sync_service.dart` - Background synchronization
- `auth_service.dart` - Authentication & token refresh
- `printer_service.dart` - Thermal printer abstraction
- `fiscal_service.dart` - Fiscal device integration

**core/router/**
- `app_router.dart` - GoRouter configuration
- `route_guards.dart` - Auth guards

---

## Data Layer

### Isar Database Schema

**Collections (Tables):**

```dart
@collection
class Product {
  Id id = Isar.autoIncrement;

  @Index(type: IndexType.hash)
  late String barcode;

  @Index(type: IndexType.value, caseSensitive: false)
  late String name;

  late String? description;
  late double price;
  late double? costPrice;
  late int stockQuantity;
  late String? category;
  late String? image;
  late String tenantId;
  late DateTime updatedAt;

  bool get isLowStock => stockQuantity < 10;
}

@collection
class Receipt {
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  late String uuid;  // For sync idempotency

  late String tenantId;
  late String storeId;
  late String terminalId;
  late String? employeeId;
  late String? customerId;

  late double totalAmount;
  late double discountAmount;
  late double taxAmount;

  late String paymentMethod;  // cash, card, transfer
  late String status;  // draft, completed, refunded

  late DateTime createdAt;
  late DateTime? completedAt;

  late bool syncedToServer;

  @Backlink(to: 'receipt')
  final items = IsarLinks<ReceiptItem>();
}

@collection
class ReceiptItem {
  Id id = Isar.autoIncrement;

  late String productId;
  late String productName;
  late double price;
  late int quantity;
  late double discountPercent;
  late double subtotal;

  final receipt = IsarLink<Receipt>();
}

@collection
class SyncOutbox {
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  late String operationId;  // UUID

  late String entityType;  // "receipt", "product", etc.
  late String action;  // "create", "update", "delete"
  late String payload;  // JSON string
  late int retryCount;
  late String status;  // "pending", "syncing", "synced", "failed"
  late DateTime createdAt;
  late DateTime? syncedAt;
}
```

### Repository Pattern

```dart
abstract class ReceiptRepository {
  Future<Receipt> createReceipt(Receipt receipt);
  Future<List<Receipt>> getReceipts({int limit = 50, int offset = 0});
  Future<Receipt?> getReceiptById(String id);
  Future<void> syncReceipts();
}

class ReceiptRepositoryImpl implements ReceiptRepository {
  final ReceiptLocalDataSource localDs;
  final ReceiptRemoteDataSource remoteDs;
  final ConnectivityService connectivity;

  @override
  Future<Receipt> createReceipt(Receipt receipt) async {
    // Always save locally first
    final saved = await localDs.saveReceipt(receipt);

    // Queue for sync
    await localDs.addToOutbox(
      operationId: receipt.uuid,
      entityType: 'receipt',
      action: 'create',
      payload: jsonEncode(receipt.toJson()),
    );

    // Try to sync immediately if online
    if (await connectivity.isConnected) {
      try {
        await syncReceipts();
      } catch (e) {
        // Sync failed, will retry later
        logger.warning('Immediate sync failed, queued for background sync');
      }
    }

    return saved;
  }

  @override
  Future<void> syncReceipts() async {
    final pending = await localDs.getPendingOutbox();

    for (final item in pending) {
      try {
        await remoteDs.sendReceiptToServer(item.payload);
        await localDs.markAsSynced(item.operationId);
      } catch (e) {
        await localDs.incrementRetryCount(item.operationId);
      }
    }
  }
}
```

---

## State Management

### Riverpod Providers

**Provider Types:**

1. **Provider** - Immutable global state
2. **StateProvider** - Simple mutable state
3. **StateNotifierProvider** - Complex state with mutations
4. **FutureProvider** - Async data loading
5. **StreamProvider** - Real-time data streams

**Example: POS Receipt State**

```dart
// State class
@freezed
class PosState with _$PosState {
  const factory PosState({
    @Default([]) List<ReceiptItem> items,
    Customer? customer,
    @Default(0.0) double discountPercent,
    @Default('cash') String paymentMethod,
    @Default(false) bool isProcessing,
  }) = _PosState;

  const PosState._();

  double get subtotal => items.fold(0.0, (sum, item) => sum + item.subtotal);
  double get discountAmount => subtotal * (discountPercent / 100);
  double get total => subtotal - discountAmount;
}

// Notifier
@riverpod
class PosNotifier extends _$PosNotifier {
  @override
  PosState build() => const PosState();

  void addProduct(Product product, {int quantity = 1}) {
    final item = ReceiptItem(
      productId: product.id.toString(),
      productName: product.name,
      price: product.price,
      quantity: quantity,
      discountPercent: 0,
      subtotal: product.price * quantity,
    );

    state = state.copyWith(
      items: [...state.items, item],
    );
  }

  void removeItem(int index) {
    final items = List<ReceiptItem>.from(state.items);
    items.removeAt(index);
    state = state.copyWith(items: items);
  }

  void applyDiscount(double percent) {
    state = state.copyWith(discountPercent: percent);
  }

  Future<Receipt> completeReceipt() async {
    state = state.copyWith(isProcessing: true);

    try {
      final receipt = Receipt()
        ..uuid = const Uuid().v4()
        ..tenantId = await getTenantId()
        ..totalAmount = state.total
        ..discountAmount = state.discountAmount
        ..paymentMethod = state.paymentMethod
        ..createdAt = DateTime.now();

      await ref.read(receiptRepositoryProvider).createReceipt(receipt);

      // Clear state
      state = const PosState();

      return receipt;
    } finally {
      state = state.copyWith(isProcessing: false);
    }
  }
}

// UI consumption
class PosScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(posNotifierProvider);
    final notifier = ref.read(posNotifierProvider.notifier);

    return Scaffold(
      body: Column(
        children: [
          ReceiptItemsList(items: state.items),
          TotalDisplay(total: state.total),
          PaymentButtons(
            onComplete: () => notifier.completeReceipt(),
          ),
        ],
      ),
    );
  }
}
```

---

## Offline-First Architecture

### Synchronization Strategy

**Outbox/Inbox Pattern:**

```
┌─────────────────┐          ┌──────────────────┐
│  Flutter App    │          │   Backend API    │
│                 │          │                  │
│  ┌───────────┐  │          │                  │
│  │ UI Layer  │  │          │                  │
│  └─────┬─────┘  │          │                  │
│        │        │          │                  │
│  ┌─────▼─────┐  │          │                  │
│  │Repository │  │          │                  │
│  └─────┬─────┘  │          │                  │
│        │        │          │                  │
│  ┌─────▼─────┐  │  HTTP    │  ┌────────────┐ │
│  │  Outbox   │──┼─────────►│  │  Sync API  │ │
│  │  Queue    │  │  POST    │  └────────────┘ │
│  └───────────┘  │          │                  │
│                 │          │                  │
│  ┌───────────┐  │  HTTP    │  ┌────────────┐ │
│  │  Inbox    │◄─┼──────────┤  │ Changes    │ │
│  │  Queue    │  │  GET     │  │ Endpoint   │ │
│  └─────┬─────┘  │          │  └────────────┘ │
│        │        │          │                  │
│  ┌─────▼─────┐  │          │                  │
│  │Isar Local │  │          │                  │
│  │ Database  │  │          │                  │
│  └───────────┘  │          │                  │
└─────────────────┘          └──────────────────┘
```

**Sync Flow:**

1. **Local Change:**
   - User creates receipt
   - Save to Isar immediately
   - Add to Outbox with UUID

2. **Background Sync (WorkManager):**
   - Runs every 15 minutes when online
   - Fetch pending outbox items
   - Send to server via HTTP POST
   - Mark as synced on success
   - Retry with exponential backoff on failure

3. **Pull Server Changes:**
   - Fetch latest `updated_at` timestamp
   - GET /api/sync/changes?since={timestamp}
   - Apply changes to local Isar
   - Update local timestamp

4. **Conflict Resolution:**
   - **Receipts:** Server always wins (immutable after creation)
   - **Products:** Last-write-wins (timestamp comparison)
   - **Stock:** Server reconciles based on movement documents

### Background Sync Implementation

```dart
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    await Isar.getInstance()!.writeTxn(() async {
      final syncService = SyncService();
      await syncService.syncPendingChanges();
      await syncService.pullServerChanges();
    });
    return Future.value(true);
  });
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  Workmanager().initialize(
    callbackDispatcher,
    isInDebugMode: kDebugMode,
  );

  Workmanager().registerPeriodicTask(
    "sync-task",
    "syncWithServer",
    frequency: Duration(minutes: 15),
    constraints: Constraints(
      networkType: NetworkType.connected,
    ),
  );

  runApp(MyApp());
}
```

---

## Hardware Integration

### Thermal Printer

**Bluetooth Printer:**

```dart
class ThermalPrinterService {
  final _printer = PrinterBluetoothManager();

  Future<void> printReceipt(Receipt receipt) async {
    final devices = await _printer.scan();
    final device = devices.firstWhere(
      (d) => d.name == 'PRINTER-BT',
      orElse: () => throw PrinterNotFoundException(),
    );

    await _printer.connect(device);

    final generator = Generator(PaperSize.mm80);
    final bytes = <int>[];

    // Header
    bytes += generator.text('JOWi Shop', styles: PosStyles(
      align: PosAlign.center,
      height: PosTextSize.size2,
      width: PosTextSize.size2,
    ));

    bytes += generator.text('Check #${receipt.id}');
    bytes += generator.hr();

    // Items
    for (final item in receipt.items) {
      bytes += generator.row([
        PosColumn(text: item.productName, width: 7),
        PosColumn(text: item.quantity.toString(), width: 2),
        PosColumn(text: formatCurrency(item.subtotal), width: 3, align: PosAlign.right),
      ]);
    }

    bytes += generator.hr();
    bytes += generator.text('TOTAL: ${formatCurrency(receipt.totalAmount)}', styles: PosStyles(bold: true));

    // QR Code (fiscal)
    bytes += generator.qrcode('fiscal-code-here');

    bytes += generator.feed(2);
    bytes += generator.cut();

    await _printer.writeBytes(bytes);
    await _printer.disconnect();
  }
}
```

### Barcode Scanner

**USB Scanner (Keyboard Wedge):**

```dart
class BarcodeInputController extends StatefulWidget {
  @override
  _BarcodeInputControllerState createState() => _BarcodeInputControllerState();
}

class _BarcodeInputControllerState extends State<BarcodeInputController> {
  final _barcodeController = TextEditingController();
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _barcodeController.addListener(_onBarcodeScanned);

    // Keep focus on hidden field
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  void _onBarcodeScanned() {
    final barcode = _barcodeController.text;

    if (barcode.endsWith('\n')) {
      // Scanner pressed Enter
      final cleanBarcode = barcode.trim();

      // Look up product and add to receipt
      ref.read(posNotifierProvider.notifier).addProductByBarcode(cleanBarcode);

      // Clear for next scan
      _barcodeController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Offstage(
      child: TextField(
        controller: _barcodeController,
        focusNode: _focusNode,
        autofocus: true,
      ),
    );
  }
}
```

### Fiscal Device (Platform Channel)

```dart
// lib/core/services/fiscal_service.dart
class FiscalService {
  static const platform = MethodChannel('com.jowi.pos/fiscal');

  Future<FiscalReceipt> registerSale(Receipt receipt) async {
    try {
      final result = await platform.invokeMethod('registerSale', {
        'items': receipt.items.map((e) => e.toJson()).toList(),
        'total': receipt.totalAmount,
        'payment': receipt.paymentMethod,
      });

      return FiscalReceipt.fromJson(result);
    } on PlatformException catch (e) {
      throw FiscalException('Failed to register sale: ${e.message}');
    }
  }
}

// android/app/src/main/kotlin/com/jowi/pos/MainActivity.kt
class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.jowi.pos/fiscal"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler {
            call, result ->
            when (call.method) {
                "registerSale" -> {
                    val fiscalSDK = FiscalSDK()
                    val receipt = fiscalSDK.registerSale(call.arguments as Map<String, Any>)
                    result.success(receipt)
                }
                else -> result.notImplemented()
            }
        }
    }
}
```

---

## Performance Optimization

### For Large Catalogs (50k-200k Products)

**1. Database Indexing**

```dart
@collection
class Product {
  Id id = Isar.autoIncrement;

  @Index(type: IndexType.hash)  // Fast exact match
  late String barcode;

  @Index(type: IndexType.value, caseSensitive: false)  // Fast range queries
  late String name;

  @Index()
  late String category;
}
```

**2. Lazy Loading & Pagination**

```dart
@riverpod
class ProductsNotifier extends _$ProductsNotifier {
  static const _pageSize = 50;

  @override
  Future<List<Product>> build({String? searchQuery}) async {
    return _loadProducts(offset: 0, limit: _pageSize, query: searchQuery);
  }

  Future<void> loadMore() async {
    final current = state.value ?? [];
    final more = await _loadProducts(
      offset: current.length,
      limit: _pageSize,
    );

    state = AsyncValue.data([...current, ...more]);
  }

  Future<List<Product>> _loadProducts({
    required int offset,
    required int limit,
    String? query,
  }) async {
    final isar = Isar.getInstance()!;

    if (query != null && query.isNotEmpty) {
      return await isar.products
        .filter()
        .nameContains(query, caseSensitive: false)
        .offset(offset)
        .limit(limit)
        .findAll();
    }

    return await isar.products
      .where()
      .offset(offset)
      .limit(limit)
      .findAll();
  }
}
```

**3. Virtualization (ListView.builder)**

```dart
ListView.builder(
  itemCount: products.length + 1,  // +1 for loading indicator
  itemBuilder: (context, index) {
    if (index == products.length) {
      // Load more when scrolled to bottom
      ref.read(productsNotifierProvider.notifier).loadMore();
      return const CircularProgressIndicator();
    }

    return ProductListTile(product: products[index]);
  },
)
```

**4. Debounced Search**

```dart
class ProductSearchField extends ConsumerStatefulWidget {
  @override
  _ProductSearchFieldState createState() => _ProductSearchFieldState();
}

class _ProductSearchFieldState extends ConsumerState<ProductSearchField> {
  final _debouncer = Debouncer(milliseconds: 300);
  final _controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      onChanged: (query) {
        _debouncer.run(() {
          ref.read(productsNotifierProvider(searchQuery: query));
        });
      },
    );
  }
}

class Debouncer {
  final int milliseconds;
  Timer? _timer;

  Debouncer({required this.milliseconds});

  void run(VoidCallback action) {
    _timer?.cancel();
    _timer = Timer(Duration(milliseconds: milliseconds), action);
  }
}
```

**5. In-Memory Cache**

```dart
class ProductCache {
  static final Map<String, Product> _cache = {};
  static const _maxSize = 100;

  static Product? get(String barcode) => _cache[barcode];

  static void put(Product product) {
    if (_cache.length >= _maxSize) {
      _cache.remove(_cache.keys.first);
    }
    _cache[product.barcode] = product;
  }
}
```

---

## Security

### Authentication

**JWT Token Management:**

```dart
class AuthService {
  final _storage = FlutterSecureStorage();

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  Future<void> clearToken() async {
    await _storage.delete(key: 'auth_token');
  }
}

// Dio interceptor
class AuthInterceptor extends Interceptor {
  final AuthService authService;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await authService.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired, refresh or logout
      await authService.clearToken();
      // Navigate to login
    }
    handler.next(err);
  }
}
```

### Data Encryption

- **Secure Storage:** flutter_secure_storage for tokens
- **Database Encryption:** Isar supports encryption (optional)
- **HTTPS Only:** All API calls use TLS 1.2+

---

## Testing Strategy

### Unit Tests

```dart
void main() {
  group('PosNotifier', () {
    late PosNotifier notifier;

    setUp(() {
      notifier = PosNotifier();
    });

    test('should add product to receipt', () {
      final product = Product()
        ..name = 'Test Product'
        ..price = 100.0;

      notifier.addProduct(product);

      expect(notifier.state.items.length, 1);
      expect(notifier.state.total, 100.0);
    });

    test('should calculate discount correctly', () {
      final product = Product()
        ..name = 'Test Product'
        ..price = 100.0;

      notifier.addProduct(product);
      notifier.applyDiscount(10);

      expect(notifier.state.discountAmount, 10.0);
      expect(notifier.state.total, 90.0);
    });
  });
}
```

### Widget Tests

```dart
void main() {
  testWidgets('POS screen displays items', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(home: PosScreen()),
      ),
    );

    expect(find.text('Total: 0.00'), findsOneWidget);

    // Add product via provider
    final container = ProviderScope.containerOf(
      tester.element(find.byType(PosScreen)),
    );

    container.read(posNotifierProvider.notifier).addProduct(testProduct);

    await tester.pump();

    expect(find.text('Test Product'), findsOneWidget);
  });
}
```

### Integration Tests

```dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('complete receipt flow', (WidgetTester tester) async {
    await tester.pumpWidget(MyApp());

    // Navigate to POS
    await tester.tap(find.text('POS'));
    await tester.pumpAndSettle();

    // Search for product
    await tester.enterText(find.byType(TextField), 'milk');
    await tester.pumpAndSettle();

    // Add to receipt
    await tester.tap(find.text('Add'));
    await tester.pumpAndSettle();

    // Complete payment
    await tester.tap(find.text('Complete'));
    await tester.pumpAndSettle();

    expect(find.text('Receipt completed'), findsOneWidget);
  });
}
```

---

## Summary

This architecture provides:

✅ **Offline-first** with Isar + Outbox/Inbox sync
✅ **High performance** for 50k-200k products via indexing, pagination, virtualization
✅ **Clean separation** of concerns via feature-first structure
✅ **Type-safe state** management with Riverpod + Freezed
✅ **Hardware integration** via platform channels and packages
✅ **Background sync** with WorkManager
✅ **Testable** code with unit, widget, and integration tests

For questions or clarifications, see the main README or contact the development team.
