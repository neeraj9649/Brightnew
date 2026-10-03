/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}", // ✅ include CRA src files
    ],
    theme: {
        extend: {
            // Bright Wings brand (amber/gold from the logo). Matches Tailwind's
            // default amber-500/600/700, exposed as `primary` for semantic use.
            colors: {
                primary: {
                    DEFAULT: "#f59e0b",
                    hover: "#d97706",
                    active: "#b45309",
                },
            },
            // MembershipCard decorative animations (moved off MembershipCard.css).
            keyframes: {
                float: {
                    "0%,100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                "holo-shift": {
                    "0%,100%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                },
                shine: {
                    "0%": { transform: "translateX(-100%) translateY(-100%) rotate(45deg)" },
                    "50%,100%": { transform: "translateX(100%) translateY(100%) rotate(45deg)" },
                },
            },
            animation: {
                float: "float 20s ease-in-out infinite",
                "holo-shift": "holo-shift 3s ease-in-out infinite",
                shine: "shine 4s ease-in-out infinite",
            },
        },
    },
    plugins: [],
};

