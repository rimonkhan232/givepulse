export default function BloodGroupBadge({ group, size = "md", pulse = false, theme = "brand" }) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-14 h-14 text-base",
  };
  const gradient = theme === "admin" ? "gradient-admin" : "gradient-brand";
  const shadow = theme === "admin" ? "shadow-sky-900/20" : "shadow-crimson-900/20";
  return (
    <div
      className={`${sizes[size]} rounded-2xl ${gradient} text-white font-bold flex items-center justify-center shadow-md ${shadow} ${
        pulse ? "animate-pulsering" : ""
      }`}
    >
      {group}
    </div>
  );
}
