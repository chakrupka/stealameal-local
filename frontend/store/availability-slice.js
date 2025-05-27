const availabilitySlice = createSlice({
    name: 'availability',
    initialState: {
      userAvailability: null,
      loading: false,
      error: null,
    },
    reducers: {
      setAvailability: (state, action) => {
        state.userAvailability = action.payload;
      },
      setLoading: (state, action) => {
        state.loading = action.payload;
      },
      setError: (state, action) => {
        state.error = action.payload;
      },
    },
  });