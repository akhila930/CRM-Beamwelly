import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import axios from 'axios'

// Configure axios to use the correct backend URL
axios.defaults.baseURL = 'http://localhost:8000'

createRoot(document.getElementById("root")!).render(<App />);
