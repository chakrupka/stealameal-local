const createErrorSlice = (set) => ({
  all: [],
  latest: {},
  newError: (error) => {
    set(
      ({ errorSlice }) => {
        errorSlice.all.push(error);
        errorSlice.latest = error;
      },
      false,
      'errors/newError',
    );
  },
});

export default createErrorSlice;

//immer middleware 