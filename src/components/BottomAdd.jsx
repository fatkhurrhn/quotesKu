import React from "react";
import { useNavigate } from "react-router-dom";

export default function BottomAdd() {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate("/add")}
            className="fixed bottom-[20px] right-6 w-9 h-9 rounded-full bg-[#355485] shadow-lg flex items-center justify-center text-white text-[20px] hover:bg-[#2a436c] transition z-50"
            title="Tambah Quote"
        >
            <i className="ri-add-line"></i>
        </button>
    );
}
