# Alan Mens Wear - Data Flow Diagram

This document describes the Data Flow Diagram (DFD) for the Alan Mens Wear React and Firebase ecommerce project.

## System Scope

Alan Mens Wear is an online menswear store where customers can register, browse products, maintain a cart, pay through UPI, upload payment proof, place orders, track order status, download invoices, and submit reviews. Admin users manage products, orders, reviews, customers, and reports.

## DFD Notation

| Symbol Type | Meaning |
| --- | --- |
| External Entity | A person or external service that sends data to, or receives data from, the system |
| Process | A system activity that transforms input data into output data |
| Data Store | Persistent storage used by the system |
| Data Flow | Movement of data between entities, processes, and stores |

## External Entities

| Entity | Description |
| --- | --- |
| Customer | User who browses products, manages cart, places orders, edits profile, and submits reviews |
| Admin | Privileged user who manages products, customers, orders, reviews, and exports reports |
| Firebase Authentication | External authentication service used for signup, login, logout, and account deletion |
| UPI Payment App | External payment application used by the customer to complete payment |
| Browser File System | Customer/admin device file system used for image upload, invoice download, and report download |

## Data Stores

| Store | Firebase Path / Location | Main Data |
| --- | --- | --- |
| D1 Users | `users/{uid}` | Customer/admin profile, role, contact details, user code |
| D2 Products | `products/{productId}` | Product details, prices, images, size inventory, stock |
| D3 Cart Items | `carts/{userId}/items/{cartItemId}` | User cart items, selected size, quantity, item price |
| D4 Orders | `orders/{orderId}` | Order items, customer details, total, payment proof, order status |
| D5 Reviews | `reviews/{reviewId}` | Product reviews, ratings, customer and order references |
| D6 Counters | `counters/{counterName}` | Running counters for user and product codes |
| D7 Firebase Storage | `profile-photos/...` | Profile photos in production when upload succeeds |
| D8 Generated Files | Browser downloads | Invoices, PDF reports, Excel reports |

## Level 0 - Context Diagram

```mermaid
flowchart LR
    customer[Customer]
    admin[Admin]
    auth[Firebase Authentication]
    upi[UPI Payment App]
    files[Browser File System]

    system((Alan Mens Wear Ecommerce System))

    customer -->|Signup, login, profile, product search, cart, payment proof, orders, reviews| system
    system -->|Product listings, cart summary, invoices, order status, review status| customer

    admin -->|Admin login, product updates, order status updates, review/customer actions, export requests| system
    system -->|Dashboard data, order lists, customer lists, reports| admin

    system -->|Create user, sign in, sign out, delete customer account| auth
    auth -->|Auth state, user id, auth errors| system

    customer -->|UPI payment using generated QR/payment URL| upi
    upi -->|Payment confirmation screenshot produced by user| customer

    customer -->|Upload profile/payment/product images| files
    admin -->|Upload product images, download reports| files
    system -->|Generated invoice/report files| files
```

## Level 1 - Main System DFD

```mermaid
flowchart TB
    customer[Customer]
    admin[Admin]
    auth[Firebase Authentication]
    upi[UPI Payment App]
    files[Browser File System]

    p1((1.0 Manage Authentication and Profiles))
    p2((2.0 Manage Product Catalog))
    p3((3.0 Manage Cart))
    p4((4.0 Process Checkout and Orders))
    p5((5.0 Manage Reviews))
    p6((6.0 Admin Management and Reporting))

    d1[(D1 Users)]
    d2[(D2 Products)]
    d3[(D3 Cart Items)]
    d4[(D4 Orders)]
    d5[(D5 Reviews)]
    d6[(D6 Counters)]
    d7[(D7 Firebase Storage)]
    d8[(D8 Generated Files)]

    customer -->|Registration, login, profile edits, photo| p1
    admin -->|Admin login| p1
    p1 -->|Auth request| auth
    auth -->|Auth result and user id| p1
    p1 <-->|Profile read/write| d1
    p1 -->|User code request| d6
    p1 -->|Profile photo upload| d7
    p1 -->|Session/profile result| customer
    p1 -->|Admin access result| admin

    customer -->|Search/filter/view products| p2
    admin -->|Create/update/delete product, image upload| p2
    p2 <-->|Product catalog and inventory| d2
    p2 -->|Product code request| d6
    p2 -->|Product image data| d2
    p2 -->|Product list/details| customer
    p2 -->|Catalog management result| admin

    customer -->|Add item, update quantity, remove item| p3
    p3 -->|Read latest product stock/price| d2
    p3 <-->|Persist cart items| d3
    p3 -->|Cart summary and validation messages| customer

    customer -->|Checkout request, payment screenshot| p4
    p4 -->|Generate UPI QR/payment URL| customer
    customer -->|Complete payment| upi
    p4 -->|Read cart items| d3
    p4 -->|Validate and decrement stock| d2
    p4 -->|Create order with payment proof| d4
    p4 -->|Clear purchased cart items| d3
    p4 -->|Generate invoice PDF| d8
    p4 -->|Order confirmation and invoice| customer

    customer -->|View orders and submit product review| p5
    p5 -->|Read delivered orders| d4
    p5 <-->|Create/read/delete reviews| d5
    p5 -->|Review list/status| customer
    p5 -->|Latest/product reviews| p2

    admin -->|Manage orders, users, reviews, reports| p6
    p6 -->|Read users and roles| d1
    p6 -->|Read/update orders and statuses| d4
    p6 -->|Read/delete reviews| d5
    p6 -->|Delete customer account request| auth
    p6 -->|Delete customer profile/cart data| d1
    p6 -->|Delete customer cart data| d3
    p6 -->|Export PDF/Excel reports| d8
    p6 -->|Dashboard, exports, action results| admin
```

## Level 2 - Authentication and Profile Management

```mermaid
flowchart LR
    customer[Customer]
    admin[Admin]
    auth[Firebase Authentication]
    files[Browser File System]

    p11((1.1 Register Customer))
    p12((1.2 Login User))
    p13((1.3 Observe Auth State))
    p14((1.4 Update Profile))
    p15((1.5 Logout))

    d1[(D1 Users)]
    d6[(D6 Counters)]
    d7[(D7 Firebase Storage)]

    customer -->|Name, email, phone, password| p11
    p11 -->|Create account| auth
    p11 -->|Get next user code| d6
    p11 -->|Create customer profile| d1
    p11 -->|Registration result| customer

    customer -->|Email, password, remember-me choice| p12
    admin -->|Admin email and password| p12
    p12 -->|Sign-in request| auth
    auth -->|Auth result| p12
    p12 -->|Read role/profile| d1
    p12 -->|Redirect or access error| customer
    p12 -->|Admin access result| admin

    auth -->|Auth state changes| p13
    p13 -->|Subscribe to user profile| d1
    p13 -->|Current user and role| customer
    p13 -->|Admin route authorization| admin

    customer -->|Name, phone, address, profile photo| p14
    files -->|Selected profile photo| p14
    p14 -->|Upload profile photo when available| d7
    p14 -->|Merge profile details| d1
    p14 -->|Update display name/photo URL| auth
    p14 -->|Updated profile| customer

    customer -->|Logout request| p15
    p15 -->|Sign out| auth
    p15 -->|Logout result| customer
```

## Level 2 - Product, Cart, and Checkout

```mermaid
flowchart TB
    customer[Customer]
    admin[Admin]
    upi[UPI Payment App]
    files[Browser File System]

    p21((2.1 Browse Product Catalog))
    p22((2.2 Maintain Product Catalog))
    p31((3.1 Add or Update Cart))
    p32((3.2 Sync Cart With Inventory))
    p41((4.1 Generate UPI Payment Details))
    p42((4.2 Upload Payment Proof))
    p43((4.3 Place Order Transaction))
    p44((4.4 Generate Invoice))

    d2[(D2 Products)]
    d3[(D3 Cart Items)]
    d4[(D4 Orders)]
    d6[(D6 Counters)]
    d8[(D8 Generated Files)]

    customer -->|Search/filter/product detail request| p21
    p21 -->|Read catalog and reviews summary| d2
    p21 -->|Product list/details, stock, price| customer

    admin -->|Product details, size inventory, prices, image| p22
    p22 -->|Get next product code| d6
    p22 <-->|Create/update/delete products| d2
    p22 -->|Catalog action result| admin

    customer -->|Product id, size, quantity| p31
    p31 -->|Check stock and price| d2
    p31 <-->|Save/remove cart item| d3
    p31 -->|Updated cart summary| customer

    customer -->|Open cart| p32
    p32 -->|Read current products| d2
    p32 <-->|Refresh cart quantities/prices, remove invalid items| d3
    p32 -->|Synced cart| customer

    customer -->|Checkout cart total| p41
    p41 -->|UPI QR/payment URL| customer
    customer -->|Payment action| upi

    customer -->|Payment screenshot file| p42
    files -->|Selected screenshot| p42
    p42 -->|Compressed screenshot data URL and path| p43

    customer -->|Place order| p43
    p43 -->|Read cart items| d3
    p43 -->|Read and validate product stock| d2
    p43 -->|Decrement product stock| d2
    p43 -->|Create pending order with UPI proof| d4
    p43 -->|Clear cart items| d3
    p43 -->|Order confirmation| customer

    p43 -->|Order data| p44
    p44 -->|Invoice PDF| d8
    p44 -->|Download invoice| customer
```

## Level 2 - Order Tracking, Reviews, and Admin Management

```mermaid
flowchart TB
    customer[Customer]
    admin[Admin]
    auth[Firebase Authentication]

    p51((5.1 Track Customer Orders))
    p52((5.2 Submit Product Review))
    p61((6.1 Monitor Dashboard))
    p62((6.2 Manage Orders))
    p63((6.3 Manage Reviews))
    p64((6.4 Manage Customers))
    p65((6.5 Export Reports))

    d1[(D1 Users)]
    d3[(D3 Cart Items)]
    d4[(D4 Orders)]
    d5[(D5 Reviews)]
    d8[(D8 Generated Files)]

    customer -->|My orders request| p51
    p51 -->|Subscribe to user orders| d4
    p51 -->|Status timeline, order details, invoice option| customer

    customer -->|Rating and review for delivered item| p52
    p52 -->|Verify delivered order| d4
    p52 -->|Save review| d5
    p52 -->|Review submitted status| customer

    admin -->|Open dashboard| p61
    p61 -->|Read users| d1
    p61 -->|Read orders| d4
    p61 -->|Read reviews| d5
    p61 -->|Summary metrics| admin

    admin -->|Status update, payment screenshot view| p62
    p62 <-->|Read/update order status| d4
    p62 -->|Order action result| admin

    admin -->|Search/filter/delete review| p63
    p63 <-->|Read/delete review| d5
    p63 -->|Review action result| admin

    admin -->|Delete customer account| p64
    p64 -->|Check admin role and customer role| d1
    p64 -->|Delete auth user| auth
    p64 -->|Delete customer profile| d1
    p64 -->|Delete customer cart| d3
    p64 -->|Customer deletion result| admin

    admin -->|Export order report request| p65
    p65 -->|Read filtered orders| d4
    p65 -->|Generate PDF/Excel| d8
    p65 -->|Downloaded report| admin
```

## Major Data Flows

| Flow | Source | Destination | Data |
| --- | --- | --- | --- |
| Registration data | Customer | Authentication/Profile process | Name, email, phone, password |
| Auth result | Firebase Authentication | Application | User id, email, session state, auth errors |
| Profile data | Application | Users store | Name, phone, address, role, photo URL, user code |
| Product data | Admin | Products store | Name, category, price, size inventory, image, description |
| Product browsing data | Products store | Customer | Product listing, stock, ratings, prices |
| Cart data | Customer | Cart store | Product id, selected size, quantity, calculated price |
| Payment details | Application | Customer | UPI QR code, UPI id, total amount |
| Payment proof | Customer | Orders store | Screenshot data URL/path, payment method, verification status |
| Order transaction | Application | Products and Orders stores | Stock decrement, order items, total amount, pending status |
| Order status | Admin | Orders store | Pending, Processing, Shipped, Delivered |
| Review data | Customer | Reviews store | Rating, review text, product id, order id |
| Report data | Orders store | Browser file system | Excel/PDF order report |
| Invoice data | Orders store | Browser file system | Customer invoice PDF |

## Important Processing Rules

1. Customers must be authenticated before placing orders, viewing personal orders, editing profiles, or submitting reviews.
2. Admin routes require a signed-in user whose `users/{uid}.role` is `admin`.
3. Cart quantities are validated against latest product stock before saving and again before order creation.
4. Checkout uses a Firestore transaction to verify product availability, update product inventory, and create the order.
5. Payment is performed outside the system through UPI; the system stores the uploaded payment screenshot as proof.
6. Reviews are allowed only for delivered orders and are stored separately from orders.
7. Customer deletion is handled through a Firebase Cloud Function that checks admin permission, deletes the Firebase Auth user, and removes the customer profile/cart data.
8. Invoices and reports are generated client-side as downloadable PDF/Excel files.

