export interface PaymentProps {
  fullName: string;
  email: string;
  amount: number;
  driverId: number | string;
  rideTime: number;
  paymentMethod: "paystack" | "wallet";
  userId: string;
}
