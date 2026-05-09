// import React from "react";

// const ThemeOption = ({ bg, border, theme }) => {
//     const changeTheme = (theme) => {
//         console.log("Change theme");
//         document.getElementById("App").setAttribute("data-theme", theme);
//         localStorage.setItem('theme', theme);
//     };

//     return (
//         <div
//             onClick={() => changeTheme(theme)}
//             className="theme-option"
//             style={{ backgroundColor: bg, borderColor: border }}
//         ></div>
//     );
// };

// export default ThemeOption;
import React from "react";

const ThemeOption = ({ bg, border, theme }) => {
    const changeTheme = (theme) => {
        // Update localStorage
        localStorage.setItem('theme', theme);

        // Update the data-theme attribute on the HTML element
        document.documentElement.setAttribute("data-theme", theme);
    };

    return (
        <div
            onClick={() => changeTheme(theme)}
            className="theme-option"
            style={{ backgroundColor: bg, borderColor: border }}
        ></div>
    );
};

export default ThemeOption;
