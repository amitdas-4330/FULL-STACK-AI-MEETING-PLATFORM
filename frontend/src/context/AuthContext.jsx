import { useState } from "react";

import { AuthContext } from "./AuthContextValue";

const getInitialUser = () => {

  try {

    const storedUser = localStorage.getItem("user");

    return storedUser
      ? JSON.parse(storedUser)
      : null;

  } catch {

    localStorage.removeItem("user");
    return null;

  }

};

const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(getInitialUser);

  const login = (userData) => {

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    setUser(userData);
  };

  const logout = () => {

    localStorage.removeItem("user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
