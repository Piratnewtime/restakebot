//import React from 'react';
//import logo from './logo.svg';
//import './App.css';
import './Common.css'

import Profile from './Profile';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <script src="https://unpkg.com/react-bootstrap@next/dist/react-bootstrap.min.js" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"
          integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3"
          crossOrigin="anonymous"
        />
      </header>
      <Profile />
    </div>
  );
}

export default App;
