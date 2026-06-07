# Alan Mens Wear

React + Vite menswear shop with Firebase Authentication and product CRUD using Firestore and Firebase Storage.

## Product CRUD Folder Structure

```text
src/
  admin/
    AdminDashboard.jsx        # Admin add/view/update/delete product UI
  components/
    Footer.jsx
    Navbar.jsx
  context/
    AuthContext.jsx
    authContext.js
    useAuth.js
  pages/
    Home.jsx                  # Featured products from Firestore
    Products.jsx              # Product listing from Firestore
    ProductDetails.jsx        # Single product from Firestore
    Cart.jsx
    Login.jsx
    Register.jsx
    ForgotPassword.jsx
  services/
    productService.js         # Firestore + Storage CRUD helpers
  firebase.js                 # Firebase app, auth, db, storage exports
```

## Firebase Product Data

Products are stored in the Firestore `products` collection.

Each product document stores:

```js
{
  name: 'Oxford Tailored Shirt',
  category: 'Shirts',
  price: 2499,
  stock: 18,
  rating: 4.8,
  sizes: ['S', 'M', 'L', 'XL'],
  description: 'Product description',
  image: 'https://firebasestorage.googleapis.com/...',
  imagePath: 'products/...',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

Product images are uploaded to Firebase Storage in the `products/` folder. When an admin replaces or deletes a product image, the old Storage object is removed when `imagePath` exists.

## Environment Variables

Create `.env` from `.env.example` and add your Firebase web app config:

```text
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

## Firebase Storage Setup

Product image uploads need both Storage rules and browser CORS on the bucket.

Deploy the included Storage rules:

```bash
npx firebase deploy --only storage
```

Apply the local development CORS config to your bucket:

```bash
gsutil cors set cors.json gs://alan-mens-wear.firebasestorage.app
```

The rules allow public reads for product images, but uploads/deletes require a
signed-in Firebase Auth user.

## Run

```bash
npm install
npm run dev
```

Open `/admin` to manage products.
