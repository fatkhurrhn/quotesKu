import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AutoToTop from './components/AutoToTop';
import Home from './pages/Home';
import AddQuotes from './pages/AddQuotes';
import ManageQuotes from './pages/ManageQuotes';
import Storythur from './pages/storythur';
import Saluran from './pages/saluran';
import Fatkhurrhn from './pages/fatkhurrhn';


function App() {
  return (
    <Router>
      <AutoToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddQuotes />} />
        <Route path="/manage" element={<ManageQuotes />} />
        <Route path="/storythur" element={<Storythur />} />
        <Route path="/saluran" element={<Saluran />} />
        <Route path="/fatkhurrhn" element={<Fatkhurrhn />} />
      </Routes>
    </Router>
  );
}

export default App;
