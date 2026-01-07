import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  MakeupSessionResponse,
  StyleSessionResponse,
  MakeupPlanResponse,
} from "./types";

interface MakeupSessionState {
  // Session data
  currentSession: MakeupSessionResponse | null;
  styleSession: StyleSessionResponse | null;
  makeupPlan: MakeupPlanResponse | null;

  // Live session state
  currentStepIndex: number;
  completedSteps: number[];
  isVoiceActive: boolean;
  isPaused: boolean;
  sessionStartTime: string | null;
  elapsedSeconds: number;
}

const initialState: MakeupSessionState = {
  currentSession: null,
  styleSession: null,
  makeupPlan: null,
  currentStepIndex: 0,
  completedSteps: [],
  isVoiceActive: false,
  isPaused: false,
  sessionStartTime: null,
  elapsedSeconds: 0,
};

const makeupSessionSlice = createSlice({
  name: "makeupSession",
  initialState,
  reducers: {
    // Store session data
    setCurrentSession: (state, action: PayloadAction<MakeupSessionResponse>) => {
      state.currentSession = action.payload;
    },
    setStyleSession: (state, action: PayloadAction<StyleSessionResponse>) => {
      state.styleSession = action.payload;
    },
    setMakeupPlan: (state, action: PayloadAction<MakeupPlanResponse>) => {
      state.makeupPlan = action.payload;
    },

    // Live session controls
    setCurrentStepIndex: (state, action: PayloadAction<number>) => {
      state.currentStepIndex = action.payload;
    },
    completeStep: (state, action: PayloadAction<number>) => {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
      // Move to next step if available
      if (state.makeupPlan && state.currentStepIndex < state.makeupPlan.steps.length - 1) {
        state.currentStepIndex = state.currentStepIndex + 1;
      }
    },
    toggleVoice: (state) => {
      state.isVoiceActive = !state.isVoiceActive;
    },
    setVoiceActive: (state, action: PayloadAction<boolean>) => {
      state.isVoiceActive = action.payload;
    },
    togglePause: (state) => {
      state.isPaused = !state.isPaused;
    },
    setPaused: (state, action: PayloadAction<boolean>) => {
      state.isPaused = action.payload;
    },
    startLiveSession: (state) => {
      state.sessionStartTime = new Date().toISOString();
      state.currentStepIndex = 0;
      state.completedSteps = [];
      state.isPaused = false;
      state.elapsedSeconds = 0;
    },
    updateElapsedTime: (state, action: PayloadAction<number>) => {
      state.elapsedSeconds = action.payload;
    },

    // Reset session
    resetSession: (state) => {
      return initialState;
    },
  },
});

export const {
  setCurrentSession,
  setStyleSession,
  setMakeupPlan,
  setCurrentStepIndex,
  completeStep,
  toggleVoice,
  setVoiceActive,
  togglePause,
  setPaused,
  startLiveSession,
  updateElapsedTime,
  resetSession,
} = makeupSessionSlice.actions;

export default makeupSessionSlice.reducer;
