import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner({ label = 'Loading' }) {
  return (
    <div className="loading-spinner" role="status">
      <span className="loading-spinner__mark" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}

export default LoadingSpinner;
