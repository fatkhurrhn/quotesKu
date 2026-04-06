import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AutoToTop from './components/AutoToTop';
import Home from './pages/Home';
import AddQuotes from './pages/AddQuotes';
import ManageQuotes from './pages/ManageQuotes';
import Storythur from './pages/SStorythur';
import Fatkhurrhn from './pages/FFatkhurrhn';
import Saluran from './pages/SSaluran';
import Search from './pages/Search';

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
        <Route path="/search" element={<Search />} />
      </Routes>
    </Router>
  );
}

export default App;
