import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/axiosInstance";

export const fetchMyTeam = createAsyncThunk(
  "team/fetchMyTeam",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/teams/my-team");
      return res.data?.data || null;
    } catch (error) {
      // 404 = chưa có team, không phải lỗi
      if (error.response?.status === 404) return null;
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải thông tin team.",
      );
    }
  },
);

const teamSlice = createSlice({
  name: "team",
  initialState: {
    myTeam: null, // null = chưa fetch hoặc chưa có team
    loading: false,
    error: null,
    fetched: false, // đã fetch ít nhất 1 lần chưa
  },
  reducers: {
    clearMyTeam(state) {
      state.myTeam = null;
      state.error = null;
      state.fetched = false;
    },
    updateMyTeam(state, action) {
      state.myTeam = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.myTeam = action.payload;
        state.fetched = true;
      })
      .addCase(fetchMyTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.fetched = true;
      });
  },
});

export const { clearMyTeam, updateMyTeam } = teamSlice.actions;
export default teamSlice.reducer;
