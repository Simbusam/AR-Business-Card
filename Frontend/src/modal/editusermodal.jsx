import React, { useState, useEffect, useRef } from "react";
import API from "../services/api";
import { themeColors } from "../config/theme";

const EditUserModal = ({ user, onClose, onUserUpdated, positionRef }) => {
  const modalRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  });

  const [error, setError] = useState(null);
  const [modalStyles, setModalStyles] = useState({ top: 200, left: 100 });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await API.put(`/users/${user._id}`, formData);
      onUserUpdated(response.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
    }
  };

  // Auto close if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Calculate modal position
  useEffect(() => {
    if (positionRef?.current) {
      const rect = positionRef.current.getBoundingClientRect();
      const modalWidth = 364;
      const spacing = 12;

      const left = Math.min(
        rect.left + window.scrollX,
        window.innerWidth - modalWidth - 24
      );

      const top = rect.bottom + window.scrollY + spacing;

      setModalStyles({ top, left });
    }
  }, [positionRef]);

  return (
    <div
      ref={modalRef}
      className="absolute z-50 p-6 rounded-xl shadow-lg"
      style={{
        top: `${modalStyles.top}px`,
        left: `${modalStyles.left}px`,
        backgroundColor: themeColors.primaryDark,
        border: `1px solid ${themeColors.primaryPurple}`,
        width: "320px",
      }}
    >
      <h2 className="text-xl font-semibold text-white mb-3">Edit User</h2>
      {error && <p className="mb-2 text-red-400">{error}</p>}

      <form onSubmit={handleSubmit}>
        {["firstName", "lastName", "email"].map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={formData[field]}
            onChange={handleChange}
            className="w-full p-2 mb-3 rounded-lg"
            style={{
              backgroundColor: themeColors.primaryPurple + "22",
              color: themeColors.textLight,
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
            required
          />
        ))}

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="w-full p-2 mb-3 rounded-lg"
          style={{
            backgroundColor: themeColors.primaryPurple + "22",
            color: themeColors.textLight,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <option value="" disabled hidden>
            Select Role
          </option>
          <option value="admin" style={{ color: "black" }}>Admin</option>
          <option value="user" style={{ color: "black" }}>User</option>
        </select>

        <div className="flex gap-3">
          <button
            type="submit"
            style={{ backgroundColor: themeColors.secondaryCyan }}
            className="flex-1 p-2 rounded-lg text-white hover:opacity-90"
          >
            Update
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: themeColors.accentPink }}
            className="flex-1 p-2 rounded-lg text-white hover:opacity-90"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUserModal;