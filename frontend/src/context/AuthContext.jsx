import { useState } from "react";

import { AuthContext } from "./AuthContextValue";
import { clearMeetingHistory } from "../utils/meetingHistory";

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

  const updateUser = (nextUser) => {

    setUser((currentUser) => {

      if (!currentUser) {
        return currentUser;
      }

      const updatedUser = {
        ...currentUser,
        user: {
          ...currentUser.user,
          ...nextUser,
        },
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      return updatedUser;

    });

  };

  const logout = () => {

    localStorage.removeItem("user");
    clearMeetingHistory();

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
