import React from "react";
import { Link, useLocation } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: "ri-home-4-line", activeIcon: "ri-home-4-fill", label: "Home" },
    { path: "/storythur", icon: "ri-instagram-line", activeIcon: "ri-instagram-fill", label: "Storythur" },
    { path: "/add", icon: "ri-add-line", activeIcon: "ri-add-line", label: "Tambah", isCenter: true },
    { path: "/fatkhurrhn", icon: "ri-instagram-line", activeIcon: "ri-instagram-fill", label: "Fatkhurrhn" },
    { path: "/saluran", icon: "ri-broadcast-line", activeIcon: "ri-broadcast-fill", label: "Saluran" },
  ];

  const normalizedPathname = (() => {
    const p = location.pathname.replace(/\/+$/, "");
    return p === "" ? "/" : p;
  })();

  return (
    <div className="fixed max-w-xl mx-auto bottom-0 left-0 right-0 z-50 bg-[#fcfeff] shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-5 h-16 items-center relative">
        {navItems.map((item) => {
          const isActive = normalizedPathname === item.path;

          // SPECIAL CENTER BUTTON
          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center justify-center"
              >
                <div className="absolute -top-6 bg-[#355485] w-14 h-14 rounded-full flex items-center justify-center shadow-lg">
                  <i className="ri-add-line text-white text-3xl"></i>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center text-[11px]"
            >
              <i
                className={`${isActive ? item.activeIcon : item.icon} text-[22px] ${isActive ? "text-[#355485]" : "text-[#44515f]"
                  }`}
              ></i>
              <span
                className={
                  isActive
                    ? "text-[#355485] font-medium"
                    : "text-[#44515f]"
                }
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;