import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import eventReducer from "./eventSlice";
import teamReducer from "./teamSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    event: eventReducer,
    team: teamReducer,
  },
});

export default store;
