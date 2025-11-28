# College Search Platform - Frontend

A modern, interactive React + TypeScript frontend for the College Search Platform with C3.js visualizations.

## 📋 Features

- **Smart School Search** - Filter by cost, outcomes, location, major, and more
- **Side-by-Side Comparison** - Compare up to 10 schools at once
- **Interactive Visualizations** - ROI charts, program trends, state comparisons using C3.js
- **Responsive Design** - Works on desktop, tablet, and mobile
- **TypeScript** - Full type safety for better development experience

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Backend API running (see backend README)

### Installation

```bash
# Navigate to frontend directory
cd college-search-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your backend URL
# REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start
```

The app will open at `http://localhost:3000`

## 📁 Project Structure

```
college-search-frontend/
├── public/
│   ├── index.html              # HTML template
│   └── manifest.json            # PWA manifest
├── src/
│   ├── components/              # Reusable components
│   │   ├── Navbar.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── SchoolCard.tsx
│   │   ├── ROIChart.tsx
│   │   ├── ProgramTrendsChart.tsx
│   │   ├── StateMapChart.tsx
│   │   └── CostVsEarningsChart.tsx
│   ├── pages/                   # Page components
│   │   ├── Home.tsx
│   │   ├── Compare.tsx
│   │   ├── Analytics.tsx
│   │   └── About.tsx
│   ├── services/                # API services
│   │   └── api.ts
│   ├── types/                   # TypeScript types
│   │   └── index.ts
│   ├── utils/                   # Utility functions
│   │   └── helpers.ts
│   ├── styles/                  # CSS styles
│   │   └── App.css
│   ├── App.tsx                  # Main app component
│   └── index.tsx                # Entry point
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🎨 Pages

### 1. Home (Search & Filter)
- Advanced filtering by multiple criteria
- Paginated results
- Add schools to comparison list
- View school cards with key metrics

### 2. Compare
- Side-by-side comparison table
- Compare up to 10 schools
- All major metrics included
- Remove schools from comparison

### 3. Analytics
- ROI comparison chart
- Program earnings trends over time
- State-level comparisons
- Cost vs. earnings scatter plot
- Interactive filters for all charts

### 4. About
- Project information
- Data source details
- Team credits
- Technology stack

## 📊 Visualizations (C3.js)

All charts are built with C3.js for smooth, interactive visualizations:

### ROI Chart
- Bar chart showing return on investment
- Top 15 schools by ROI
- Filterable by state

### Program Trends Chart
- Line chart showing earnings over time
- Multiple timeframes (1yr, 3yr, 5yr after graduation)
- Selectable by CIP code (program)

### State Map Chart
- Bar chart of state-level aggregations
- Toggle between cost, earnings, and completion rate
- Top 20 states displayed

### Cost vs. Earnings Chart
- Scatter plot showing relationship
- Each point is a school
- Hover for details

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root:

```env
# Development
REACT_APP_API_URL=http://localhost:5000/api

# Production (GitHub Pages)
REACT_APP_API_URL=https://your-backend-url.com/api
```

### TypeScript Configuration

The project uses strict TypeScript settings. See `tsconfig.json` for details.

## 🚀 Deployment

### Deploy to GitHub Pages

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**
   ```json
   {
     "homepage": "https://yourusername.github.io/college-search"
   }
   ```

3. **Deploy**
   ```bash
   npm run build
   npm run deploy
   ```

4. **Configure GitHub**
   - Go to repository Settings > Pages
   - Set source to `gh-pages` branch
   - Your site will be live at the homepage URL

### Deploy to Netlify

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Drag build folder to Netlify**
   - Go to app.netlify.com
   - Drag `/build` folder to deploy

3. **Or use Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

## 🔌 API Integration

The frontend connects to the backend API through the `services/api.ts` file:

```typescript
import { schoolsAPI, programsAPI, aggregationsAPI } from './services/api';

// Example: Filter schools
const response = await schoolsAPI.filter({
  state: 'CA',
  cost_max: 30000,
  major: 'computer'
});

// Example: Get program trends
const trends = await programsAPI.getTrends('1102', 2015, 2024);
```

## 🎯 Development

### Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Deploy to GitHub Pages
npm run deploy
```

### Adding New Features

1. **New Page**
   - Create component in `src/pages/`
   - Add route in `src/App.tsx`
   - Add link in `src/components/Navbar.tsx`

2. **New Chart**
   - Create component in `src/components/`
   - Use C3.js for visualization
   - Add to Analytics page or create new page

3. **New API Endpoint**
   - Add function to `src/services/api.ts`
   - Add types to `src/types/index.ts`
   - Use in components with `useState` and `useEffect`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## 📱 Responsive Design

The app is fully responsive with breakpoints at:
- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px

## 🎨 Styling

Custom CSS using CSS variables for theming:

```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #10b981;
  --accent-color: #f59e0b;
  /* ... */
}
```

## 🐛 Troubleshooting

### CORS Errors
- Ensure backend has correct CORS_ORIGINS in `.env`
- Check REACT_APP_API_URL points to correct backend

### Charts Not Rendering
- Verify C3.js CSS is loaded in `public/index.html`
- Check browser console for errors
- Ensure data is not empty

### Build Errors
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version: `node -v` (should be 16+)

## 📚 Learn More

- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [C3.js Documentation](https://c3js.org/)
- [React Router](https://reactrouter.com/)

## 👥 Team

- **Humphry Amoakone** - Backend & Database
- **Elisa Rosnes** - Frontend & Visualization

## 📄 License

Educational use only - College Scorecard data is public domain.

---

**Need Help?** Check the backend README for API documentation!
