import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { calculateStrength } from "../utils/passwordUtils";

const PasswordInput = ({
  value,
  onChange,
  placeholder = "Password",
  errors = [],
  showStrengthMeter = true,
  className = "",
  inputClassName = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const strength = calculateStrength(value);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={
            inputClassName ||
            "w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          }
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          {showPassword ? (
            <FiEyeOff className="h-5 w-5" />
          ) : (
            <FiEye className="h-5 w-5" />
          )}
        </button>
      </div>

      {showStrengthMeter && value && (
        <div className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Password Strength:</span>
            <span
              className={`font-medium ${strength.color
                .replace("bg-", "text-")
                .replace("-500", "-600")}`}
            >
              {strength.label} ({Math.round(strength.percentage)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
              style={{ width: `${strength.percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
