import { useEffect } from 'react';

const AutoToTop = ({ activePage }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage]); // Scroll ke atas setiap kali activePage berubah

  return null;
};

export default AutoToTop;