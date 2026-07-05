import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/axiosInstance";

export const fetchActiveEvent = createAsyncThunk(
  "event/fetchActiveEvent",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/events/active");
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải thông tin sự kiện hoạt động."
      );
    }
  }
);

const eventSlice = createSlice({
  name: "event",
  initialState: {
    activeEventId: null,
    activeEvent: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearActiveEvent(state) {
      state.activeEventId = null;
      state.activeEvent = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveEvent.fulfilled, (state, action) => {
        state.loading = false;
        const event = action.payload;
        state.activeEvent = event;
        state.activeEventId = event?.id ?? event?.eventId ?? null;
      })
      .addCase(fetchActiveEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearActiveEvent } = eventSlice.actions;
export default eventSlice.reducer;
