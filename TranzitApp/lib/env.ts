export const ENV = {
  SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL ?? "http://192.168.1.50:4000",
};

if (!ENV.SERVER_URL) {
  throw new Error("EXPO_PUBLIC_SERVER_URL is not defined");
}
