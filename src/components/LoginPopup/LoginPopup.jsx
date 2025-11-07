import React, { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const LoginPopup = ({ setShowLogin }) => {
  const {url, setToken, setUserType: setContextUserType } = useContext(StoreContext);
  const [currentState, setCurrentState] = useState("Login");
  const [userType, setUserType] = useState("user"); // "user" or "admin"
  const [data, setData] = useState({
    username: "",
    email: "",
    userId: "", // For admin login
    password: "",
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    let newUrl = url;
    let requestData = { ...data };
    
    if (userType === "admin") {
      if (currentState === "Login") {
        if (!data.userId || !data.password) {
          toast.error("Please fill in all required fields.");
          return;
        }
        newUrl += "/api/admin/login";
        requestData = {
          userId: data.userId.trim(),
          password: data.password
        };
      } else {
        if (!data.username || !data.userId || !data.password) {
          toast.error("Please fill in all required fields.");
          return;
        }
        newUrl += "/api/admin/register";
        requestData = {
          name: data.username.trim(),
          userId: data.userId.trim(),
          password: data.password
        };
      }
    } else {
      if (currentState === "Login") {
        if (!data.email || !data.password) {
          toast.error("Please fill in all required fields.");
          return;
        }
        newUrl += "/api/user/login";
        requestData = {
          email: data.email.trim(),
          password: data.password
        };
      } else {
        if (!data.username || !data.email || !data.password) {
          toast.error("Please fill in all required fields.");
          return;
        }
        newUrl += "/api/user/register";
        requestData = {
          name: data.username.trim(),
          email: data.email.trim(),
          password: data.password
        };
      }
    }
    
    try {
      const response = await axios.post(newUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userType", userType);
        setContextUserType(userType);
        toast.success(`${userType === "admin" ? "Admin" : "User"} Login Successfully`);
        setShowLogin(false);
      } else {
        toast.error(response.data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login/Register error:", error);
      console.error("Request URL:", newUrl);
      console.error("Request Data:", requestData);
      console.error("Response:", error.response?.data);
      
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;
        
        switch (status) {
          case 400:
            toast.error(responseData?.message || "Invalid request. Please check your input.");
            break;
          case 401:
            toast.error(responseData?.message || "Invalid email or password.");
            break;
          case 404:
            toast.error(responseData?.message || "Endpoint not found. Please contact support.");
            break;
          case 500:
            toast.error(responseData?.message || "Server error. The backend service may be experiencing issues. Please try again later.");
            console.error("Server error details:", responseData);
            break;
          case 502:
          case 503:
            toast.error("Service temporarily unavailable. Please try again later.");
            break;
          default:
            toast.error(responseData?.message || `Error ${status}: Something went wrong. Please try again.`);
        }
      } else if (error.request) {
        toast.error("Network error. Unable to reach the server. Please check your connection.");
      } else {
        toast.error(error.message || "An unexpected error occurred. Please try again.");
      }
    }
  };
  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className={`login-popup-container ${userType === "admin" ? "admin-mode" : ""}`}>
        <div className="login-popup-title">
          <h2>{userType === "admin" ? "Admin " : ""}{currentState}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt=""
          />
        </div>
        
        <div className="login-popup-user-type">
          <button
            type="button"
            className={userType === "user" ? "active" : ""}
            onClick={() => {
              setUserType("user");
              setData({ username: "", email: "", userId: "", password: "" });
            }}
          >
            User
          </button>
          <button
            type="button"
            className={userType === "admin" ? "active" : ""}
            onClick={() => {
              setUserType("admin");
              setData({ username: "", email: "", userId: "", password: "" });
            }}
          >
            Admin
          </button>
        </div>

        <div className="login-popup-inputs">
          {userType === "admin" ? (
            <>
              {currentState === "Login" ? (
                <>
                  <input
                    name="userId"
                    onChange={onChangeHandler}
                    value={data.userId}
                    type="text"
                    placeholder="User ID"
                    required
                  />
                  <input
                    name="password"
                    onChange={onChangeHandler}
                    value={data.password}
                    type="password"
                    placeholder="Password"
                    required
                  />
                </>
              ) : (
                <>
                  <input
                    name="username"
                    onChange={onChangeHandler}
                    value={data.username}
                    type="text"
                    placeholder="Username"
                    required
                  />
                  <input
                    name="userId"
                    onChange={onChangeHandler}
                    value={data.userId}
                    type="text"
                    placeholder="User ID"
                    required
                  />
                  <input
                    name="password"
                    onChange={onChangeHandler}
                    value={data.password}
                    type="password"
                    placeholder="Password"
                    required
                  />
                </>
              )}
            </>
          ) : (
            <>
              {currentState === "Login" ? (
                <>
                  <input
                    name="email"
                    onChange={onChangeHandler}
                    value={data.email}
                    type="email"
                    placeholder="Your email"
                    required
                  />
                  <input
                    name="password"
                    onChange={onChangeHandler}
                    value={data.password}
                    type="password"
                    placeholder="Your password"
                    required
                  />
                </>
              ) : (
                <>
                  <input
                    name="username"
                    onChange={onChangeHandler}
                    value={data.username}
                    type="text"
                    placeholder="Username"
                    required
                  />
                  <input
                    name="email"
                    onChange={onChangeHandler}
                    value={data.email}
                    type="email"
                    placeholder="Your email"
                    required
                  />
                  <input
                    name="password"
                    onChange={onChangeHandler}
                    value={data.password}
                    type="password"
                    placeholder="Your password"
                    required
                  />
                </>
              )}
            </>
          )}
        </div>
        <button type="submit" className={userType === "admin" ? "admin-login-btn" : ""}>
          {currentState === "Sign Up" ? "Create Account" : "Login"}
        </button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, i agree to the terms of use & privacy policy.</p>
        </div>
        {currentState === "Login" ? (
          <p>
            Create a new account?{" "}
            <span onClick={() => setCurrentState("Sign Up")}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <span onClick={() => setCurrentState("Login")}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;