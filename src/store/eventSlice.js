import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import eventService from "../services/eventService";

export const fetchActiveEvent = createAsyncThunk(
  "event/fetchActiveEvent",
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventService.getActive();
      return response.data?.data || response.data;
    } catch (error) {
      if (error.response?.status === 404) return null;
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
    fetched: false,
  },
  reducers: {
    clearActiveEvent(state) {
      state.activeEventId = null;
      state.activeEvent = null;
      state.error = null;
      state.fetched = false;
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
        state.fetched = true;
        const event = action.payload;
        state.activeEvent = event;
        state.activeEventId = event?.id ?? event?.eventId ?? null;
      })
      .addCase(fetchActiveEvent.rejected, (state, action) => {
        state.loading = false;
        state.fetched = true;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearActiveEvent } = eventSlice.actions;
export default eventSlice.reducer;
