# ⛰️ Trail Brew — Gauteng MTB Trail Finder

**Berms, Banter & Beer.**

An interactive trail finder for the Gauteng mountain biking community. Take a quick quiz about your riding preferences and get matched to the best trails.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Database**: Cloud Firestore (with offline persistence)
- **Auth**: Firebase Authentication
- **Hosting**: Firebase Hosting + GitHub Actions CI/CD
- **PWA**: Vite PWA plugin (installable, works offline)

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/SmoothOp95/trail-brew.git
cd trail-brew
npm install
```

### 2. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project called "trail-brew"
3. Enable **Firestore Database** (start in test mode)
4. Enable **Authentication** → Sign-in method → Google
5. Enable **Authentication** → Sign-in method → **Email/Password** (required for the `/join` survey's email fallback — Claude Code can't toggle this, it's a console-only step)
6. While there, check **Authentication → Settings → User account linking** is set to its default ("One account per email address") — this is what makes the "email already linked to Google" error message behave correctly if someone tries both sign-in methods with the same address
7. Go to Project Settings → General → Your apps → Add web app
8. Copy the config values

### 3. Add your Firebase config

Edit `src/lib/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: 'your-actual-api-key',
  authDomain: 'trail-brew.firebaseapp.com',
  projectId: 'trail-brew',
  // ... etc
};
```

### 4. Update .firebaserc

Replace `YOUR_FIREBASE_PROJECT_ID` with your actual project ID.

### 5. Run locally

```bash
npm run dev
```

Opens at `http://localhost:5173`

### 6. Seed trail data & community config (required for `/join` onboarding survey)

The onboarding survey's trail question reads live from the Firestore `trails`
collection rather than the local `src/data/trails.js` file. Populate it once:

```bash
# Firebase Console → Project settings → Service accounts →
# Generate new private key → save as serviceAccountKey.json in the repo root
# (gitignored, never commit it)
npm run seed:trails
```

Safe to re-run after editing `src/data/trails.js` — it upserts by trail `id`.

The success screen also needs a WhatsApp invite link, stored as config (not
code) so it can be rotated without a redeploy. Either create the document by
hand in the Firebase Console → Firestore (`config/community` →
`{ whatsappGeneralInviteUrl: "https://chat.whatsapp.com/..." }`), or use the
same service account key:

```bash
npm run set:community-config -- --whatsapp-url="https://chat.whatsapp.com/..."
```

Re-run either whenever the invite link changes — no redeploy needed.

### 7. Deploy

#### Option A: Manual deploy

```bash
npm install -g firebase-tools
firebase login
npm run build
npm run deploy
```

#### Option B: Auto-deploy via GitHub Actions (recommended)

1. In your Firebase project, create a service account:
   ```bash
   firebase init hosting:github
   ```
   This auto-creates the GitHub secrets for you.

2. Or manually add these secrets to your GitHub repo (Settings → Secrets):
   - `FIREBASE_SERVICE_ACCOUNT` — your service account JSON
   - `FIREBASE_PROJECT_ID` — your project ID

3. Push to `main` → auto-deploys to `trail-brew-33084.web.app` (the default Hosting site — matches the project ID since no custom site is configured in `firebase.json`)
4. Open a PR → gets a preview URL automatically

## Project Structure

```
trail-brew/
├── public/                  # Static assets (favicon, PWA icons)
├── src/
│   ├── components/
│   │   ├── survey/          # Quiz screen components
│   │   │   ├── SurveyScreen.jsx
│   │   │   └── OptionButton.jsx
│   │   ├── results/         # Results screen components
│   │   │   ├── ResultsScreen.jsx
│   │   │   ├── TrailCard.jsx
│   │   │   └── FilterChips.jsx
│   │   └── common/          # Shared components (future)
│   ├── data/
│   │   ├── trails.js        # Trail database (local fallback)
│   │   ├── questions.js     # Survey question config
│   │   └── trailTypes.js    # Color/style mappings
│   ├── hooks/
│   │   └── useTrailScoring.js  # Trail matching algorithm
│   ├── lib/
│   │   └── firebase.js      # Firebase config & init
│   ├── styles/
│   │   └── index.css        # Tailwind + custom styles
│   ├── App.jsx              # Root component
│   └── main.jsx             # Entry point
├── .github/workflows/       # CI/CD pipelines
├── firebase.json            # Firebase hosting config
├── firestore.rules          # Database security rules
├── tailwind.config.js
├── vite.config.js           # Vite + PWA config
└── package.json
```

## Roadmap

- [x] Interactive quiz with trail matching
- [x] PWA support (install to homescreen)
- [x] Offline-first with Firestore persistence
- [ ] Firebase Auth (Google sign-in)
- [ ] User profiles — save ridden trails, notes
- [ ] Admin panel — add/edit trails without code
- [ ] Map view with trail locations
- [x] Calendar view — monthly riding schedule
- [ ] Push notifications for new trails & events
- [ ] Connect to Notion API for trail data sync

## Contributing

Built by Tumi & Tawanda for the SA MTB community.

## License

MIT
