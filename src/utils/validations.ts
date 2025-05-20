export const isValidEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isValidUsername = (username: string) => {
  const regex = /^[a-zA-Z0-9_-]{3,30}$/;
  return regex.test(username);
}
