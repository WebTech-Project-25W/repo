import { User } from "./user";

export class customer extends User {
  status?: string;
  address?: string;
  postcode?: string;
  phone?: string;
  deliveryzone?: string;

  isUpdating?: boolean;
}