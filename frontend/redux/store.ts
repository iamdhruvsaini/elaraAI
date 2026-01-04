import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./services/authService";
import { profileApi } from "./services/profileService";
import { vanityApi } from "./services/vanityService";
import { eventsApi } from "./services/eventsService";
import { makeupApi } from "./services/makeupService";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [vanityApi.reducerPath]: vanityApi.reducer,
    [eventsApi.reducerPath]: eventsApi.reducer,
    [makeupApi.reducerPath]: makeupApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(profileApi.middleware)
      .concat(vanityApi.middleware)
      .concat(eventsApi.middleware)
      .concat(makeupApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
