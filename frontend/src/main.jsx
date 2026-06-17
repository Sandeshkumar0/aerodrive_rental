import React from 'react'
import ReactDOM from 'react-dom/client'
import { IKContext } from 'imagekitio-react'
import App from './App.jsx'
import './index.css'
import { ErrorBoundary } from './ErrorBoundary.jsx'

const imagekitUrlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <IKContext urlEndpoint={imagekitUrlEndpoint}>
        <App />
      </IKContext>
    </ErrorBoundary>
  </React.StrictMode>,
)
