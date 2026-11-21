# TraceOn – Check before you pay

React (Vite) version of the TraceOn single-file page.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in /dist
```

## Structure

```
src/
  main.jsx, App.jsx          entry, providers, routes (/, /login, /signup)
  styles/global.css          all styles (unchanged from the original page)
  data/seed.js               demo accounts + reports
  lib/                       pure logic: format, analyze (scoring rules), motion, storage
  context/                   AuthContext, ToastContext
  pages/                     HomePage, AuthPage, NotFoundPage
  hooks/                     useDb, useSellerCheck, useTheme, useReveal, useTileGlow
  components/
    common/                  Logo, Reveal
    background/              Aurora, ConstellationBg (canvas)
    layout/                  Navbar, Footer, Toast, ScrollToHash
    auth/                    LoginForm, SignupForm, AuthAside, Field, PasswordField, PasswordStrength
    hero/                    Hero, SearchBar, DemoChips, Stage, Shield
    result/                  ResultCard, TraceMap
    marquee/                 Marquee
    how/                     HowItWorks, WebTile, SpiderWeb (+ drawWeb, drawDetail), ScoreRulesTile, VerifiedTile, StatsTile
    reports/                 ReportsLedger
    sellers/                 VerifiedSellers
    report/                  ReportSection (form)
    cta/                     CallToAction
```

## Login / sign-up (demo)

`src/lib/auth.js` is a **front-end-only demo**: accounts are kept in this browser's localStorage
(passwords as salted SHA-256 hashes). It is not real security. Before launch, replace `signUp`,
`logIn` and `logOut` there with calls to a real backend or auth provider; the forms and context
don't need to change.

## Deploying

Routes use the browser history API, so configure your host to serve `index.html` for unknown
paths (e.g. a `/* /index.html 200` rewrite on Netlify, or `rewrites` on Vercel).
