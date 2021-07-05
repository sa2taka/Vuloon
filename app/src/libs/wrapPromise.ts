export const wrapPromise = <T>(promise: Promise<T>) => {
  let status: 'pending' | 'fulfilled' | 'rejected' = 'pending';
  let result: T;

  const suspender = promise.then(
    (r) => {
      console.log(status);
      status = 'fulfilled';
      result = r;
    },
    (e) => {
      console.log(status);
      status = 'rejected';
      result = e;
    }
  );

  const read = () => {
    if (status === 'pending') {
      throw suspender;
    } else if (status === 'rejected') {
      throw result;
    } else {
      return result;
    }
  };

  return { read };
};
