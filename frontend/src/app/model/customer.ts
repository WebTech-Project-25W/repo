import { User } from "./user";

export class Customer extends User {
  status?: string;
  address?: string;
  postcode?: string;
  phone?: string;
  deliveryzone?: string;

  isUpdating?: boolean;
}